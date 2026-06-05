import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherDashboardClient } from "./TeacherDashboardClient"
import { utcToLocal, localToUTC, getTzAbbr, getWeekDatesInTZ, refDateToLocalStr } from "@/lib/timezone"

const DAY_OF_WEEK_MAP: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
}

export const dynamic = "force-dynamic"

export default async function TeacherPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TEACHER") redirect("/unauthorized")

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: {
      user: { select: { firstName: true, lastName: true } },
      availabilities: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      blockedDates: {
        where: { blockedDate: { gte: new Date() } },
        select: { blockedDate: true, reason: true },
      },
    },
  })
  if (!teacher) redirect("/unauthorized")

  // ── Timezone setup ──
  const teacherTZ = teacher.timezone || "America/New_York"
  const tzAbbr = getTzAbbr(teacherTZ)

  const now = new Date()
  const nowLocal = utcToLocal(now, teacherTZ)

  // Today boundaries in teacher's timezone
  const todayStr = nowLocal.dateStr
  const todayStart = localToUTC(todayStr, "00:00", teacherTZ)
  const todayEnd = localToUTC(todayStr, "23:59", teacherTZ)

  // This week boundaries (Mon-Sun) in teacher's timezone
  const weekDates = getWeekDatesInTZ(0, teacherTZ)
  const mondayStr = refDateToLocalStr(weekDates[0])
  const sundayStr = refDateToLocalStr(weekDates[6])
  const weekStart = localToUTC(mondayStr, "00:00", teacherTZ)
  const weekEnd = localToUTC(sundayStr, "23:59", teacherTZ)

  // Fetch all classes for this teacher
  const allClasses = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    include: {
      student: { select: { firstName: true, lastName: true, grade: true } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  // Today's classes — formatted in teacher's timezone
  const todayClasses = allClasses
    .filter((c) => c.scheduledAt >= todayStart && c.scheduledAt <= todayEnd)
    .map((c) => {
      const initials = `${c.student.firstName[0]}${c.student.lastName[0]}`
      const endTime = new Date(c.scheduledAt.getTime() + (c.duration ?? 60) * 60000)
      return {
        id: c.id,
        time:
          c.scheduledAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: teacherTZ,
          }) +
          " – " +
          endTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: teacherTZ,
          }) +
          " " + tzAbbr,
        studentName: `${c.student.firstName} ${c.student.lastName}`,
        initials,
        subject: `${c.subject.name} — Grade ${c.student.grade}`,
        subjectName: c.subject.name,
        topic: c.topicCovered ?? "—",
        sessionNotes: c.sessionNotes ?? "",
        status: c.isTrial ? "trial" : c.status.toLowerCase(),
        isTrial: c.isTrial,
        meetingLink: c.meetingLink,
        scheduledAtISO: c.scheduledAt.toISOString(),
        duration: c.duration ?? 60,
        studentNotes: c.studentNotes ?? "",
      }
    })

  // Upcoming this week (after today) — formatted in teacher's timezone
  const upcomingWeek = allClasses
    .filter(
      (c) =>
        c.scheduledAt > todayEnd &&
        c.scheduledAt < weekEnd &&
        ["SCHEDULED", "CONFIRMED"].includes(c.status)
    )
    .map((c) => ({
      date: c.scheduledAt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: teacherTZ,
      }),
      time: c.scheduledAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: teacherTZ,
      }),
      student: `${c.student.firstName} ${c.student.lastName}`,
      subject: c.subject.name,
    }))

  // This week class count
  const thisWeekCount = allClasses.filter(
    (c) =>
      c.scheduledAt >= weekStart &&
      c.scheduledAt < weekEnd &&
      ["SCHEDULED", "CONFIRMED", "COMPLETED"].includes(c.status)
  ).length

  // Completed classes (all time)
  const completedClasses = allClasses.filter((c) => c.status === "COMPLETED")
  const totalCompleted = completedClasses.length

  // Average rating
  const ratingsArr = completedClasses
    .filter((c) => c.parentRating !== null)
    .map((c) => c.parentRating as number)
  const avgRating =
    ratingsArr.length > 0
      ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1)
      : "—"

  // This month earnings
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const monthCompleted = completedClasses.filter(
    (c) => c.completedAt && c.completedAt >= monthStart && c.completedAt <= monthEnd
  ).length
  const monthEarnings = monthCompleted * Number(teacher.compensationRate)

  // Feedback (recent rated classes)
  const feedback = completedClasses
    .filter((c) => c.parentRating !== null)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
    )
    .slice(0, 3)
    .map((c) => ({
      rating: c.parentRating as number,
      from: `${c.student.firstName} ${c.student.lastName}'s Parent`,
      text: c.parentFeedback ?? "No feedback text.",
      date:
        c.completedAt?.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: teacherTZ,
        }) ?? "—",
    }))

  // Performance stats
  const cancelledCount = allClasses.filter(
    (c) =>
      c.status === "CANCELLED_TEACHER" &&
      c.scheduledAt >= monthStart &&
      c.scheduledAt <= monthEnd
  ).length
  const noShowCount = allClasses.filter(
    (c) =>
      c.status === "NO_SHOW_TEACHER" &&
      c.scheduledAt >= monthStart &&
      c.scheduledAt <= monthEnd
  ).length
  const completionRate =
    totalCompleted > 0
      ? (
          (totalCompleted / (totalCompleted + cancelledCount + noShowCount)) *
          100
        ).toFixed(1)
      : "—"

  // ── Availability / booked-slots / blocked-dates for RescheduleModal ──
  const availability = teacher.availabilities.map((a) => ({
    dayOfWeek: DAY_OF_WEEK_MAP[a.dayOfWeek] ?? 0,
    startTime: a.startTime,
    endTime: a.endTime,
  }))

  // Booked slots: all future non-cancelled classes — converted to teacher's TZ
  const futureClasses = allClasses.filter(
    (c) =>
      c.scheduledAt > now &&
      ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)
  )
  const bookedSlots = futureClasses.map((c) => {
    const local = utcToLocal(c.scheduledAt, teacherTZ)
    return {
      date: local.dateStr,
      time: local.timeStr,
      duration: c.duration ?? 60,
    }
  })

  const blockedDates = teacher.blockedDates.map((bd) => {
    const local = utcToLocal(bd.blockedDate, teacherTZ)
    return {
      date: local.dateStr,
      reason: bd.reason ?? "",
    }
  })

  const data = {
    teacherFirstName: teacher.user.firstName,
    teacherTitle: teacher.qualification?.startsWith("Ph.D") ? "Dr." : "",
    todayClasses,
    upcomingWeek,
    todayCount: todayClasses.length,
    thisWeekCount,
    avgRating,
    ratingCount: ratingsArr.length,
    monthEarnings,
    monthCompleted,
    feedback,
    stats: {
      totalCompleted,
      completionRate: `${completionRate}%`,
      avgRating: ratingsArr.length > 0 ? `${avgRating} / 5.0` : "—",
      noShows: String(noShowCount),
      cancellations: `${cancelledCount} of 3 allowed`,
    },
    availability,
    bookedSlots,
    blockedDates,
    teacherTimezone: teacherTZ,
  }

  return <TeacherDashboardClient data={data} />
}
