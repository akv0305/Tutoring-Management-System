import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth-utils"

// GET /api/packages — filtered by role
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")

    const where: any = {}

    if (role === "TEACHER") {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!teacherProfile) {
        return NextResponse.json({ packages: [], total: 0 })
      }
      where.teacherId = teacherProfile.id
    } else if (role === "PARENT") {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!parentProfile) {
        return NextResponse.json({ packages: [], total: 0 })
      }
      where.studentId = { in: parentProfile.students.map((s) => s.id) }
    } else if (role === "COORDINATOR") {
      const coordProfile = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!coordProfile) {
        return NextResponse.json({ packages: [], total: 0 })
      }
      where.studentId = { in: coordProfile.students.map((s) => s.id) }
    }
    // ADMIN sees all

    if (status) where.status = status
    if (studentId) where.studentId = studentId

    const packages = await prisma.package.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, grade: true },
        },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subject: {
          select: { name: true },
        },
        _count: {
          select: { classes: true, payments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const data = packages.map((p) => {
      const remaining = p.classesIncluded - p.classesUsed
      const progressPct = Math.round((p.classesUsed / p.classesIncluded) * 100)
      const now = new Date()
      const daysUntilExpiry = Math.ceil(
        (p.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: p.id,
        name: p.name,
        student: `${p.student.firstName} ${p.student.lastName}`,
        studentGrade: p.student.grade,
        teacher: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
        subject: p.subject.name,
        classesIncluded: p.classesIncluded,
        classesUsed: p.classesUsed,
        classesRemaining: remaining,
        progressPct,
        pricePerClass: Number(p.pricePerClass),
        totalPrice: Number(p.totalPrice),
        validityDays: p.validityDays,
        startDate: p.startDate,
        expiryDate: p.expiryDate,
        daysUntilExpiry,
        isExpiringSoon: daysUntilExpiry <= 14 && daysUntilExpiry > 0,
        status: p.status,
        totalClasses: p._count.classes,
        totalPayments: p._count.payments,
        createdAt: p.createdAt,
      }
    })

    // Summary
    const total = data.length
    const active = data.filter((p) => p.status === "ACTIVE").length
    const exhausted = data.filter((p) => p.status === "EXHAUSTED").length
    const expired = data.filter((p) => p.status === "EXPIRED").length
    const totalValue = data.reduce((sum, p) => sum + p.totalPrice, 0)

    return NextResponse.json({
      packages: data,
      total,
      summary: { total, active, exhausted, expired, totalValue },
    })
  } catch (error) {
    console.error("GET /api/packages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/packages — admin only
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await req.json()
    const {
      name, studentId, teacherId, subjectId,
      classesIncluded, pricePerClass, validityDays,
    } = body

    if (!name || !studentId || !teacherId || !subjectId || !classesIncluded || !pricePerClass || !validityDays) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      )
    }

    const totalPrice = classesIncluded * pricePerClass
    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + validityDays)

    const pkg = await prisma.package.create({
      data: {
        name,
        studentId,
        teacherId,
        subjectId,
        classesIncluded,
        classesUsed: 0,
        pricePerClass,
        totalPrice,
        validityDays,
        startDate,
        expiryDate,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({ package: pkg }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("POST /api/packages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/packages — admin only
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Package ID is required." },
        { status: 400 }
      )
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ package: pkg })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("PATCH /api/packages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
