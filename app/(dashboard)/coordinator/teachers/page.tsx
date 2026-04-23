import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorTeachersClient } from "./CoordinatorTeachersClient"

export const dynamic = "force-dynamic"

export default async function CoordinatorTeachersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const teachersRaw = await prisma.teacherProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true } },
      subjects: { include: { subject: { select: { name: true } } } },
      packages: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const teachers = teachersRaw.map((t) => {
    const name = `${t.user.firstName} ${t.user.lastName}`
    const initials = `${t.user.firstName[0] || ""}${t.user.lastName[0] || ""}`.toUpperCase()

    return {
      id: t.id,
      name,
      initials,
      qualification: t.qualification || "—",
      subjects: t.subjects.map((s) => s.subject.name),
      rating: Number(t.rating),
      reviews: t.totalReviews,
      experience: `${t.experience} year${t.experience !== 1 ? "s" : ""}`,
      activeStudents: t.packages.length,
      status: t.status.toLowerCase(),
    }
  })

  return <CoordinatorTeachersClient teachers={teachers} />
}
