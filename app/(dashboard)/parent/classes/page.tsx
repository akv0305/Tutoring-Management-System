import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentClassesClient } from "./ParentClassesClient"
import { getTzAbbr, utcToLocal } from "@/lib/timezone"

export const dynamic = "force-dynamic"

type Tab = "upcoming" | "completed" | "cancelled"

const VALID_TABS: Record<string, Tab> = {
  upcoming: "upcoming",
  scheduled: "upcoming",
  confirmed: "upcoming",
  pending_payment: "upcoming",
  completed: "completed",
  cancelled: "cancelled",
  cancelled_student: "cancelled",
  cancelled_teacher: "cancelled",
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true, firstName: true } } },
  })
  if (!parent) redirect("/unauthorized")
  
  const parentTZ = parent.timezone || "America/New_York"
  const tzLabel = getTzAbbr(parentTZ)

  // Resolve default tab from query param
  const rawStatus = (searchParams.status ?? "").toLowerCase().trim()
  const defaultTab: Tab = VALID_TABS[rawStatus] ?? "upcoming"

  const studentIds = parent.students.map((s) => s.id)
  const childName = parent.students[0]?.firstName ?? "your child"

  const allClasses = await prisma.class.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      subject: { select: { name: true } },
      student: { select: { firstName: true, lastName: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  const now = new Date()

  // Upcoming — include PENDING_PAYMENT so parents can see reserved classes
  const upcoming = allClasses
    .filter(
      (c) =>
        c.scheduledAt >= now &&
        ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)
    )
    .map((c) => {
      const dt = c.scheduledAt
      const endTime = new Date(dt.getTime() + (c.duration ?? 60) * 60000)
      const teacherName = `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
      const initials = `${c.teacher.user.firstName[0]}${c.teacher.user.lastName[0]}`
      // Can join if class starts within 15 minutes
      const canJoin = dt.getTime() - now.getTime() < 15 * 60000 && dt.getTime() > now.getTime() - 60 * 60000

      return {
        id: c.id,
        dayLabel: dt.toLocaleDateString("en-US", { weekday: "long", timeZone: parentTZ }),
        dateNum: parseInt(utcToLocal(dt, parentTZ).dateStr.split("-")[2]),
        month: dt.toLocaleDateString("en-US", { month: "short", timeZone: parentTZ }),
        time:
          dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: parentTZ }) +
          " – " +
          endTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: parentTZ }) +
          " " + tzLabel,
        duration: `${c.duration ?? 60} min`,
        teacher: teacherName,
        teacherInitials: initials,
        subject: `${c.subject.name}${c.topicCovered ? " — " + c.topicCovered : ""}`,
        status: c.status.toLowerCase(),
        canJoin,
        isTrial: c.isTrial,
        teacherId: c.teacherId,
        meetingLink: c.meetingLink || null,
        studentNotes: c.studentNotes ?? "",
      }
    })

  // Completed
  const completed = allClasses
    .filter((c) => c.status === "COMPLETED")
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
    .map((c) => ({
      id: c.id,
      date: (c.completedAt ?? c.scheduledAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: parentTZ,   // ← ADD THIS
      }),
      subject: c.subject.name,
      topic: c.topicCovered ?? "—",
      teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      duration: `${c.duration ?? 60} min`,
      rated: c.parentRating !== null,
      rating: c.parentRating,
      hasNotes: !!c.sessionNotes,
    }))

  // Cancelled
  const cancelled = allClasses
    .filter((c) =>
      ["CANCELLED_STUDENT", "CANCELLED_TEACHER", "NO_SHOW_STUDENT", "NO_SHOW_TEACHER"].includes(c.status)
    )
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .map((c) => ({
      id: c.id,
      date: c.scheduledAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: parentTZ,   // ← ADD THIS
      }),
      subject: c.subject.name,
      teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      reason: c.cancelReason ?? c.status.toLowerCase().replace("_", " "),
    }))

  // Month stats — include PENDING_PAYMENT in scheduled count
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const monthClasses = allClasses.filter(
    (c) => c.scheduledAt >= monthStart && c.scheduledAt <= monthEnd
  )
  const monthStats = {
    scheduled: monthClasses.filter((c) => ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)).length,
    completed: monthClasses.filter((c) => c.status === "COMPLETED").length,
    cancelled: monthClasses.filter((c) =>
      ["CANCELLED_STUDENT", "CANCELLED_TEACHER", "NO_SHOW_STUDENT", "NO_SHOW_TEACHER"].includes(c.status)
    ).length,
  }

  // Calendar class dates this month — include PENDING_PAYMENT
  const todayLocal = utcToLocal(now, parentTZ)

  // Calendar class dates this month
  const classDates = [
    ...new Set(
      allClasses
        .filter(
          (c) =>
            c.scheduledAt >= monthStart &&
            c.scheduledAt <= monthEnd &&
            ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)
        )
        .map((c) => {
          const local = utcToLocal(c.scheduledAt, parentTZ)
          return local.day
        })
    ),
  ]

  const calendarData = {
    year: todayLocal.year,
    month: now.toLocaleDateString("en-US", { month: "long", timeZone: parentTZ }),
    startDay: new Date(todayLocal.year, todayLocal.month - 1, 1).getDay(),
    days: new Date(todayLocal.year, todayLocal.month, 0).getDate(),
    classDates,
    today: todayLocal.day,
  }

  return (
    <ParentClassesClient
      childName={childName}
      upcoming={upcoming}
      completed={completed}
      cancelled={cancelled}
      monthStats={monthStats}
      calendarData={calendarData}
      defaultTab={defaultTab}
    />
  )
}
