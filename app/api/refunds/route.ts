import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import RefundUpdate from "@/emails/refund-update"


// GET /api/refunds
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const where: any = {}

    if (session.user.role === "PARENT") {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!parentProfile) {
        return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
      }
      where.studentId = { in: parentProfile.students.map((s) => s.id) }
    }

    if (session.user.role === "COORDINATOR") {
      const coordProfile = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!coordProfile) {
        return NextResponse.json({ error: "Coordinator profile not found" }, { status: 404 })
      }
      where.studentId = { in: coordProfile.students.map((s) => s.id) }
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    if (status) where.status = status.toUpperCase()

    const refunds = await prisma.refundRequest.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true } },
        payment: {
          select: {
            amount: true,
            method: true,
            createdAt: true,
            package: {
              select: {
                name: true,
                subject: { select: { name: true } },
              },
            },
          },
        },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const mapped = refunds.map((r) => ({
      id: r.id,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      originalPaymentAmount: Number(r.payment.amount),
      originalPaymentFormatted: `$${Number(r.payment.amount).toLocaleString()}`,
      paymentMethod: r.payment.method,
      packageName: r.payment.package?.name ?? "—",
      subject: r.payment.package?.subject?.name ?? "—",
      refundAmount: Number(r.refundAmount),
      refundFormatted: `$${Number(r.refundAmount).toLocaleString()}`,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewedBy
        ? `${r.reviewedBy.firstName} ${r.reviewedBy.lastName}`
        : null,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      processedAt: r.processedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      date: r.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    }))

    const summary = {
      total: mapped.length,
      pending: mapped.filter((r) => r.status === "PENDING").length,
      approved: mapped.filter((r) => r.status === "APPROVED").length,
      rejected: mapped.filter((r) => r.status === "REJECTED").length,
      processed: mapped.filter((r) => r.status === "PROCESSED").length,
      totalRequested: mapped.reduce((sum, r) => sum + r.refundAmount, 0),
      totalApproved: mapped
        .filter((r) => ["APPROVED", "PROCESSED"].includes(r.status))
        .reduce((sum, r) => sum + r.refundAmount, 0),
    }

    return NextResponse.json({ refunds: mapped, total: mapped.length, summary })
  } catch (error) {
    console.error("GET /api/refunds error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/refunds — submit a refund request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "COORDINATOR", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { studentId, paymentId, refundAmount, reason } = body

    if (!studentId || !paymentId || !refundAmount || !reason) {
      return NextResponse.json(
        { error: "studentId, paymentId, refundAmount, and reason are required" },
        { status: 400 }
      )
    }

    // Verify payment exists and is confirmed
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    if (payment.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Can only request refund for confirmed payments" }, { status: 400 })
    }
    if (refundAmount > Number(payment.amount)) {
      return NextResponse.json({ error: "Refund amount cannot exceed payment amount" }, { status: 400 })
    }

    // Check for existing pending refund on same payment
    const existingRefund = await prisma.refundRequest.findFirst({
      where: { paymentId, status: "PENDING" },
    })
    if (existingRefund) {
      return NextResponse.json({ error: "A pending refund request already exists for this payment" }, { status: 409 })
    }

    const refund = await prisma.refundRequest.create({
      data: {
        studentId,
        paymentId,
        refundAmount,
        reason,
        status: "PENDING",
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({
      message: "Refund request submitted successfully",
      refund: {
        id: refund.id,
        student: `${refund.student.firstName} ${refund.student.lastName}`,
        amount: Number(refund.refundAmount),
        status: refund.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/refunds error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/refunds — approve, reject, or process a refund
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json({ error: "Refund request id is required" }, { status: 400 })
    }

    const existing = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            package: { select: { name: true } },
          },
        },
        student: {
          include: {
            parent: {
              include: {
                user: {
                  select: { firstName: true, email: true },
                },
              },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case "approve":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Can only approve a pending refund" }, { status: 400 })
        }
        updateData = {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        }
        break

      case "reject":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Can only reject a pending refund" }, { status: 400 })
        }
        updateData = {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        }
        break

      case "process":
        if (existing.status !== "APPROVED") {
          return NextResponse.json({ error: "Can only process an approved refund" }, { status: 400 })
        }
        updateData = {
          status: "PROCESSED",
          processedAt: new Date(),
        }
        // Mark the original payment as refunded
        await prisma.payment.update({
          where: { id: existing.paymentId },
          data: { status: "REFUNDED" },
        })
        break

      default:
        return NextResponse.json({ error: "Invalid action. Use: approve, reject, process" }, { status: 400 })
    }

    // Send refund update email to parent
    if (
      existing.student?.parent?.user?.email &&
      ["approve", "reject", "process"].includes(action)
    ) {
      const appUrl = process.env.NEXTAUTH_URL || ""
      const statusMap: Record<string, "APPROVED" | "REJECTED" | "PROCESSED"> = {
        approve: "APPROVED",
        reject: "REJECTED",
        process: "PROCESSED",
      }

      sendEmail({
        to: existing.student.parent.user.email,
        subject: `Refund ${action === "approve" ? "approved" : action === "process" ? "processed" : "update"} — Expert Guru`,
        react: RefundUpdate({
          parentName: existing.student.parent.user.firstName,
          studentName: `${existing.student.firstName} ${existing.student.lastName}`,
          refundAmount: Number(existing.refundAmount).toLocaleString(),
          originalAmount: Number(existing.payment.amount).toLocaleString(),
          packageName: existing.payment.package?.name || undefined,
          status: statusMap[action],
          dashboardUrl: `${appUrl}/parent`,
        }),
      }).catch((err) =>
        console.error(`[Refund ${action}] Parent email failed:`, err)
      )
    }    

    const updated = await prisma.refundRequest.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({
      message: `Refund ${action}ed successfully`,
      refund: {
        id: updated.id,
        student: `${updated.student.firstName} ${updated.student.lastName}`,
        amount: Number(updated.refundAmount),
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("PATCH /api/refunds error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
