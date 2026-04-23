import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentDashboardClient } from "./ParentDashboardClient"

export const dynamic = "force-dynamic"

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  // Find parent profile
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  if (!parentProfile) redirect("/login")

  // Get children
  const students = await prisma.student.findMany({
    where: { parentId: parentProfile.id },
    include: {
      subjects: { include: { subject: { select: { name: true } } } },
      coordinator: {
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      },
      packages: {
        where: { status: "ACTIVE" },
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          subject: { select: { name: true } },
        },
      },
      classes: {
        orderBy: { scheduledAt: "asc" },
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          subject: { select: { name: true } },
        },
      },
    },
  })

  // Aggregate data across all children
  const now = new Date()

  const upcomingClasses = students.flatMap((s) =>
    s.classes
      .filter((c) => c.scheduledAt > now && ["SCHEDULED", "CONFIRMED"].includes(c.status))
      .map((c) => ({
        id: c.id,
        studentName: `${s.firstName} ${s.lastName}`,
        day: c.scheduledAt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        time: `${c.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(c.scheduledAt.getTime() + c.duration * 60000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
        teacherName: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
        initials: `${c.teacher.user.firstName[0]}${c.teacher.user.lastName[0]}`,
        subject: `${c.subject.name}${c.topicCovered ? ` — ${c.topicCovered}` : ""}`,
        status: c.status.toLowerCase(),
        canJoin: c.status === "CONFIRMED",
        meetingLink: c.meetingLink || null,
      }))
  ).slice(0, 5)

  const completedCount = students.reduce(
    (sum, s) => sum + s.classes.filter((c) => c.status === "COMPLETED").length, 0
  )

  const ratingsGiven = students.flatMap((s) =>
    s.classes
      .filter((c) => c.parentRating !== null)
      .map((c) => ({
        date: `${c.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${c.subject.name}`,
        rating: c.parentRating!,
        text: c.parentFeedback ?? "",
      }))
  ).slice(0, 3)

  const avgRating = ratingsGiven.length > 0
    ? (ratingsGiven.reduce((sum, r) => sum + r.rating, 0) / ratingsGiven.length).toFixed(1)
    : "—"

  const activePackages = students.flatMap((s) =>
    s.packages.map((p) => ({
      id: p.id,
      name: `${p.classesIncluded} Classes — ${p.subject.name}`,
      teacher: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
      total: p.classesIncluded,
      used: p.classesUsed,
      remaining: p.classesIncluded - p.classesUsed,
      expires: p.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: p.status.toLowerCase(),
      barColor: p.classesIncluded - p.classesUsed <= 2 ? "bg-[#F59E0B]" : "bg-[#0D9488]",
      isLow: p.classesIncluded - p.classesUsed <= 2,
    }))
  )

  const totalRemaining = activePackages.reduce((sum, p) => sum + p.remaining, 0)

  // Coordinator info (from first child that has one)
  const coordStudent = students.find((s) => s.coordinator)
  const coordinator = coordStudent?.coordinator
    ? {
        name: `${coordStudent.coordinator.user.firstName} ${coordStudent.coordinator.user.lastName}`,
        initials: `${coordStudent.coordinator.user.firstName[0]}${coordStudent.coordinator.user.lastName[0]}`,
        email: coordStudent.coordinator.user.email,
        phone: coordStudent.coordinator.user.phone ?? "",
      }
    : null

  const data = {
    parentFirstName: parentProfile.user.firstName,
    childrenNames: students.map((s) => s.firstName),
    upcomingClasses,
    completedCount,
    totalRemaining,
    avgRating,
    activePackages,
    coordinator,
    feedback: ratingsGiven,
  }

  return <ParentDashboardClient data={data} />
}