import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/admin/class-credit?classId=xxx
// Returns calculated credit/deduction amounts for a class (for pre-populating the modal)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 })
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        student: {
          include: {
            parent: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        subject: { select: { name: true } },
      },
    })

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const classDuration = classRecord.duration || 60
    const studentFacingRate = Number(classRecord.teacher.studentFacingRate ?? classRecord.teacher.compensationRate)
    const compensationRate = Number(classRecord.teacher.compensationRate)

    const calculatedCreditAmount = Math.round(studentFacingRate * (classDuration / 60) * 100) / 100
    const calculatedDeductionAmount = Math.round(compensationRate * (classDuration / 60) * 100) / 100

    // Check if already credited
    const existingCredit = await prisma.walletTransaction.findFirst({
      where: {
        type: "ADMIN_ADJUSTMENT",
        referenceId: `CLASS_CREDIT-${classId}`,
      },
    })

    return NextResponse.json({
      classId,
      studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
      parentName: classRecord.student.parent
        ? `${classRecord.student.parent.user.firstName} ${classRecord.student.parent.user.lastName}`
        : "—",
      teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
      subject: classRecord.subject.name,
      duration: classDuration,
      studentFacingRate,
      compensationRate,
      calculatedCreditAmount,
      calculatedDeductionAmount,
      alreadyCredited: !!existingCredit,
    })
  } catch (error) {
    console.error("GET /api/admin/class-credit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/class-credit
// Admin credits parent wallet for a disputed completed class
// and deducts from the teacher's payout for that period.
//
// Body: {
//   classId: string,
//   reason: string        (required — audit trail note)
//   creditAmount?: number (optional — admin-editable, defaults to calculated)
//   deductionAmount?: number (optional — admin-editable, defaults to calculated)
// }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { classId, reason, creditAmount: customCredit, deductionAmount: customDeduction } = body

    if (!classId || typeof classId !== "string") {
      return NextResponse.json({ error: "classId is required" }, { status: 400 })
    }
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "reason is required for audit trail" }, { status: 400 })
    }

    // Fetch the class with all necessary relations
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        student: {
          include: {
            parent: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        teacher: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        subject: { select: { name: true } },
        package: { select: { id: true, classesUsed: true, classesIncluded: true } },
      },
    })

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (classRecord.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed classes can be credited. Current status: " + classRecord.status },
        { status: 400 }
      )
    }

    // Check if already credited
    const existingCredit = await prisma.walletTransaction.findFirst({
      where: {
        type: "ADMIN_ADJUSTMENT",
        referenceId: `CLASS_CREDIT-${classId}`,
      },
    })

    if (existingCredit) {
      return NextResponse.json(
        { error: "This class has already been credited to the parent's wallet" },
        { status: 409 }
      )
    }

    // Calculate default amounts
    const classDuration = classRecord.duration || 60
    const studentFacingRate = Number(classRecord.teacher.studentFacingRate ?? classRecord.teacher.compensationRate)
    const compensationRate = Number(classRecord.teacher.compensationRate)

    const defaultCreditAmount = Math.round(studentFacingRate * (classDuration / 60) * 100) / 100
    const defaultDeductionAmount = Math.round(compensationRate * (classDuration / 60) * 100) / 100

    // Use admin-provided amounts if valid, otherwise use calculated defaults
    const creditAmount =
      typeof customCredit === "number" && customCredit > 0
        ? Math.round(customCredit * 100) / 100
        : defaultCreditAmount
    const deductionAmount =
      typeof customDeduction === "number" && customDeduction > 0
        ? Math.round(customDeduction * 100) / 100
        : defaultDeductionAmount

    if (!classRecord.student.parentId) {
      return NextResponse.json(
        { error: "Student has no linked parent profile" },
        { status: 400 }
      )
    }

    const parentProfileId = classRecord.student.parentId

    // Determine the payout period for this class
    const completedDate = classRecord.completedAt || classRecord.scheduledAt
    const periodMonth = completedDate.getMonth() + 1
    const periodYear = completedDate.getFullYear()

    const teacherName = `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`
    const studentName = `${classRecord.student.firstName} ${classRecord.student.lastName}`
    const parentName = classRecord.student.parent
      ? `${classRecord.student.parent.user.firstName} ${classRecord.student.parent.user.lastName}`
      : "Unknown"
    const subjectName = classRecord.subject.name
    const scheduledFormatted = classRecord.scheduledAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    // Perform all updates in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // ── 1. Credit parent wallet ──
      let wallet = await tx.wallet.findUnique({
        where: { parentProfileId },
      })

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { parentProfileId, balance: 0 },
        })
      }

      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: creditAmount,
          type: "ADMIN_ADJUSTMENT",
          description: `Class credit: ${subjectName} on ${scheduledFormatted} (Teacher: ${teacherName}). Reason: ${reason.trim()}`,
          referenceId: `CLASS_CREDIT-${classId}`,
        },
      })

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: creditAmount } },
      })

      // ── 2. Notify parent ──
      if (classRecord.student.parent) {
        await tx.notification.create({
          data: {
            userId: classRecord.student.parent.userId,
            type: "SYSTEM",
            title: "Class Credit Applied",
            message: `$${creditAmount.toFixed(2)} has been credited to your wallet for ${studentName}'s ${subjectName} class on ${scheduledFormatted}. Reason: ${reason.trim()}`,
          },
        })
      }

      // ── 3. Deduct from teacher's payout ──
      const existingPayout = await tx.payout.findFirst({
        where: { teacherId: classRecord.teacherId, periodMonth, periodYear },
      })

      let payoutUpdate = null
      const creditNote = `[Class Credit] ${scheduledFormatted} - ${subjectName} (${studentName}): -$${deductionAmount.toFixed(2)} — ${reason.trim()}`

      if (existingPayout) {
        if (["PENDING", "PROCESSING"].includes(existingPayout.status)) {
          const currentDeductions = Number(existingPayout.deductions)
          const newDeductions = currentDeductions + deductionAmount
          const gross = Number(existingPayout.grossAmount)
          const currentBonus = Number(existingPayout.bonus)
          const newNet = gross - newDeductions + currentBonus

          payoutUpdate = await tx.payout.update({
            where: { id: existingPayout.id },
            data: {
              deductions: newDeductions,
              netAmount: newNet,
              adminNotes: existingPayout.adminNotes
                ? `${existingPayout.adminNotes}\n${creditNote}`
                : creditNote,
            },
          })
        } else {
          payoutUpdate = await tx.payout.update({
            where: { id: existingPayout.id },
            data: {
              adminNotes: existingPayout.adminNotes
                ? `${existingPayout.adminNotes}\n[POST-PAID] ${creditNote} (Payout already ${existingPayout.status}. Apply to next period.)`
                : `[POST-PAID] ${creditNote} (Payout already ${existingPayout.status}. Apply to next period.)`,
            },
          })
        }
      }

      // ── 4. Mark the class with credit note ──
      await tx.class.update({
        where: { id: classId },
        data: {
          cancelReason: `[ADMIN CREDIT] ${reason.trim()} — $${creditAmount.toFixed(2)} credited to parent wallet, $${deductionAmount.toFixed(2)} deducted from teacher payout.`,
        },
      })

      // ── 5. Reduce package classesUsed if linked ──
      if (classRecord.packageId && classRecord.package) {
        const currentUsed = classRecord.package.classesUsed
        if (currentUsed > 0) {
          await tx.package.update({
            where: { id: classRecord.packageId },
            data: { classesUsed: { decrement: 1 } },
          })
        }
      }

      // ── 6. Notify teacher ──
      await tx.notification.create({
        data: {
          userId: classRecord.teacher.user.id,
          type: "SYSTEM",
          title: "Class Completion Disputed",
          message: `Your ${subjectName} class with ${studentName} on ${scheduledFormatted} has been disputed by admin. $${deductionAmount.toFixed(2)} has been deducted from your payout. Reason: ${reason.trim()}`,
        },
      })

      return { walletTx, updatedWallet, payoutUpdate, creditAmount, deductionAmount }
    })

    return NextResponse.json({
      message: "Class credit applied successfully",
      details: {
        classId,
        studentName,
        parentName,
        teacherName,
        subject: subjectName,
        scheduledAt: scheduledFormatted,
        parentWalletCredit: `$${result.creditAmount.toFixed(2)}`,
        teacherPayoutDeduction: `$${result.deductionAmount.toFixed(2)}`,
        newParentWalletBalance: `$${Number(result.updatedWallet.balance).toFixed(2)}`,
        payoutAdjusted: result.payoutUpdate
          ? {
              payoutId: result.payoutUpdate.id,
              status: result.payoutUpdate.status,
              newDeductions: `$${Number(result.payoutUpdate.deductions).toFixed(2)}`,
              newNet: `$${Number(result.payoutUpdate.netAmount).toFixed(2)}`,
            }
          : "No payout record exists yet for this period. Deduction will apply when payout is generated.",
      },
    })
  } catch (error) {
    console.error("POST /api/admin/class-credit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
