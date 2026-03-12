import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth-utils"

// GET /api/subjects — anyone authenticated can list subjects
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status") // "ACTIVE" | "INACTIVE" | null (all)
    const category = searchParams.get("category")

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Map to a clean response
    const data = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      basePriceHour: Number(s.basePriceHour),
      status: s.status,
      activeTeachers: s._count.teachers,
      activeStudents: s._count.students,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ subjects: data })
  } catch (error) {
    console.error("GET /api/subjects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/subjects — admin only
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await req.json()
    const { name, category, basePriceHour } = body

    if (!name || !category || basePriceHour === undefined) {
      return NextResponse.json(
        { error: "Name, category, and base price are required." },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.subject.findUnique({
      where: { name: name.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: "A subject with this name already exists." },
        { status: 409 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        category,
        basePriceHour,
      },
    })

    return NextResponse.json({ subject }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("POST /api/subjects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/subjects — admin only (expects { id, ...fields })
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Subject ID is required." },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ subject })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("PATCH /api/subjects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
