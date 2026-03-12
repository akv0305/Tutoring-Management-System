import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"

// GET /api/coordinators — admin only
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const coordinators = await prisma.coordinatorProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    const data = coordinators.map((c) => ({
      id: c.id,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
      email: c.user.email,
      phone: c.user.phone,
      bucketSize: c.bucketSize,
      currentStudents: c._count.students,
      availableSlots: c.bucketSize - c._count.students,
      status: c.status,
      createdAt: c.createdAt,
    }))

    const total = data.length
    const active = data.filter((c) => c.status === "ACTIVE").length
    const totalStudents = data.reduce((sum, c) => sum + c.currentStudents, 0)
    const totalCapacity = data.reduce((sum, c) => sum + c.bucketSize, 0)

    return NextResponse.json({
      coordinators: data,
      total,
      summary: { total, active, totalStudents, totalCapacity },
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("GET /api/coordinators error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/coordinators — admin only
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Coordinator ID is required." },
        { status: 400 }
      )
    }

    const coordinator = await prisma.coordinatorProfile.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ coordinator })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("PATCH /api/coordinators error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
