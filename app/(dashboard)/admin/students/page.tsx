import { prisma } from "@/lib/prisma"
import { StudentsClient } from "./StudentsClient"

export const dynamic = "force-dynamic"

export default async function StudentsPage() {
  const [studentsRaw, coordinatorsRaw] = await Promise.all([
    prisma.student.findMany({
      include: {
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        coordinator: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        gradeRef: {
          include: { gradeBand: { select: { displayName: true } } },
        },
        subjects: {
          include: { subject: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coordinatorProfile.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
      orderBy: { user: { firstName: "asc" } },
    }),
  ])

  const students = studentsRaw.map((s) => ({
    id: s.id,
    studentName: `${s.firstName} ${s.lastName}`,
    parentName: s.parent
      ? `${s.parent.user.firstName} ${s.parent.user.lastName}`
      : "—",
    email: s.parent?.user.email ?? "—",
    phone: s.parent?.user.phone ?? "—",
    grade: s.grade || "—",
    gradeBand: (s as any).gradeRef?.gradeBand?.displayName || null,
    subjects: s.subjects.map((ss) => ss.subject.name),
    coordinator: s.coordinator
      ? `${s.coordinator.user.firstName} ${s.coordinator.user.lastName}`
      : "Unassigned",
    coordinatorId: s.coordinatorId || "",
    status: s.status.toLowerCase().replace("_", " "),
    joinedDate: s.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
  }))

  const coordinators = coordinatorsRaw.map((c) => ({
    id: c.id,
    name: `${c.user.firstName} ${c.user.lastName}`,
    currentStudents: c._count.students,
    bucketSize: c.bucketSize,
  }))

  const kpis = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    inactive: students.filter((s) => s.status === "inactive").length,
    trialPending: students.filter((s) => s.status === "trial pending").length,
  }

  return (
    <StudentsClient
      students={students}
      kpis={kpis}
      coordinators={coordinators}
    />
  )
}
