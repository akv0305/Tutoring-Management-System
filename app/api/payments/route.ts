import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")

    const where: Record<string, unknown> = {}

    if (session.user.role === "PARENT") {
      const parent = await prisma.parentProfile.findFirst({
        where: { user: { email: session.user.email! } },
        include: { students: { select: { id: true } } },
      })
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 })
      where.studentId = { in: parent.students.map((s) => s.id) }
    } else if (session.user.role === "COORDINATOR") {
      const coord = await prisma.coordinatorProfile.findFirst({
        where: { user: { email: session.user.email! } },
      })
      if (!coord) return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
      where.student = { coordinatorId: coord.id }
    }
    // ADMIN sees all

    if (status) where.status = status.toUpperCase()
    if (studentId) where.studentId = studentId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } },
        confirmedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const mapped = payments.map((p) => ({
      id: p.id,
      student: `${p.student.firstName} ${p.student.lastName}`,
      studentId: p.studentId,
      package: p.package?.name ?? "Direct Payment",
      packageId: p.packageId,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      bankReference: p.bankReference,
      confirmedBy: p.confirmedBy
        ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
        : null,
      confirmedAt: p.confirmedAt,
      createdAt: p.createdAt,
    }))

    const summary = {
      total: mapped.length,
      pending: mapped.filter((p) => p.status === "PENDING").length,
      confirmed: mapped.filter((p) => p.status === "CONFIRMED").length,
      refunded: mapped.filter((p) => p.status === "REFUNDED").length,
      failed: mapped.filter((p) => p.status === "FAILED").length,
      totalAmount: mapped.reduce((s, p) => s + p.amount, 0),
      confirmedAmount: mapped
        .filter((p) => p.status === "CONFIRMED")
        .reduce((s, p) => s + p.amount, 0),
    }

    return NextResponse.json({ payments: mapped, summary })
  } catch (error) {
    console.error("GET /api/payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!["ADMIN", "COORDINATOR", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { studentId, packageId, amount, method, bankReference } = body

    if (!studentId || !amount) {
      return NextResponse.json({ error: "studentId and amount required" }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        packageId: packageId || null,
        amount,
        method: method || "BANK_TRANSFER",
        bankReference: bankReference || null,
        status: "PENDING",
      },
    })

    return NextResponse.json({ message: "Payment created", payment: { id: payment.id, status: payment.status } }, { status: 201 })
  } catch (error) {
    console.error("POST /api/payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, action, reason } = body

    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 })
    }

    // Permission check
    const isAdmin = session.user.role === "ADMIN"
    let canConfirm = isAdmin

    if (!isAdmin && session.user.role === "COORDINATOR") {
      const settings = await prisma.platformSettings.findFirst({ where: { id: "default" } })
      if (settings?.coordinatorCanConfirmPayments) {
        const coord = await prisma.coordinatorProfile.findFirst({
          where: { user: { email: session.user.email! } },
        })
        if (coord) {
          const payment = await prisma.payment.findUnique({
            where: { id },
            include: { student: { select: { coordinatorId: true } } },
          })
          if (payment?.student.coordinatorId === coord.id) {
            canConfirm = true
          }
        }
      }
    }

    if (!canConfirm) {
      return NextResponse.json({ error: "You do not have permission to process payments" }, { status: 403 })
    }

    const payment = await prisma.payment.findUnique({ where: { id } })
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })

    if (action === "confirm") {
      if (payment.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending payments can be confirmed" }, { status: 400 })
      }

      // Update payment status
      const updated = await prisma.payment.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedById: user!.id,
          confirmedAt: new Date(),
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
          package: { select: { name: true } },
        },
      })

      // Find linked BookingOrder and update its classes to SCHEDULED
      const bookingOrder = await prisma.bookingOrder.findUnique({
        where: { paymentId: payment.id },
      })

      let classesConfirmed = 0

      if (bookingOrder) {
        // Update BookingOrder status to PAID
        await prisma.bookingOrder.update({
          where: { id: bookingOrder.id },
          data: { status: "PAID" },
        })

        // Update all PENDING_PAYMENT classes in this order to SCHEDULED
        const result = await prisma.class.updateMany({
          where: {
            bookingOrderId: bookingOrder.id,
            status: "PENDING_PAYMENT",
          },
          data: { status: "SCHEDULED" },
        })

        classesConfirmed = result.count

        // Send notification to the parent
        const student = await prisma.student.findUnique({
          where: { id: bookingOrder.studentId },
          include: { parent: { include: { user: { select: { id: true } } } } },
        })

        if (student) {
          await prisma.notification.create({
            data: {
              userId: student.parent.user.id,
              type: "PAYMENT",
              title: "Payment Confirmed — Classes Scheduled",
              message: `Your payment of $${Number(payment.amount)} (Ref: ${bookingOrder.orderRef}) has been confirmed. ${classesConfirmed} class${classesConfirmed > 1 ? "es are" : " is"} now scheduled.`,
            },
          })
        }
      }

      return NextResponse.json({
        message: "Payment confirmed",
        classesConfirmed,
        payment: {
          id: updated.id,
          student: `${updated.student.firstName} ${updated.student.lastName}`,
          package: updated.package?.name,
          amount: Number(updated.amount),
          status: updated.status,
          confirmedAt: updated.confirmedAt,
        },
      })
    }

    if (action === "reject") {
      if (payment.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending payments can be rejected" }, { status: 400 })
      }

      // Update payment status
      const updated = await prisma.payment.update({
        where: { id },
        data: {
          status: "FAILED",
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
        },
      })

      // Find linked BookingOrder and cancel its classes
      const bookingOrder = await prisma.bookingOrder.findUnique({
        where: { paymentId: payment.id },
      })

      let classesCancelled = 0

      if (bookingOrder) {
        // Update BookingOrder status to CANCELLED
        await prisma.bookingOrder.update({
          where: { id: bookingOrder.id },
          data: { status: "CANCELLED" },
        })

        // Cancel all PENDING_PAYMENT classes in this order
        const result = await prisma.class.updateMany({
          where: {
            bookingOrderId: bookingOrder.id,
            status: "PENDING_PAYMENT",
          },
          data: {
            status: "CANCELLED_STUDENT",
            cancelledAt: new Date(),
            cancelReason: reason || "Payment rejected",
          },
        })

        classesCancelled = result.count

        // Send notification to the parent
        const student = await prisma.student.findUnique({
          where: { id: bookingOrder.studentId },
          include: { parent: { include: { user: { select: { id: true } } } } },
        })

        if (student) {
          await prisma.notification.create({
            data: {
              userId: student.parent.user.id,
              type: "PAYMENT",
              title: "Payment Rejected — Classes Cancelled",
              message: `Your payment of $${Number(payment.amount)} (Ref: ${bookingOrder.orderRef}) was rejected. ${classesCancelled} class${classesCancelled > 1 ? "es have" : " has"} been cancelled. ${reason ? "Reason: " + reason : ""}`,
            },
          })
        }
      }

      return NextResponse.json({
        message: "Payment rejected",
        classesCancelled,
        payment: {
          id: updated.id,
          student: `${updated.student.firstName} ${updated.student.lastName}`,
          amount: Number(updated.amount),
          status: updated.status,
          reason: reason ?? "Rejected by admin",
        },
      })
    }

    return NextResponse.json({ error: "Invalid action. Use 'confirm' or 'reject'" }, { status: 400 })
  } catch (error) {
    console.error("PATCH /api/payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
