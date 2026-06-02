import { prisma } from "@/lib/prisma"
import { AdminClassesClient } from "./AdminClassesClient"

export const dynamic = "force-dynamic"

export default async function AdminClassesPage() {
  // Default to current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const classesRaw = await prisma.class.findMany({
    where: {
      scheduledAt: { gte: monthStart, lte: monthEnd },
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
          compensationRate: true,
          studentFacingRate: true,
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
    const studentRate = Number(c.teacher.studentFacingRate ?? c.teacher.compensationRate)
    const compRate = Number(c.teacher.compensationRate)

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
      }),
      time: `${c.scheduledAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })} – ${new Date(
        c.scheduledAt.getTime() + classDuration * 60000
      ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      duration: classDuration,
      status: c.status,
      statusLower: c.status.toLowerCase().replace(/_/g, " "),
      meetingLink: c.meetingLink ?? "",
      topicCovered: c.topicCovered ?? "",
      sessionNotes: c.sessionNotes ?? "",
      parentRating: c.parentRating,
      parentFeedback: c.parentFeedback ?? "",
      isTrial: c.isTrial,
      completedAt: c.completedAt?.toISOString() ?? null,
      cancelReason: c.cancelReason ?? "",
      // Calculated amounts for credit modal
      calculatedCreditAmount: Math.round(studentRate * (classDuration / 60) * 100) / 100,
      calculatedDeductionAmount: Math.round(compRate * (classDuration / 60) * 100) / 100,
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
    credited: classes.filter(
      (c) => c.cancelReason.startsWith("[ADMIN CREDIT]")
    ).length,
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

  return (
    <AdminClassesClient
      classes={classes}
      kpis={kpis}
      teachers={teachers}
      defaultMonth={now.toISOString().slice(0, 7)}
    />
  )
}
