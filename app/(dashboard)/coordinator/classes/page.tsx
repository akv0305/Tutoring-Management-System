import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorClassesClient } from "./CoordinatorClassesClient"
import { getTzAbbr } from "@/lib/timezone"

export const dynamic = "force-dynamic"

export default async function CoordinatorClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/unauthorized")

  // Default to current month
  const now = new Date()
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 4, 0, 23, 59, 59, 999)

  const classesRaw = await prisma.class.findMany({
    where: {
      student: { coordinatorId: coordinator.id },
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          grade: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      subject: { select: { name: true } },
      package: { select: { id: true, name: true } },
      bookingOrder: { select: { orderRef: true, status: true } },
    },
    orderBy: { scheduledAt: "desc" },
  })

  const classes = classesRaw.map((c) => {
    const classDuration = c.duration || 60
    const classTZ = c.timezone || "America/New_York"

    return {
      id: c.id,
      studentName: `${c.student.firstName} ${c.student.lastName}`,
      studentId: c.student.id,
      studentGrade: c.student.grade,
      parentName: c.student.parent
        ? `${c.student.parent.user.firstName} ${c.student.parent.user.lastName}`
        : "—",
      parentProfileId: c.student.parentId ?? "",
      teacherName: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      teacherId: c.teacher.id,
      subject: c.subject.name,
      packageName: c.package?.name ?? "—",
      orderRef: c.bookingOrder?.orderRef ?? "—",
      scheduledAt: c.scheduledAt.toISOString(),
      date: c.scheduledAt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: classTZ,
      }),
      time: `${c.scheduledAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: classTZ,
      })} – ${new Date(
        c.scheduledAt.getTime() + classDuration * 60000
      ).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: classTZ,
      })} ${getTzAbbr(classTZ)}`,
      duration: classDuration,
      status: c.status,
      statusLower: c.status.toLowerCase().replace(/_/g, " "),
      meetingLink: c.meetingLink ?? "",
      topicCovered: c.topicCovered ?? "",
      sessionNotes: c.sessionNotes ?? "",
      studentNotes: c.studentNotes ?? "",
      parentRating: c.parentRating,
      parentFeedback: c.parentFeedback ?? "",
      isTrial: c.isTrial,
      completedAt: c.completedAt?.toISOString() ?? null,
      cancelReason: c.cancelReason ?? "",
    }
  })

  // KPIs
  const kpis = {
    total: classes.length,
    completed: classes.filter((c) => c.status === "COMPLETED").length,
    scheduled: classes.filter((c) =>
      ["SCHEDULED", "CONFIRMED"].includes(c.status)
    ).length,
    pendingPayment: classes.filter((c) => c.status === "PENDING_PAYMENT").length,
    cancelled: classes.filter((c) => c.status.startsWith("CANCELLED")).length,
    noShow: classes.filter((c) => c.status.startsWith("NO_SHOW")).length,
  }

  // Distinct teacher list for filter dropdown
  const teacherMap = new Map<string, string>()
  classesRaw.forEach((c) => {
    teacherMap.set(
      c.teacher.id,
      `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
    )
  })
  const teachers = Array.from(teacherMap, ([id, name]) => ({ id, name })).sort(
    (a, b) => a.name.localeCompare(b.name)
  )

  // Distinct student list for filter dropdown
  const studentMap = new Map<string, string>()
  classesRaw.forEach((c) => {
    studentMap.set(
      c.student.id,
      `${c.student.firstName} ${c.student.lastName}`
    )
  })
  const students = Array.from(studentMap, ([id, name]) => ({ id, name })).sort(
    (a, b) => a.name.localeCompare(b.name)
  )

  return (
    <CoordinatorClassesClient
      classes={classes}
      kpis={kpis}
      teachers={teachers}
      students={students}
      defaultMonth={now.toISOString().slice(0, 7)}
    />
  )
}
