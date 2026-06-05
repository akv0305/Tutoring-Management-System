import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherScheduleClient } from "./TeacherScheduleClient"
import { getWeekDatesInTZ, utcToLocal, refDateToLocalStr, getTzAbbr } from "@/lib/timezone"

export const dynamic = "force-dynamic"

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
  const teacherTZ = teacher.timezone || "America/New_York"
  const tzWeekDates = getWeekDatesInTZ(weekOffset, teacherTZ)
  // weekStart = Monday midnight UTC ref, weekEnd = next Monday midnight UTC ref
  const weekStartRef = tzWeekDates[0]
  const weekEndRef = new Date(tzWeekDates[6].getTime() + 86400000)

  // For DB query, expand the window by ±1 day to catch timezone edge cases
  const queryStart = new Date(weekStartRef.getTime() - 86400000)
  const queryEnd = new Date(weekEndRef.getTime() + 86400000)

  const classes = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      scheduledAt: { gte: queryStart, lt: queryEnd },
    },
    include: {
      student: { select: { firstName: true, lastName: true, grade: true } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  type ScheduleBlock = {
    id: string
    label: string
    sublabel: string
    subject: string
    studentName: string
    startSlot: number
    duration: number
    dayIndex: number
    colorClass: string
    isTrial: boolean
    status: string
    meetingLink: string | null
    scheduledAt: string
    time: string
    topicCovered: string
    studentNotes: string
  }

  const blocks: ScheduleBlock[] = classes
    .map((c) => {
      const dt = new Date(c.scheduledAt)
      const local = utcToLocal(dt, teacherTZ)

      // Only include if the local date falls within our week
      const localDateStr = local.dateStr
      const weekDateStrs = tzWeekDates.map(refDateToLocalStr)
      const dayIndex = weekDateStrs.indexOf(localDateStr)
      if (dayIndex === -1) return null

      const startSlot = local.hour - 8

      return {
        id: c.id,
        label: `${c.student.firstName} ${c.student.lastName}`,
        sublabel: `${c.subject.name} G${c.student.grade}`,
        subject: c.subject.name,
        studentName: `${c.student.firstName} ${c.student.lastName}`,
        startSlot: local.hour,
        duration: 1,
        dayIndex,
        colorClass: SUBJECT_COLORS[c.subject.name] ?? DEFAULT_COLOR,
        isTrial: c.isTrial,
        status: c.status.toLowerCase(),
        meetingLink: c.meetingLink || null,
        scheduledAt: c.scheduledAt.toISOString(),
        time: local.formatted12h,
        topicCovered: c.topicCovered || "",
        studentNotes: c.studentNotes || "",
      }
    })
    .filter((b): b is ScheduleBlock => b !== null)

    // Week dates for header (in teacher TZ)
    const dates = tzWeekDates.map((d) => d.getUTCDate().toString())

    const monthYear = `${tzWeekDates[0].toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    })} ${dates[0]}–${dates[6]}, ${tzWeekDates[0].getUTCFullYear()}`
  
    // Today's day index for highlighting (in teacher TZ)
    const todayLocal = utcToLocal(now, teacherTZ)
    const todayDateStr = todayLocal.dateStr
    const weekDateStrs = tzWeekDates.map(refDateToLocalStr)
    const todayIdx = weekDateStrs.indexOf(todayDateStr)
    const isCurrentWeek = todayIdx !== -1  

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
