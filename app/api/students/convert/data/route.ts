import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const studentId = new URL(req.url).searchParams.get("studentId")

    // Active teachers with subjects
    const teachers = await prisma.teacherProfile.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { firstName: true, lastName: true } },
        subjects: { include: { subject: { select: { id: true, name: true } } } },
      },
      orderBy: { user: { firstName: "asc" } },
    })

    // Package templates
    const templates = await prisma.packageTemplate.findMany({
      where: { status: "ACTIVE" },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    })

    // Student's subjects (to pre-select)
    let studentSubjects: { id: string; name: string }[] = []
    if (studentId) {
      const subs = await prisma.studentSubject.findMany({
        where: { studentId },
        include: { subject: { select: { id: true, name: true } } },
      })
      studentSubjects = subs.map((s) => ({ id: s.subject.id, name: s.subject.name }))
    }

    return NextResponse.json({
      teachers: teachers.map((t) => ({
        id: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        rate: Number(t.studentFacingRate),
        subjects: t.subjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name })),
      })),
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        subjectId: t.subjectId,
        subjectName: t.subject.name,
        classesIncluded: t.classesIncluded,
        validityDays: t.validityDays,
        suggestedPrice: Number(t.suggestedPrice),
        isPopular: t.isPopular,
      })),
      studentSubjects,
    })
  } catch (error) {
    console.error("GET /api/students/convert/data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
