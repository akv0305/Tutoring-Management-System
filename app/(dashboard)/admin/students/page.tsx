import { prisma } from "@/lib/prisma"
import { StudentsClient } from "./StudentsClient"

export default async function StudentsPage() {
  const studentsRaw = await prisma.student.findMany({
    include: {
      parent: {
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      },
      coordinator: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      subjects: {
        include: { subject: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const students = studentsRaw.map((s) => ({
    id: s.id,
    studentName: `${s.firstName} ${s.lastName}`,
    parentName: s.parent ? `${s.parent.user.firstName} ${s.parent.user.lastName}` : "—",
    email: s.parent?.user.email ?? "—",
    phone: s.parent?.user.phone ?? "—",
    grade: `Grade ${s.grade}`,
    subjects: s.subjects.map((ss) => ss.subject.name),
    coordinator: s.coordinator
      ? `${s.coordinator.user.firstName} ${s.coordinator.user.lastName}`
      : "Unassigned",
    status: s.status.toLowerCase().replace("_", " "),
    joinedDate: s.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
  }))

  const kpis = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    inactive: students.filter((s) => s.status === "inactive").length,
    trialPending: students.filter((s) => s.status === "trial pending").length,
  }

  return <StudentsClient students={students} kpis={kpis} />
}
