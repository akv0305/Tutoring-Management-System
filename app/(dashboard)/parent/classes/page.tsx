import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentClassesClient } from "./ParentClassesClient"
import { getTzAbbr, utcToLocal } from "@/lib/timezone"
import { expirePendingClasses } from "@/lib/expire-pending-classes"

export const dynamic = "force-dynamic"

const UPCOMING_STATUSES = ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"]
const COMPLETED_STATUSES = ["COMPLETED"]
const CANCELLED_STATUSES = [
  "CANCELLED_STUDENT",
  "CANCELLED_TEACHER",
  "NO_SHOW_STUDENT",
  "NO_SHOW_TEACHER",
]

export default async function ClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true, firstName: true } } },
  })
  if (!parent) redirect("/unauthorized")

  const parentTZ = parent.timezone || "America/New_York"
  const tzLabel = getTzAbbr(parentTZ)

  const studentIds = parent.students.map((s) => s.id)
  const childName = parent.students[0]?.firstName ?? "your child"

  // ── AUTO-EXPIRE past pending-payment classes before fetching ──
  await expirePendingClasses({ studentIds })

  const allClasses = await prisma.class.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      subject: { select: { name: true } },
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: { scheduledAt: "desc" },
  })

  const now = new Date()

  // ── Build unified ClassRow[] ──
  const classes = allClasses.map((c) => {
    const dt = c.scheduledAt
    const endTime = new Date(dt.getTime() + (c.duration ?? 60) * 60_000)
    const teacherName = `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
    const initials = `${c.teacher.user.firstName[0]}${c.teacher.user.lastName[0]}`

    const isUpcoming = UPCOMING_STATUSES.includes(c.status)
    const isCompleted = COMPLETED_STATUSES.includes(c.status)
    const isCancelled = CANCELLED_STATUSES.includes(c.status)
    const isPast = dt < now && !isCompleted && !isCancelled

    // Can join if class starts within 15 min and hasn't ended
    const canJoin =
      isUpcoming &&
      dt.getTime() - now.getTime() < 15 * 60_000 &&
      endTime.getTime() > now.getTime()

    return {
      id: c.id,
      scheduledAt: dt.toISOString(),
      dayLabel: dt.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: parentTZ,
      }),
      dateNum: parseInt(utcToLocal(dt, parentTZ).dateStr.split("-")[2]),
      month: dt.toLocaleDateString("en-US", {
        month: "short",
        timeZone: parentTZ,
      }),
      dateFormatted: dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: parentTZ,
      }),
      time:
        dt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: parentTZ,
        }) +
        " – " +
        endTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: parentTZ,
        }) +
        " " +
        tzLabel,
      duration: `${c.duration ?? 60} min`,
      teacher: teacherName,
      teacherInitials: initials,
      teacherId: c.teacherId,
      subject: c.subject.name,
      topic: c.topicCovered ?? "",
      status: c.status,
      statusLower: c.status.toLowerCase(),
      canJoin,
      isTrial: c.isTrial,
      meetingLink: c.meetingLink || null,
      studentNotes: c.studentNotes ?? "",
      cancelReason:
        c.cancelReason ?? (isCancelled ? c.status.toLowerCase().replace(/_/g, " ") : ""),
      rated: c.parentRating !== null,
      rating: c.parentRating,
      hasNotes: !!c.sessionNotes,
      isPast,
      isUpcoming,
      isCompleted,
      isCancelled,
    }
  })

  // ── KPIs ──
  const kpis = {
    total: classes.length,
    upcoming: classes.filter((c) => c.isUpcoming).length,
    completed: classes.filter((c) => c.isCompleted).length,
    cancelled: classes.filter((c) => c.isCancelled).length,
    pendingPayment: classes.filter(
      (c) => c.status === "PENDING_PAYMENT"
    ).length,
  }

  // ── Calendar data ──
  const todayLocal = utcToLocal(now, parentTZ)
  const monthStart = new Date(todayLocal.year, todayLocal.month - 1, 1)
  const monthEnd = new Date(
    todayLocal.year,
    todayLocal.month,
    0,
    23,
    59,
    59,
    999
  )

  const classDates = [
    ...new Set(
      allClasses
        .filter(
          (c) =>
            c.scheduledAt >= monthStart &&
            c.scheduledAt <= monthEnd &&
            [...UPCOMING_STATUSES, ...COMPLETED_STATUSES].includes(c.status)
        )
        .map((c) => utcToLocal(c.scheduledAt, parentTZ).day)
    ),
  ]

  const calendarData = {
    year: todayLocal.year,
    month: now.toLocaleDateString("en-US", {
      month: "long",
      timeZone: parentTZ,
    }),
    startDay: new Date(todayLocal.year, todayLocal.month - 1, 1).getDay(),
    days: new Date(todayLocal.year, todayLocal.month, 0).getDate(),
    classDates,
    today: todayLocal.day,
  }

  return (
    <ParentClassesClient
      childName={childName}
      classes={classes}
      kpis={kpis}
      calendarData={calendarData}
    />
  )
}
