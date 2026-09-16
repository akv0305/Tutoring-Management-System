import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email"
import BookingConfirmation from "@/emails/booking-confirmation"
import TeacherNewClass from "@/emails/teacher-new-class"
import { formatDateTime, getTzAbbr } from "@/lib/timezone"

// ── helpers (same as classes/route.ts) ──

function fmtDateTz(date: Date, timezone: string): string {
  const abbr = getTzAbbr(timezone, date)
  return `${formatDateTime(date, timezone)} ${abbr}`
}

function fmtShortDateTz(date: Date, timezone: string): string {
  const abbr = getTzAbbr(timezone, date)
  const short = date.toLocaleDateString("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  })
  const time = date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  })
  return `${short} at ${time} ${abbr}`
}

function generateOrderRef(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let suffix = ""
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `ORD-${dateStr}-${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!["ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      studentId,
      teacherId,
      subjectId,
      slots,
      isCustomSlot,
      couponCode,
      templateId,
    } = body

    if (!studentId || !teacherId || !subjectId) {
      return NextResponse.json(
        { error: "studentId, teacherId, and subjectId are required" },
        { status: 400 }
      )
    }

    const slotList: string[] = Array.isArray(slots) ? slots : []
    if (slotList.length === 0) {
      return NextResponse.json(
        { error: "At least one slot is required" },
        { status: 400 }
      )
    }

    const classDuration = 60

    // ── Fetch all required entities ──
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        gradeRef: {
          include: {
            gradeBand: { select: { id: true, displayName: true } },
          },
        },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    if (!student.parent) {
      return NextResponse.json({ error: "Student has no linked parent" }, { status: 400 })
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true },
    })
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { id: student.parentId! },
      select: { id: true, timezone: true, userId: true },
    })
    if (!parentProfile) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    const parentTZ = parentProfile.timezone || "America/New_York"
    const teacherTZ = teacher.timezone || "Asia/Kolkata"

    // ── Grade-based rate lookup ──
    const gradeBandId = (student as any).gradeRef?.gradeBand?.id || null
    let snapshotCompensationRate: number = Number(teacher.compensationRate)
    let snapshotStudentFacingRate: number = Number(teacher.studentFacingRate)

    if (gradeBandId) {
      const gradeRate = await prisma.teacherSubjectRate.findFirst({
        where: { teacherId, subjectId, gradeBandId, isActive: true },
      })
      if (gradeRate) {
        snapshotCompensationRate = Number(gradeRate.compensationRate)
        snapshotStudentFacingRate = Number(gradeRate.studentFacingRate)
      }
    }

    // ── Validate package template ──
    let template: {
      id: string; name: string; subjectId: string
      classesIncluded: number; validityDays: number; suggestedPrice: number
    } | null = null

    if (templateId) {
      const templateRaw = await prisma.packageTemplate.findUnique({
        where: { id: templateId },
      })
      if (!templateRaw) {
        return NextResponse.json({ error: "Package template not found" }, { status: 404 })
      }
      if (templateRaw.status !== "ACTIVE") {
        return NextResponse.json({ error: "This package template is no longer available" }, { status: 400 })
      }
      if (templateRaw.subjectId !== subjectId) {
        return NextResponse.json({ error: "Package template subject does not match selected subject" }, { status: 400 })
      }
      if (slotList.length !== templateRaw.classesIncluded) {
        return NextResponse.json(
          { error: `This package requires exactly ${templateRaw.classesIncluded} classes. You selected ${slotList.length}.` },
          { status: 400 }
        )
      }
      template = {
        id: templateRaw.id,
        name: templateRaw.name,
        subjectId: templateRaw.subjectId,
        classesIncluded: templateRaw.classesIncluded,
        validityDays: templateRaw.validityDays,
        suggestedPrice: Number(templateRaw.suggestedPrice),
      }
    }

    // ── Calculate total ──
    const perClassAmount = snapshotStudentFacingRate * (classDuration / 60)
    const totalAmount = template
      ? template.suggestedPrice
      : perClassAmount * slotList.length

    // ── Check for conflicts (skip if custom slot — admin override) ──
    if (!isCustomSlot) {
      for (const slot of slotList) {
        const slotDate = new Date(slot)
        const slotEnd = new Date(slotDate.getTime() + classDuration * 60000)

        const conflict = await prisma.class.findFirst({
          where: {
            teacherId,
            status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"] },
            scheduledAt: { lt: slotEnd },
            AND: {
              scheduledAt: {
                gte: new Date(slotDate.getTime() - classDuration * 60000 + 1),
              },
            },
          },
        })

        if (conflict) {
          return NextResponse.json(
            { error: `Teacher has a scheduling conflict at ${fmtShortDateTz(slotDate, teacherTZ)}` },
            { status: 409 }
          )
        }
      }
    }

    // ── Wallet check — MUST have sufficient balance ──
    const wallet = await prisma.wallet.findUnique({
      where: { parentProfileId: parentProfile.id },
    })
    const walletBalance = wallet ? Number(wallet.balance) : 0

    // Apply coupon first to determine how much wallet needs
    let couponDiscount = 0
    let appliedCouponId: string | null = null
    let couponLabel = ""

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: { equals: couponCode.trim().toUpperCase(), mode: "insensitive" },
          status: "ACTIVE",
        },
        include: {
          assignments: { select: { parentProfileId: true } },
        },
      })

      if (coupon) {
        const now = new Date()
        const isWithinDates = now >= new Date(coupon.validFrom) && now <= new Date(coupon.validUntil)
        const isUnderGlobalCap = coupon.maxUsesTotal === null || coupon.usedCount < coupon.maxUsesTotal
        const meetsMinOrder = !coupon.minOrderAmount || totalAmount >= Number(coupon.minOrderAmount)

        let scopeValid = coupon.scope === "ALL_USERS"
        if (!scopeValid && (coupon.scope === "SINGLE_USER" || coupon.scope === "MULTI_USER")) {
          scopeValid = coupon.assignments.some((a: { parentProfileId: string }) => a.parentProfileId === parentProfile.id)
        }

        const userUsageCount = await prisma.couponUsage.count({
          where: { couponId: coupon.id, parentProfileId: parentProfile.id },
        })
        const isUnderUserCap = userUsageCount < coupon.maxUsesPerUser

        if (isWithinDates && isUnderGlobalCap && meetsMinOrder && scopeValid && isUnderUserCap) {
          if (coupon.discountType === "PERCENTAGE") {
            couponDiscount = (totalAmount * Number(coupon.discountValue)) / 100
            if (coupon.maxDiscountAmount && couponDiscount > Number(coupon.maxDiscountAmount)) {
              couponDiscount = Number(coupon.maxDiscountAmount)
            }
          } else {
            couponDiscount = Number(coupon.discountValue)
          }
          if (couponDiscount > totalAmount) couponDiscount = totalAmount
          couponDiscount = Math.round(couponDiscount * 100) / 100
          appliedCouponId = coupon.id
          couponLabel = coupon.discountType === "PERCENTAGE"
            ? `${Number(coupon.discountValue)}% off`
            : `$${Number(coupon.discountValue).toFixed(2)} off`
        } else {
          return NextResponse.json({ error: "Coupon is not valid for this parent or booking." }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 })
      }
    }

    const amountAfterCoupon = Math.round((totalAmount - couponDiscount) * 100) / 100

    if (walletBalance < amountAfterCoupon) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. Required: $${amountAfterCoupon.toFixed(2)}, Available: $${walletBalance.toFixed(2)}. Ask the parent to top up their wallet first.`,
          requiredAmount: amountAfterCoupon,
          walletBalance,
        },
        { status: 400 }
      )
    }

    // ── Execute booking inside transaction ──
    const orderRef = generateOrderRef()

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Conflict check inside transaction for safety
      for (const slot of slotList) {
        const slotDate = new Date(slot)
        const slotEnd = new Date(slotDate.getTime() + classDuration * 60000)

        const conflict = await tx.class.findFirst({
          where: {
            teacherId,
            status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"] },
            scheduledAt: { lt: slotEnd },
            AND: {
              scheduledAt: {
                gte: new Date(slotDate.getTime() - classDuration * 60000 + 1),
              },
            },
          },
        })

        if (conflict) {
          throw new Error(`Teacher has a scheduling conflict at ${fmtShortDateTz(slotDate, teacherTZ)}`)
        }
      }

      // Create package from template if applicable
      let createdPackageId: string | null = null

      if (template) {
        const now = new Date()
        const expiryDate = new Date(now.getTime() + template.validityDays * 24 * 60 * 60 * 1000)

        const newPackage = await tx.package.create({
          data: {
            name: template.name,
            studentId,
            teacherId,
            subjectId,
            classesIncluded: template.classesIncluded,
            classesUsed: 0,
            pricePerClass: template.suggestedPrice / template.classesIncluded,
            totalPrice: template.suggestedPrice,
            validityDays: template.validityDays,
            startDate: now,
            expiryDate,
            status: "ACTIVE",
            templateId: template.id,
          },
        })
        createdPackageId = newPackage.id
      }

      // Apply coupon in transaction
      let txCouponDiscount = 0
      let txAppliedCouponId: string | null = null

      if (appliedCouponId && couponDiscount > 0) {
        txCouponDiscount = couponDiscount
        txAppliedCouponId = appliedCouponId

        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            parentProfileId: parentProfile.id,
            bookingOrderId: null, // updated below
            discountApplied: couponDiscount,
          },
        })

        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } },
        })
      }

      // Apply wallet deduction
      const walletDeduction = amountAfterCoupon
      const txWallet = await tx.wallet.findUnique({
        where: { parentProfileId: parentProfile.id },
      })

      if (!txWallet) throw new Error("Wallet not found in transaction")

      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: txWallet.id,
          amount: -walletDeduction,
          type: "BOOKING_DISCOUNT",
          description: `Wallet used for class booking — $${walletDeduction.toFixed(2)} deducted (booked by ${session.user.role.toLowerCase()})`,
        },
      })

      await tx.wallet.update({
        where: { id: txWallet.id },
        data: { balance: { decrement: walletDeduction } },
      })

      // Build discount notes
      let discountNotes: string | null = null
      if (txCouponDiscount > 0) {
        discountNotes = `Coupon applied (${couponLabel}): -$${txCouponDiscount.toFixed(2)}.`
      }
      if (walletDeduction > 0) {
        const walletNote = `Wallet applied: -$${walletDeduction.toFixed(2)}`
        discountNotes = discountNotes
          ? `${discountNotes} ${walletNote}. Original total: $${totalAmount.toFixed(2)}`
          : `${walletNote}. Original total: $${totalAmount.toFixed(2)}`
      }

      // Payment — fully paid via wallet, amount due = 0
      const payment = await tx.payment.create({
        data: {
          studentId,
          packageId: createdPackageId,
          amount: 0, // fully paid
          walletDeduction,
          couponId: txAppliedCouponId,
          couponDiscount: txCouponDiscount,
          method: "WALLET",
          status: "CONFIRMED",
          adminNotes: `${discountNotes || ""}. Booked by ${session.user.firstName} ${session.user.lastName} (${session.user.role}).`.trim(),
        },
      })

      // Booking order — status PAID
      const bookingOrder = await tx.bookingOrder.create({
        data: {
          orderRef,
          studentId,
          packageId: createdPackageId,
          teacherId,
          subjectId,
          totalClasses: slotList.length,
          totalAmount,
          walletDeduction,
          couponId: txAppliedCouponId,
          couponDiscount: txCouponDiscount,
          status: "PAID",
          paymentId: payment.id,
        },
      })

      // Link coupon usage to booking order
      if (txAppliedCouponId) {
        await tx.couponUsage.updateMany({
          where: {
            couponId: txAppliedCouponId,
            parentProfileId: parentProfile.id,
            bookingOrderId: null,
          },
          data: { bookingOrderId: bookingOrder.id },
        })
      }

      // Link wallet transaction to booking order
      await tx.walletTransaction.update({
        where: { id: walletTx.id },
        data: { referenceId: bookingOrder.id },
      })

      // Create classes — SCHEDULED (fully paid)
      const classRecords = []
      for (const slot of slotList) {
        const newClass = await tx.class.create({
          data: {
            studentId,
            teacherId,
            subjectId,
            packageId: createdPackageId,
            bookingOrderId: bookingOrder.id,
            scheduledAt: new Date(slot),
            duration: classDuration,
            isTrial: false,
            status: "SCHEDULED",
            snapshotCompensationRate,
            snapshotStudentFacingRate,
          },
        })
        classRecords.push(newClass)
      }

      return { payment, bookingOrder, classRecords, createdPackageId }
    })

    // ── Notifications ──
    const studentFullName = `${student.firstName} ${student.lastName}`
    const teacherFullName = `${teacher.user.firstName} ${teacher.user.lastName}`

    // Notify parent
    await prisma.notification.create({
      data: {
        userId: parentProfile.userId,
        type: "PAYMENT",
        title: "New Classes Booked",
        message: `${slotList.length} class${slotList.length > 1 ? "es" : ""} booked for ${studentFullName} with ${teacherFullName} (${subject.name}). $${amountAfterCoupon.toFixed(2)} deducted from your wallet. Order: ${orderRef}.`,
      },
    })

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: teacher.userId,
        type: "CLASS",
        title: "New Classes Assigned",
        message: `${slotList.length} new class${slotList.length > 1 ? "es" : ""} scheduled with ${studentFullName} (${subject.name}). Booked by ${session.user.role.toLowerCase()}.`,
      },
    })

    // ── Emails (non-blocking) ──
    const appUrl = process.env.NEXTAUTH_URL || ""

    const parentFormattedSlots = slotList.map((slot) => fmtDateTz(new Date(slot), parentTZ))
    const teacherFormattedSlots = slotList.map((slot) => fmtDateTz(new Date(slot), teacherTZ))

    if (student.parent?.user?.email) {
      sendEmail({
        to: student.parent.user.email,
        subject: `Classes booked for ${student.firstName} — Expert Guru`,
        react: BookingConfirmation({
          parentName: student.parent.user.firstName,
          studentName: studentFullName,
          teacherName: teacherFullName,
          teacherEmail: teacher.user.email,
          subject: subject.name,
          scheduledSlots: parentFormattedSlots,
          duration: classDuration,
          totalClasses: slotList.length,
          isTrial: false,
          orderRef,
          totalAmount: `$${totalAmount.toFixed(2)}`,
          dashboardUrl: `${appUrl}/parent`,
        }),
      }).catch((err) => console.error("[BookSlot] Parent email failed:", err))
    }

    sendEmail({
      to: teacher.user.email,
      subject: `New classes assigned — ${studentFullName} — Expert Guru`,
      react: TeacherNewClass({
        teacherName: teacher.user.firstName,
        studentName: studentFullName,
        studentGrade: student.grade,
        subject: subject.name,
        scheduledSlots: teacherFormattedSlots,
        duration: classDuration,
        totalClasses: slotList.length,
        isTrial: false,
        dashboardUrl: `${appUrl}/teacher`,
      }),
    }).catch((err) => console.error("[BookSlot] Teacher email failed:", err))

    return NextResponse.json(
      {
        message: `${slotList.length} class${slotList.length > 1 ? "es" : ""} booked and paid via wallet!`,
        orderRef,
        bookingOrderId: result.bookingOrder.id,
        paymentId: result.payment.id,
        packageId: result.createdPackageId,
        classIds: result.classRecords.map((c: { id: string }) => c.id),
        totalClasses: slotList.length,
        totalAmount: `$${totalAmount.toFixed(2)}`,
        couponDiscount: couponDiscount > 0 ? `$${couponDiscount.toFixed(2)}` : null,
        walletDeduction: `$${amountAfterCoupon.toFixed(2)}`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("POST /api/admin/book-slot error:", error)
    const message = error?.message || "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
