import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorScheduleClient } from "./CoordinatorScheduleClient"

export const dynamic = "force-dynamic"

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

/** Parse "YYYY-MM-DD" into year/month/day integers — no timezone issues */
function parseDateParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number)
  return [y, m, d]
}

/** Get Monday of the week for a given YYYY-MM-DD string, returns YYYY-MM-DD */
function getMondayISO(iso: string): string {
  const [y, m, d] = parseDateParts(iso)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  return date.toISOString().split("T")[0]
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/unauthorized")

  // Determine which week to show
  const params = await searchParams
  let mondayISO: string
  if (params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)) {
    mondayISO = getMondayISO(params.week)
  } else {
    const now = new Date()
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    mondayISO = getMondayISO(todayISO)
  }

  // Build weekStart / weekEnd as proper Date objects for Prisma query
  const [wy, wm, wd] = parseDateParts(mondayISO)
  const weekStart = new Date(wy, wm - 1, wd, 0, 0, 0, 0)
  const weekEnd = new Date(wy, wm - 1, wd + 7, 0, 0, 0, 0)

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
    const jsDay = dt.getDay()
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1
    const hour = dt.getHours()
    const startHour = hour - 8

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

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wy, wm - 1, wd + i)
    return d.getDate().toString()
  })

  const monthYear = new Date(wy, wm - 1, wd).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

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
      weekStartISO={mondayISO}
    />
  )
}
