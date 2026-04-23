import { prisma } from "@/lib/prisma"
import { SubjectsClient } from "./SubjectsClient"

export const dynamic = "force-dynamic"

export default async function SubjectsPage() {
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

  return <SubjectsClient subjects={subjects} />
}
