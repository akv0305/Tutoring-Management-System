import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/payments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")

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

    if (status) where.status = status.toUpperCase()
    if (studentId) where.studentId = studentId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true } },
        package: {
          select: {
            name: true,
            subject: { select: { name: true } },
            teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        confirmedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const mapped = payments.map((p) => ({
      id: p.id,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      packageName: p.package?.name ?? "—",
      subject: p.package?.subject?.name ?? "—",
      teacher: p.package?.teacher
        ? `${p.package.teacher.user.firstName} ${p.package.teacher.user.lastName}`
        : "—",
      amount: Number(p.amount),
      amountFormatted: `$${Number(p.amount).toLocaleString()}`,
      method: p.method,
      status: p.status,
      bankReference: p.bankReference,
      confirmedBy: p.confirmedBy
        ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
        : null,
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      date: p.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    }))

    const summary = {
      total: mapped.length,
      confirmed: mapped.filter((p) => p.status === "CONFIRMED").length,
      pending: mapped.filter((p) => p.status === "PENDING").length,
      failed: mapped.filter((p) => p.status === "FAILED").length,
      refunded: mapped.filter((p) => p.status === "REFUNDED").length,
      totalAmount: mapped.reduce((sum, p) => sum + p.amount, 0),
      confirmedAmount: mapped
        .filter((p) => p.status === "CONFIRMED")
        .reduce((sum, p) => sum + p.amount, 0),
    }

    return NextResponse.json({ payments: mapped, total: mapped.length, summary })
  } catch (error) {
    console.error("GET /api/payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/payments — record a new payment
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
    const { studentId, packageId, amount, method, bankReference } = body

    if (!studentId || !amount) {
      return NextResponse.json({ error: "studentId and amount are required" }, { status: 400 })
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
      include: {
        student: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } },
      },
    })

    return NextResponse.json({
      message: "Payment recorded successfully",
      payment: {
        id: payment.id,
        student: `${payment.student.firstName} ${payment.student.lastName}`,
        package: payment.package?.name ?? "—",
        amount: Number(payment.amount),
        status: payment.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/payments — confirm, fail, or refund a payment
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Only admins can update payment status" }, { status: 403 })
    }

    const body = await req.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Payment id is required" }, { status: 400 })
    }

    const existing = await prisma.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case "confirm":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Can only confirm a pending payment" }, { status: 400 })
        }
        updateData = {
          status: "CONFIRMED",
          confirmedById: session.user.id,
          confirmedAt: new Date(),
          bankReference: updates.bankReference || existing.bankReference,
        }
        break

      case "fail":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Can only fail a pending payment" }, { status: 400 })
        }
        updateData = { status: "FAILED" }
        break

      case "refund":
        if (existing.status !== "CONFIRMED") {
          return NextResponse.json({ error: "Can only refund a confirmed payment" }, { status: 400 })
        }
        updateData = { status: "REFUNDED" }
        break

      default:
        return NextResponse.json({ error: "Invalid action. Use: confirm, fail, refund" }, { status: 400 })
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({
      message: `Payment ${action}ed successfully`,
      payment: {
        id: updated.id,
        student: `${updated.student.firstName} ${updated.student.lastName}`,
        amount: Number(updated.amount),
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("PATCH /api/payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
