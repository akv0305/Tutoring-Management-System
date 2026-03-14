import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [parents, coordinators, subjects, teachers] = await Promise.all([
      prisma.parentProfile.findMany({
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        where: { user: { status: "ACTIVE" } },
        orderBy: { user: { firstName: "asc" } },
      }),
      prisma.coordinatorProfile.findMany({
        include: { user: { select: { firstName: true, lastName: true } } },
        where: { status: "ACTIVE" },
        orderBy: { user: { firstName: "asc" } },
      }),
      prisma.subject.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true },
      }),
      prisma.teacherProfile.findMany({
        include: {
          user: { select: { firstName: true, lastName: true } },
          subjects: { include: { subject: { select: { id: true, name: true } } } },
        },
        where: { status: "ACTIVE" },
        orderBy: { user: { firstName: "asc" } },
      }),
    ])

    return NextResponse.json({
      parents: parents.map((p) => ({
        id: p.id,
        email: p.user.email,
        name: `${p.user.firstName} ${p.user.lastName}`,
      })),
      coordinators: coordinators.map((c) => ({
        id: c.id,
        name: `${c.user.firstName} ${c.user.lastName}`,
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
      })),
      teachers: teachers.map((t) => ({
        id: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        subjects: t.subjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name })),
      })),
    })
  } catch (error) {
    console.error("GET /api/admin/dropdown-data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
