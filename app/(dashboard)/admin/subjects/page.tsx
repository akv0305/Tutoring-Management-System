import { prisma } from "@/lib/prisma"
import { SubjectsClient } from "./SubjectsClient"

export const dynamic = "force-dynamic"

export default async function SubjectsPage() {
  // ── Subjects ──
  const subjectsRaw = await prisma.subject.findMany({
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

  const subjects = subjectsRaw.map((s) => ({
    id: s.id,
    subjectName: s.name,
    category: s.category.replace("_", " "),
    activeTeachers: s._count.teachers,
    activeStudents: s._count.students,
    basePrice: `$${Number(s.basePriceHour)}/hr`,
    status: s.status.toLowerCase(),
  }))

  // ── Grade Bands & Grades ──
  const gradeBandsRaw = await prisma.gradeBand.findMany({
    include: {
      grades: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          shortName: true,
          sortOrder: true,
          isActive: true,
          gradeBandId: true,
          _count: { select: { students: true } },
        },
      },
      _count: {
        select: {
          teacherSubjectRates: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  const gradeBands = gradeBandsRaw.map((b) => ({
    id: b.id,
    name: b.name,
    displayName: b.displayName,
    description: b.description || "",
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    rateCount: b._count.teacherSubjectRates,
    grades: b.grades.map((g) => ({
      id: g.id,
      name: g.name,
      shortName: g.shortName,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
      gradeBandId: g.gradeBandId,
      studentCount: g._count.students,
    })),
  }))

  return <SubjectsClient subjects={subjects} gradeBands={gradeBands} />
}
