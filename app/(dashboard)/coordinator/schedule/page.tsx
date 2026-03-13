import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorScheduleClient } from "./CoordinatorScheduleClient"

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-teal-100 border-teal-400 text-teal-800",
  Physics: "bg-blue-100 border-blue-400 text-blue-800",
  Chemistry: "bg-purple-100 border-purple-400 text-purple-800",
  English: "bg-amber-100 border-amber-400 text-amber-800",
  Science: "bg-emerald-100 border-emerald-400 text-emerald-800",
  "SAT Prep": "bg-orange-100 border-orange-400 text-orange-800",
  "ACT Prep": "bg-orange-100 border-orange-400 text-orange-800",
  "Computer Science": "bg-indigo-100 border-indigo-400 text-indigo-800",
}
const DEFAULT_COLOR = "bg-gray-100 border-gray-400 text-gray-800"

export default async function SchedulePage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/unauthorized")

  // Get current week boundaries (Mon-Sun)
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  weekEnd.setHours(0, 0, 0, 0)

  // Fetch classes for coordinator's students this week
  const classes = await prisma.class.findMany({
    where: {
      student: { coordinatorId: coordinator.id },
      scheduledAt: { gte: weekStart, lt: weekEnd },
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  const classBlocks = classes.map((c) => {
    const dt = new Date(c.scheduledAt)
    const jsDay = dt.getDay() // 0=Sun
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1 // 0=Mon...6=Sun
    const hour = dt.getHours()
    const startHour = hour - 8 // grid starts at 8 AM

    return {
      id: c.id,
      student: `${c.student.firstName} ${c.student.lastName}`,
      teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      subject: c.subject.name,
      subjectColor: SUBJECT_COLORS[c.subject.name] ?? DEFAULT_COLOR,
      startHour: Math.max(0, startHour),
      duration: 1,
      dayIndex,
      isTrial: c.isTrial,
      status: c.status.toLowerCase(),
    }
  })

  // Build dates array for the week header
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.getDate().toString()
  })

  const monthYear = weekStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  // Build legend from actual subjects used
  const usedSubjects = [...new Set(classBlocks.map((b) => b.subject))]
  const legend = usedSubjects.map((name) => ({
    label: name,
    cls: (SUBJECT_COLORS[name] ?? DEFAULT_COLOR).replace(/text-\S+/, "").trim(),
  }))

  return (
    <CoordinatorScheduleClient
      classBlocks={classBlocks}
      dates={dates}
      monthYear={monthYear}
      legend={legend}
      hasTrial={classBlocks.some((b) => b.isTrial)}
    />
  )
}
