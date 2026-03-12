import { prisma } from "@/lib/prisma"
import { TeachersClient } from "./TeachersClient"

export default async function TeachersPage() {
  const teachersRaw = await prisma.teacherProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      subjects: {
        include: { subject: { select: { name: true } } },
      },
      packages: {
        where: { status: "ACTIVE" },
        select: { studentId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const teachers = teachersRaw.map((t) => {
    const uniqueStudentIds = new Set(t.packages.map((p) => p.studentId))
    return {
      id: t.id,
      teacherName: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email,
      qualification: t.qualification ?? "—",
      subjects: t.subjects.map((ts) => ts.subject.name),
      hourlyRate: `$${Number(t.compensationRate)}/hr`,
      studentFacingRate: `$${Number(t.studentFacingRate)}/hr`,
      rating: Number(t.rating),
      totalReviews: t.totalReviews,
      activeStudents: uniqueStudentIds.size,
      experience: t.experience,
      status: t.status.toLowerCase().replace("_", " "),
    }
  })

  const activeCount = teachers.filter((t) => t.status === "active").length
  const onLeaveCount = teachers.filter((t) => t.status === "on leave").length
  const avgRating = teachers.length > 0
    ? (teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1)
    : "0.0"

  const kpis = {
    total: teachers.length,
    active: activeCount,
    onLeave: onLeaveCount,
    avgRating: `${avgRating} ★`,
  }

  return <TeachersClient teachers={teachers} kpis={kpis} />
}
