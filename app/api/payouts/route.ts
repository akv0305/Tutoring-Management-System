import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/payouts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const where: Record<string, unknown> = {}

    if (session.user.role === "TEACHER") {
      const tp = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!tp) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
      where.teacherId = tp.id
    }

    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const teacherId = searchParams.get("teacherId")
    if (status) where.status = status.toUpperCase()
    if (teacherId && session.user.role === "ADMIN") where.teacherId = teacherId

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    const mapped = payouts.map((po) => ({
      id: po.id,
      teacherName: `${po.teacher.user.firstName} ${po.teacher.user.lastName}`,
      teacherEmail: po.teacher.user.email,
      period: `${months[po.periodMonth - 1]} ${po.periodYear}`,
      periodMonth: po.periodMonth,
      periodYear: po.periodYear,
      classesCompleted: po.classesCompleted,
      compensationRate: `$${Number(po.compensationRate)}`,
      grossAmount: Number(po.grossAmount),
      grossFormatted: `$${Number(po.grossAmount).toLocaleString()}`,
      deductions: Number(po.deductions),
      deductionsFormatted: `$${Number(po.deductions).toLocaleString()}`,
      bonus: Number(po.bonus),
      bonusFormatted: `$${Number(po.bonus).toLocaleString()}`,
      adminNotes: po.adminNotes ?? "",
      netAmount: Number(po.netAmount),
      netFormatted: `$${Number(po.netAmount).toLocaleString()}`,
      status: po.status,
      paidAt: po.paidAt?.toISOString() ?? null,
      createdAt: po.createdAt.toISOString(),
    }))

    const summary = {
      total: mapped.length,
      pending: mapped.filter((p) => p.status === "PENDING").length,
      processing: mapped.filter((p) => p.status === "PROCESSING").length,
      paid: mapped.filter((p) => p.status === "PAID").length,
      onHold: mapped.filter((p) => p.status === "ON_HOLD").length,
      totalGross: mapped.reduce((s, p) => s + p.grossAmount, 0),
      totalNet: mapped.reduce((s, p) => s + p.netAmount, 0),
      totalPaid: mapped.filter((p) => p.status === "PAID").reduce((s, p) => s + p.netAmount, 0),
    }

    return NextResponse.json({ payouts: mapped, total: mapped.length, summary })
  } catch (error) {
    console.error("GET /api/payouts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/payouts
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { teacherId, periodMonth, periodYear } = body

    if (!teacherId || !periodMonth || !periodYear) {
      return NextResponse.json(
        { error: "teacherId, periodMonth, and periodYear are required" },
        { status: 400 }
      )
    }

    const existing = await prisma.payout.findFirst({
      where: { teacherId, periodMonth, periodYear },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Payout already exists for this teacher and period" },
        { status: 409 }
      )
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: { select: { firstName: true, lastName: true } } },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const periodStart = new Date(periodYear, periodMonth - 1, 1)
    const periodEnd = new Date(periodYear, periodMonth, 0)

    const completedClasses = await prisma.class.count({
      where: {
        teacherId,
        status: "COMPLETED",
        completedAt: { gte: periodStart, lt: new Date(periodYear, periodMonth, 1) },
      },
    })

    if (completedClasses === 0) {
      return NextResponse.json(
        { error: "No completed classes found for this period" },
        { status: 400 }
      )
    }

    const rate = Number(teacher.compensationRate)
    const gross = completedClasses * rate

    const payout = await prisma.payout.create({
      data: {
        teacherId,
        periodMonth,
        periodYear,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        classesCompleted: completedClasses,
        compensationRate: rate,
        grossAmount: gross,
        deductions: 0,
        bonus: 0,
        netAmount: gross,
        status: "PENDING",
      },
    })

    return NextResponse.json({
      message: "Payout generated successfully",
      payout: {
        id: payout.id,
        teacher: `${teacher.user.firstName} ${teacher.user.lastName}`,
        period: `${periodMonth}/${periodYear}`,
        classes: completedClasses,
        gross,
        net: gross,
        status: payout.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/payouts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/payouts
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { id, action, deductions, bonus, adminNotes } = body

    if (!id) {
      return NextResponse.json({ error: "Payout id is required" }, { status: 400 })
    }

    const existing = await prisma.payout.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case "process":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Can only process a pending payout" }, { status: 400 })
        }
        updateData = { status: "PROCESSING" }
        break

      case "pay":
        if (!["PENDING", "PROCESSING"].includes(existing.status)) {
          return NextResponse.json({ error: "Can only pay a pending or processing payout" }, { status: 400 })
        }
        updateData = { status: "PAID", paidAt: new Date() }
        break

      case "hold":
        if (!["PENDING", "PROCESSING"].includes(existing.status)) {
          return NextResponse.json({ error: "Can only hold a pending or processing payout" }, { status: 400 })
        }
        updateData = { status: "ON_HOLD" }
        break

      case "release":
        if (existing.status !== "ON_HOLD") {
          return NextResponse.json({ error: "Can only release a held payout" }, { status: 400 })
        }
        updateData = { status: "PENDING" }
        break

      case "update_adjustments": {
        if (!["PENDING", "PROCESSING"].includes(existing.status)) {
          return NextResponse.json(
            { error: "Can only adjust pending or processing payouts" },
            { status: 400 }
          )
        }
        const newDed = deductions !== undefined ? Number(deductions) : Number(existing.deductions)
        const newBon = bonus !== undefined ? Number(bonus) : Number(existing.bonus)
        const gross = Number(existing.grossAmount)
        const newNet = gross - newDed + newBon

        updateData = {
          deductions: newDed,
          bonus: newBon,
          adminNotes: adminNotes ?? existing.adminNotes,
          netAmount: newNet,
        }
        break
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: process, pay, hold, release, update_adjustments" },
          { status: 400 }
        )
    }

    const updated = await prisma.payout.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    })

    return NextResponse.json({
      message: `Payout ${action} successful`,
      payout: {
        id: updated.id,
        teacher: `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}`,
        status: updated.status,
        netAmount: Number(updated.netAmount),
        deductions: Number(updated.deductions),
        bonus: Number(updated.bonus),
      },
    })
  } catch (error) {
    console.error("PATCH /api/payouts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
