import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorTeachersClient } from "./CoordinatorTeachersClient"

export const dynamic = "force-dynamic"

export default async function CoordinatorTeachersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const now = new Date()
  const fourWeeksFromNow = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

  const teachersRaw = await prisma.teacherProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      subjects: { include: { subject: { select: { name: true } } } },
      packages: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      availabilities: {
        where: { isEnabled: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      blockedDates: {
        where: { blockedDate: { gte: now } },
        select: { blockedDate: true },
      },
      classes: {
        where: {
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          scheduledAt: { gte: now, lte: fourWeeksFromNow },
        },
        select: {
          scheduledAt: true,
          duration: true,
          subject: { select: { name: true } },
          student: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const teachers = teachersRaw.map((t) => {
    const name = `${t.user.firstName} ${t.user.lastName}`
    const initials = `${t.user.firstName[0] || ""}${t.user.lastName[0] || ""}`.toUpperCase()

    const availabilitySlots = t.availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    }))

    const blockedDates = t.blockedDates.map((b) =>
      b.blockedDate.toISOString().split("T")[0]
    )

    const upcomingClasses = t.classes.map((c) => ({
      scheduledAt: c.scheduledAt.toISOString(),
      duration: c.duration,
      subject: c.subject.name,
      student: `${c.student.firstName} ${c.student.lastName}`,
    }))

    let weeklyHours = 0
    t.availabilities.forEach((a) => {
      const startH = parseInt(a.startTime.split(":")[0], 10)
      const endH = parseInt(a.endTime.split(":")[0], 10)
      weeklyHours += Math.max(0, endH - startH)
    })

    return {
      id: t.id,
      name,
      initials,
      email: t.user.email,
      phone: t.user.phone || null,
      qualification: t.qualification || "—",
      bio: t.bio || null,
      subjects: t.subjects.map((s) => s.subject.name),
      rating: Number(t.rating),
      reviews: t.totalReviews,
      experience: `${t.experience} year${t.experience !== 1 ? "s" : ""}`,
      activeStudents: t.packages.length,
      status: t.status.toLowerCase(),
      timezone: t.timezone,
      availabilitySlots,
      blockedDates,
      upcomingClasses,
      weeklyHours,
      upcomingClassCount: t.classes.length,
    }
  })

  return <CoordinatorTeachersClient teachers={teachers} />
}
