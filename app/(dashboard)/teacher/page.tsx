import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherDashboardClient } from "./TeacherDashboardClient"

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

  // Today boundaries
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // This week boundaries (Mon-Sun)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  weekEnd.setHours(0, 0, 0, 0)

  // Fetch all classes for this teacher
  const allClasses = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    include: {
      student: { select: { firstName: true, lastName: true, grade: true } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  // Today's classes — now includes sessionNotes and scheduledAtISO
  const todayClasses = allClasses
    .filter((c) => c.scheduledAt >= todayStart && c.scheduledAt <= todayEnd)
    .map((c) => {
      const initials = `${c.student.firstName[0]}${c.student.lastName[0]}`
      return {
        id: c.id,
        time:
          c.scheduledAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }) +
          " – " +
          new Date(
            c.scheduledAt.getTime() + (c.duration ?? 60) * 60000
          ).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }) +
          " " +
          (c.timezone ?? "EST"),
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
      }
    })

  // Upcoming this week (after today)
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
      }),
      time: c.scheduledAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
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

  // ── NEW: Build availability / booked-slots / blocked-dates for RescheduleModal ──
  const availability = teacher.availabilities.map((a) => ({
    dayOfWeek: DAY_OF_WEEK_MAP[a.dayOfWeek] ?? 0,
    startTime: a.startTime,
    endTime: a.endTime,
  }))

  // Booked slots: all future non-cancelled classes for this teacher
  const futureClasses = allClasses.filter(
    (c) =>
      c.scheduledAt > now &&
      ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)
  )
  const bookedSlots = futureClasses.map((c) => ({
    date: c.scheduledAt.toISOString().slice(0, 10),
    time: c.scheduledAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    duration: c.duration ?? 60,
  }))

  const blockedDates = teacher.blockedDates.map((bd) => ({
    date: bd.blockedDate.toISOString().slice(0, 10),
    reason: bd.reason ?? "",
  }))
  // ── END NEW ──

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
    // New data for RescheduleModal
    availability,
    bookedSlots,
    blockedDates,
    teacherTimezone: teacher.timezone ?? "EST",
  }

  return <TeacherDashboardClient data={data} />
}
