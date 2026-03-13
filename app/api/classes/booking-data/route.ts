import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let studentWhere: any = {}

    if (session.user.role === "PARENT") {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 })
      studentWhere = { parentId: parent.id }
    } else if (session.user.role === "COORDINATOR") {
      const coord = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!coord) return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
      studentWhere = { coordinatorId: coord.id }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Students
    const students = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    })

    // Active teachers with subjects
    const teacherProfiles = await prisma.teacherProfile.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { firstName: true, lastName: true } },
        subjects: { include: { subject: { select: { id: true, name: true } } } },
      },
      orderBy: { user: { firstName: "asc" } },
    })

    const teachers = teacherProfiles.map((t) => ({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      subjects: t.subjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name })),
    }))

    // Active packages with remaining classes
    const studentIds = students.map((s) => s.id)
    const pkgs = await prisma.package.findMany({
        where: {
          studentId: { in: studentIds },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          classesIncluded: true,
          classesUsed: true,
          studentId: true,
          teacherId: true,
          subjectId: true,
          student: { select: { firstName: true, lastName: true } },
        },
      })

    const packages = pkgs
      .filter((p) => p.classesUsed < p.classesIncluded)
      .map((p) => ({
        id: p.id,
        label: `${p.name} — ${p.student.firstName} ${p.student.lastName}`,
        remaining: p.classesIncluded - p.classesUsed,
        subjectId: p.subjectId,
        teacherId: p.teacherId,
        studentId: p.studentId,
      }))

    return NextResponse.json({
      students: students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })),
      teachers,
      packages,
    })
  } catch (error) {
    console.error("GET /api/classes/booking-data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
