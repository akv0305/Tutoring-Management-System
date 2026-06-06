import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/pricing
// Returns teacher-subject-grade rates with optional filters
// Admin/Coordinator: full data with compensation rates
// Parent: only student-facing rates (for booking flow)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const subjectId = searchParams.get("subjectId")
    const gradeBandId = searchParams.get("gradeBandId")
    const activeOnly = searchParams.get("active") !== "false"

    const where: any = {}
    if (teacherId) where.teacherId = teacherId
    if (subjectId) where.subjectId = subjectId
    if (gradeBandId) where.gradeBandId = gradeBandId
    if (activeOnly) where.isActive = true

    const rates = await prisma.teacherSubjectRate.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subject: { select: { id: true, name: true, category: true } },
        gradeBand: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: [
        { teacher: { user: { firstName: "asc" } } },
        { subject: { name: "asc" } },
        { gradeBand: { sortOrder: "asc" } },
      ],
    })

    const isAdmin = session.user.role === "ADMIN"
    const isCoordinator = session.user.role === "COORDINATOR"

    const data = rates.map((r) => {
      const base: any = {
        id: r.id,
        teacherId: r.teacherId,
        teacherName: `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
        subjectId: r.subjectId,
        subjectName: r.subject.name,
        subjectCategory: r.subject.category,
        gradeBandId: r.gradeBandId,
        gradeBandName: r.gradeBand.name,
        gradeBandDisplayName: r.gradeBand.displayName,
        studentFacingRate: Number(r.studentFacingRate),
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }

      // Only admin and coordinator see compensation rates
      if (isAdmin || isCoordinator) {
        base.compensationRate = Number(r.compensationRate)
        base.margin = Number(r.studentFacingRate) - Number(r.compensationRate)
      }

      return base
    })

    // Summary stats (admin only)
    let summary: any = { total: data.length }
    if (isAdmin) {
      const uniqueTeachers = new Set(data.map((r) => r.teacherId)).size
      const uniqueSubjects = new Set(data.map((r) => r.subjectId)).size
      const uniqueBands = new Set(data.map((r) => r.gradeBandId)).size
      const avgMargin = data.length > 0
        ? Number((data.reduce((sum, r) => sum + (r.margin || 0), 0) / data.length).toFixed(2))
        : 0

      summary = {
        total: data.length,
        uniqueTeachers,
        uniqueSubjects,
        uniqueBands,
        avgMargin,
      }
    }

    return NextResponse.json({ rates: data, summary })
  } catch (error) {
    console.error("GET /api/pricing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/pricing
// Admin-only: create a new teacher-subject-grade rate
// Body: { teacherId, subjectId, gradeBandId, compensationRate, studentFacingRate }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { teacherId, subjectId, gradeBandId, compensationRate, studentFacingRate } = body

    if (!teacherId || !subjectId || !gradeBandId) {
      return NextResponse.json(
        { error: "teacherId, subjectId, and gradeBandId are required." },
        { status: 400 }
      )
    }

    if (compensationRate === undefined || compensationRate === null || Number(compensationRate) < 0) {
      return NextResponse.json(
        { error: "Valid compensation rate is required." },
        { status: 400 }
      )
    }

    if (studentFacingRate === undefined || studentFacingRate === null || Number(studentFacingRate) < 0) {
      return NextResponse.json(
        { error: "Valid student-facing rate is required." },
        { status: 400 }
      )
    }

    if (Number(compensationRate) > Number(studentFacingRate)) {
      return NextResponse.json(
        { error: "Compensation rate cannot exceed student-facing rate." },
        { status: 400 }
      )
    }

    // Validate references exist
    const [teacher, subject, gradeBand] = await Promise.all([
      prisma.teacherProfile.findUnique({
        where: { id: teacherId },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.gradeBand.findUnique({ where: { id: gradeBandId } }),
    ])

    if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 })
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 })
    if (!gradeBand) return NextResponse.json({ error: "Grade band not found." }, { status: 404 })

    // Check for existing rate (unique constraint)
    const existing = await prisma.teacherSubjectRate.findUnique({
      where: {
        teacherId_subjectId_gradeBandId: { teacherId, subjectId, gradeBandId },
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: `A rate already exists for ${teacher.user.firstName} ${teacher.user.lastName} → ${subject.name} → ${gradeBand.displayName}. Use PATCH to update it.`,
        },
        { status: 409 }
      )
    }

    const rate = await prisma.teacherSubjectRate.create({
      data: {
        teacherId,
        subjectId,
        gradeBandId,
        compensationRate: Number(compensationRate),
        studentFacingRate: Number(studentFacingRate),
      },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        subject: { select: { name: true } },
        gradeBand: { select: { name: true, displayName: true } },
      },
    })

    return NextResponse.json(
      {
        message: "Rate created successfully",
        rate: {
          id: rate.id,
          teacherName: `${rate.teacher.user.firstName} ${rate.teacher.user.lastName}`,
          subjectName: rate.subject.name,
          gradeBandName: rate.gradeBand.displayName,
          compensationRate: Number(rate.compensationRate),
          studentFacingRate: Number(rate.studentFacingRate),
          margin: Number(rate.studentFacingRate) - Number(rate.compensationRate),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/pricing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/pricing
// Admin-only: update an existing rate
// Body: { id, compensationRate?, studentFacingRate?, isActive? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Rate ID is required." }, { status: 400 })
    }

    const existing = await prisma.teacherSubjectRate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Rate not found." }, { status: 404 })
    }

    const updateData: any = {}

    if (updates.compensationRate !== undefined) {
      if (Number(updates.compensationRate) < 0) {
        return NextResponse.json({ error: "Compensation rate cannot be negative." }, { status: 400 })
      }
      updateData.compensationRate = Number(updates.compensationRate)
    }

    if (updates.studentFacingRate !== undefined) {
      if (Number(updates.studentFacingRate) < 0) {
        return NextResponse.json({ error: "Student-facing rate cannot be negative." }, { status: 400 })
      }
      updateData.studentFacingRate = Number(updates.studentFacingRate)
    }

    // Cross-validate rates
    const finalComp = updateData.compensationRate ?? Number(existing.compensationRate)
    const finalFacing = updateData.studentFacingRate ?? Number(existing.studentFacingRate)
    if (finalComp > finalFacing) {
      return NextResponse.json(
        { error: "Compensation rate cannot exceed student-facing rate." },
        { status: 400 }
      )
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 })
    }

    const updated = await prisma.teacherSubjectRate.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        subject: { select: { name: true } },
        gradeBand: { select: { name: true, displayName: true } },
      },
    })

    return NextResponse.json({
      message: "Rate updated successfully",
      rate: {
        id: updated.id,
        teacherName: `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}`,
        subjectName: updated.subject.name,
        gradeBandName: updated.gradeBand.displayName,
        compensationRate: Number(updated.compensationRate),
        studentFacingRate: Number(updated.studentFacingRate),
        margin: Number(updated.studentFacingRate) - Number(updated.compensationRate),
        isActive: updated.isActive,
      },
    })
  } catch (error) {
    console.error("PATCH /api/pricing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/pricing?id=xxx
// Admin-only: soft-delete (deactivate) a rate
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Rate ID is required." }, { status: 400 })
    }

    const existing = await prisma.teacherSubjectRate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Rate not found." }, { status: 404 })
    }

    // Soft delete — deactivate instead of hard delete
    await prisma.teacherSubjectRate.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Rate deactivated successfully" })
  } catch (error) {
    console.error("DELETE /api/pricing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
