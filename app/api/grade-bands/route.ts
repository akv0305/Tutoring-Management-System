import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/grade-bands
// Returns all grade bands with their grades
// Public for authenticated users (needed by registration, booking, admin)
export async function GET(req: NextRequest) {
  try {
    //const session = await getServerSession(authOptions)
    //if (!session?.user) {
    //  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    //}

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("active") !== "false" // default: active only

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const gradeBands = await prisma.gradeBand.findMany({
      where,
      include: {
        grades: {
          where: activeOnly ? { isActive: true } : {},
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            teacherSubjectRates: true,
            packageTemplates: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    const data = gradeBands.map((band) => ({
      id: band.id,
      name: band.name,
      displayName: band.displayName,
      description: band.description,
      sortOrder: band.sortOrder,
      isActive: band.isActive,
      createdAt: band.createdAt.toISOString(),
      grades: band.grades.map((g) => ({
        id: g.id,
        name: g.name,
        shortName: g.shortName,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
      })),
      rateCount: band._count.teacherSubjectRates,
      packageTemplateCount: band._count.packageTemplates,
    }))

    return NextResponse.json({ gradeBands: data, total: data.length })
  } catch (error) {
    console.error("GET /api/grade-bands error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/grade-bands
// Admin-only: create a new grade band or a new grade within a band
// Body for band: { type: "band", name, displayName, description?, sortOrder? }
// Body for grade: { type: "grade", name, shortName, gradeBandId, sortOrder? }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { type } = body

    if (type === "band") {
      const { name, displayName, description, sortOrder } = body

      if (!name?.trim() || !displayName?.trim()) {
        return NextResponse.json(
          { error: "Band name and display name are required." },
          { status: 400 }
        )
      }

      // Check uniqueness
      const existing = await prisma.gradeBand.findUnique({
        where: { name: name.trim().toUpperCase() },
      })
      if (existing) {
        return NextResponse.json(
          { error: `Grade band "${name}" already exists.` },
          { status: 409 }
        )
      }

      // Auto-calculate sort order if not provided
      let finalSortOrder = sortOrder
      if (finalSortOrder === undefined || finalSortOrder === null) {
        const maxSort = await prisma.gradeBand.aggregate({
          _max: { sortOrder: true },
        })
        finalSortOrder = (maxSort._max.sortOrder ?? 0) + 1
      }

      const band = await prisma.gradeBand.create({
        data: {
          name: name.trim().toUpperCase(),
          displayName: displayName.trim(),
          description: description?.trim() || null,
          sortOrder: finalSortOrder,
        },
        include: {
          grades: { orderBy: { sortOrder: "asc" } },
        },
      })

      return NextResponse.json(
        {
          message: "Grade band created successfully",
          gradeBand: {
            id: band.id,
            name: band.name,
            displayName: band.displayName,
            description: band.description,
            sortOrder: band.sortOrder,
            isActive: band.isActive,
            grades: [],
          },
        },
        { status: 201 }
      )
    }

    if (type === "grade") {
      const { name, shortName, gradeBandId, sortOrder } = body

      if (!name?.trim() || !shortName?.trim() || !gradeBandId) {
        return NextResponse.json(
          { error: "Grade name, short name, and grade band ID are required." },
          { status: 400 }
        )
      }

      // Validate band exists
      const band = await prisma.gradeBand.findUnique({
        where: { id: gradeBandId },
      })
      if (!band) {
        return NextResponse.json(
          { error: "Grade band not found." },
          { status: 404 }
        )
      }

      // Check uniqueness
      const existingGrade = await prisma.grade.findUnique({
        where: { name: name.trim() },
      })
      if (existingGrade) {
        return NextResponse.json(
          { error: `Grade "${name}" already exists.` },
          { status: 409 }
        )
      }

      // Auto-calculate sort order
      let finalSortOrder = sortOrder
      if (finalSortOrder === undefined || finalSortOrder === null) {
        const maxSort = await prisma.grade.aggregate({
          _max: { sortOrder: true },
        })
        finalSortOrder = (maxSort._max.sortOrder ?? 0) + 1
      }

      const grade = await prisma.grade.create({
        data: {
          name: name.trim(),
          shortName: shortName.trim(),
          gradeBandId,
          sortOrder: finalSortOrder,
        },
      })

      return NextResponse.json(
        {
          message: "Grade created successfully",
          grade: {
            id: grade.id,
            name: grade.name,
            shortName: grade.shortName,
            sortOrder: grade.sortOrder,
            isActive: grade.isActive,
            gradeBandId: grade.gradeBandId,
          },
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "band" or "grade".' },
      { status: 400 }
    )
  } catch (error) {
    console.error("POST /api/grade-bands error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/grade-bands
// Admin-only: update a grade band or a grade
// Body for band: { type: "band", id, displayName?, description?, sortOrder?, isActive? }
// Body for grade: { type: "grade", id, name?, shortName?, gradeBandId?, sortOrder?, isActive? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { type, id } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 })
    }

    if (type === "band") {
      const existing = await prisma.gradeBand.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: "Grade band not found." }, { status: 404 })
      }

      const updateData: any = {}
      if (body.displayName !== undefined) updateData.displayName = body.displayName.trim()
      if (body.description !== undefined) updateData.description = body.description?.trim() || null
      if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
      if (body.isActive !== undefined) updateData.isActive = body.isActive

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No fields to update." }, { status: 400 })
      }

      const updated = await prisma.gradeBand.update({
        where: { id },
        data: updateData,
        include: {
          grades: { orderBy: { sortOrder: "asc" } },
          _count: { select: { teacherSubjectRates: true } },
        },
      })

      return NextResponse.json({
        message: "Grade band updated successfully",
        gradeBand: {
          id: updated.id,
          name: updated.name,
          displayName: updated.displayName,
          description: updated.description,
          sortOrder: updated.sortOrder,
          isActive: updated.isActive,
          grades: updated.grades.map((g) => ({
            id: g.id,
            name: g.name,
            shortName: g.shortName,
            sortOrder: g.sortOrder,
            isActive: g.isActive,
          })),
          rateCount: updated._count.teacherSubjectRates,
        },
      })
    }

    if (type === "grade") {
      const existing = await prisma.grade.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: "Grade not found." }, { status: 404 })
      }

      const updateData: any = {}
      if (body.name !== undefined) {
        // Check uniqueness for new name
        const duplicate = await prisma.grade.findFirst({
          where: { name: body.name.trim(), id: { not: id } },
        })
        if (duplicate) {
          return NextResponse.json(
            { error: `Grade "${body.name}" already exists.` },
            { status: 409 }
          )
        }
        updateData.name = body.name.trim()
      }
      if (body.shortName !== undefined) updateData.shortName = body.shortName.trim()
      if (body.gradeBandId !== undefined) {
        // Validate new band exists
        const newBand = await prisma.gradeBand.findUnique({ where: { id: body.gradeBandId } })
        if (!newBand) {
          return NextResponse.json({ error: "Target grade band not found." }, { status: 404 })
        }
        updateData.gradeBandId = body.gradeBandId
      }
      if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
      if (body.isActive !== undefined) updateData.isActive = body.isActive

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No fields to update." }, { status: 400 })
      }

      const updated = await prisma.grade.update({
        where: { id },
        data: updateData,
        include: { gradeBand: { select: { id: true, name: true, displayName: true } } },
      })

      return NextResponse.json({
        message: "Grade updated successfully",
        grade: {
          id: updated.id,
          name: updated.name,
          shortName: updated.shortName,
          sortOrder: updated.sortOrder,
          isActive: updated.isActive,
          gradeBand: updated.gradeBand,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "band" or "grade".' },
      { status: 400 }
    )
  } catch (error) {
    console.error("PATCH /api/grade-bands error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
