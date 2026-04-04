import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherScheduleClient } from "./TeacherScheduleClient"

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-[#0D9488]/90 text-white border-teal-600",
  Physics: "bg-[#1E3A5F] text-white border-blue-800",
  Chemistry: "bg-purple-500/90 text-white border-purple-700",
  English: "bg-amber-500/90 text-white border-amber-700",
  "SAT Prep": "bg-[#F59E0B] text-[#1E293B] border-amber-600",
  "ACT Prep": "bg-[#F59E0B] text-[#1E293B] border-amber-600",
  "AP Calculus": "bg-[#1E3A5F] text-white border-blue-800",
  "Computer Science": "bg-indigo-500/90 text-white border-indigo-700",
  Science: "bg-emerald-500/90 text-white border-emerald-700",
}
const DEFAULT_COLOR = "bg-gray-500/90 text-white border-gray-700"

export default async function TeacherSchedulePage({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TEACHER") redirect("/unauthorized")

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) redirect("/unauthorized")

  // Week offset from query param (0 = current week)
  const weekOffset = parseInt(searchParams.week || "0", 10) || 0

  // Calculate Mon-Sun for the requested week
  const now = new Date()
  const utcDay = now.getUTCDay()
  const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay
  const weekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + mondayOffset + weekOffset * 7,
      0, 0, 0, 0
    )
  )
  const weekEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + mondayOffset + weekOffset * 7 + 7,
      0, 0, 0, 0
    )
  )

  const classes = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      scheduledAt: { gte: weekStart, lt: weekEnd },
    },
    include: {
      student: { select: { firstName: true, lastName: true, grade: true } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  const blocks = classes.map((c) => {
    const dt = new Date(c.scheduledAt)
    const jsDay = dt.getUTCDay()
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1
    const hour = dt.getUTCHours()
    const startSlot = hour - 8

    return {
      id: c.id,
      label: `${c.student.firstName} ${c.student.lastName}`,
      sublabel: `${c.subject.name} G${c.student.grade}`,
      subject: c.subject.name,
      studentName: `${c.student.firstName} ${c.student.lastName}`,
      startSlot: Math.max(0, startSlot),
      duration: 1,
      dayIndex,
      colorClass: SUBJECT_COLORS[c.subject.name] ?? DEFAULT_COLOR,
      isTrial: c.isTrial,
      status: c.status.toLowerCase(),
      meetingLink: c.meetingLink || null,
      scheduledAt: c.scheduledAt.toISOString(),
      time: `${dt.getUTCHours() % 12 || 12}:${String(dt.getUTCMinutes()).padStart(2, "0")} ${dt.getUTCHours() >= 12 ? "PM" : "AM"}`,
      topicCovered: c.topicCovered || "",
    }
  })

  // Week dates for header
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setUTCDate(weekStart.getUTCDate() + i)
    return d.getUTCDate().toString()
  })

  const monthYear = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  })} ${dates[0]}–${dates[6]}, ${weekStart.getUTCFullYear()}`

  // Today's day index for highlighting
  const todayUtcDay = now.getUTCDay()
  const todayIdx = todayUtcDay === 0 ? 6 : todayUtcDay - 1

  // Is this the current week?
  const isCurrentWeek = weekOffset === 0

  // Legend from actual subjects
  const usedSubjects = [
    ...new Set(
      classes.map((c) => c.subject.name)
    ),
  ]
  const legend = usedSubjects.filter(Boolean).map((name) => ({
    label: name,
    cls: SUBJECT_COLORS[name] ?? DEFAULT_COLOR,
  }))

  // Teacher availability + booked slots for reschedule modal
  const availability = await prisma.teacherAvailability.findMany({
    where: { teacherId: teacher.id },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  })

  const bookedSlots = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    select: { scheduledAt: true, duration: true },
  })

  const bookedSlotsFormatted = bookedSlots.map((b) => ({
    start: b.scheduledAt.toISOString(),
    duration: b.duration || 1,
  }))

  const blockedDatesRaw = await prisma.teacherBlockedDate.findMany({
    where: { teacherId: teacher.id },
    select: { blockedDate: true },
  })

  const teacherBlockedDates = blockedDatesRaw.map((b) =>
    b.blockedDate.toISOString().split("T")[0]
  )

  return (
    <TeacherScheduleClient
      blocks={blocks}
      dates={dates}
      monthYear={monthYear}
      todayIdx={isCurrentWeek ? todayIdx : -1}
      legend={legend}
      hasTrial={blocks.some((b) => b.isTrial)}
      teacherTimezone={teacher.timezone}
      weekOffset={weekOffset}
      teacherAvailability={availability}
      teacherBookedSlots={bookedSlotsFormatted}
      teacherBlockedDates={teacherBlockedDates}
      teacherName={`${session.user.firstName} ${session.user.lastName}`}
    />
  )
}
