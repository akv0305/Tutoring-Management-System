import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReportsClient, type ReportsData } from "./ReportsClient"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/unauthorized")

  const now = new Date()
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const periodLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`

  // ── Section A: Financial Overview ──
  const [confirmedSum, paidPayoutsSum, pendingPaymentsSum, processedRefundsSum] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "CONFIRMED" } }),
    prisma.payout.aggregate({ _sum: { netAmount: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    prisma.refundRequest.aggregate({ _sum: { refundAmount: true }, where: { status: "PROCESSED" } }),
  ])
  const totalCollected = Number(confirmedSum._sum.amount ?? 0)
  const teacherPayouts = Number(paidPayoutsSum._sum.netAmount ?? 0)
  const pendingPayments = Number(pendingPaymentsSum._sum.amount ?? 0)
  const refundsIssued = Number(processedRefundsSum._sum.refundAmount ?? 0)

  // ── Section B-Left: Student Status ──
  const [totalStudents, activeStudents, inactiveStudents, trialPendingStudents] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.student.count({ where: { status: "INACTIVE" } }),
    prisma.student.count({ where: { status: "TRIAL_PENDING" } }),
  ])

  // ── Section B-Right: Monthly Enrollment (last 6 months) ──
  const enrollment: { month: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = await prisma.student.count({
      where: { createdAt: { gte: start, lt: end } },
    })
    enrollment.push({
      month: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      value: count,
    })
  }

  // ── Section C: Teacher Performance (top 10 by classes) ──
  const teachersRaw = await prisma.teacherProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true } },
      subjects: { include: { subject: { select: { name: true } } }, take: 1 },
      _count: { select: { classes: true } },
      classes: {
        where: { status: { in: ["NO_SHOW_TEACHER", "CANCELLED_TEACHER"] } },
        select: { status: true },
      },
    },
    orderBy: { rating: "desc" },
  })

  const teacherPerf = teachersRaw
    .map((t) => ({
      name: `${t.user.firstName} ${t.user.lastName}`,
      subject: t.subjects[0]?.subject.name ?? "—",
      classes: t._count.classes,
      rating: Number(t.rating),
      noShows: t.classes.filter((c) => c.status === "NO_SHOW_TEACHER").length,
      status: t.status.toLowerCase().replace("_", " "),
    }))
    .sort((a, b) => b.classes - a.classes)
    .slice(0, 10)
    .map((t, i) => ({
      rank: `#${i + 1}`,
      name: t.name,
      subject: t.subject,
      classes: t.classes,
      rating: `${t.rating.toFixed(1)} ★`,
      noShows: t.noShows,
      feedback: t.rating >= 4.8 ? "Excellent" : t.rating >= 4.5 ? "Very Good" : t.rating >= 4.0 ? "Good" : "Average",
      status: t.status,
    }))

  // ── Section D-Left: Classes by Subject ──
  const subjectClassesRaw = await prisma.class.groupBy({
    by: ["subjectId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  })
  const subjectIds = subjectClassesRaw.map((s) => s.subjectId)
  const subjectsMap = new Map(
    (await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } }))
      .map((s) => [s.id, s.name])
  )
  const maxSubjectCount = subjectClassesRaw[0]?._count.id ?? 1
  const COLORS = ["#0D9488", "#0D9488", "#1E3A5F", "#1E3A5F", "#F59E0B", "#F59E0B", "#9CA3AF", "#9CA3AF"]
  const subjectClasses = subjectClassesRaw.slice(0, 8).map((s, i) => ({
    subject: subjectsMap.get(s.subjectId) ?? "Unknown",
    count: s._count.id,
    pct: Math.round((s._count.id / maxSubjectCount) * 100),
    color: COLORS[i] ?? "#9CA3AF",
  }))

  // ── Section D-Right: Completion Rate ──
  const totalClasses = await prisma.class.count()
  const [completed, cancelledStudent, noShowTeacher, cancelledTeacher] = await Promise.all([
    prisma.class.count({ where: { status: "COMPLETED" } }),
    prisma.class.count({ where: { status: "CANCELLED_STUDENT" } }),
    prisma.class.count({ where: { status: "NO_SHOW_TEACHER" } }),
    prisma.class.count({ where: { status: "CANCELLED_TEACHER" } }),
  ])
  const pct = (n: number) => totalClasses > 0 ? ((n / totalClasses) * 100).toFixed(1) + "%" : "0%"
  const completion = [
    { pct: pct(completed), label: "Completed", sub: `${completed.toLocaleString()} of ${totalClasses.toLocaleString()}`, color: "#0D9488" },
    { pct: pct(cancelledStudent), label: "Cancelled (Student)", sub: cancelledStudent.toLocaleString(), color: "#F59E0B" },
    { pct: pct(noShowTeacher), label: "No-Show (Teacher)", sub: noShowTeacher.toLocaleString(), color: "#EF4444" },
    { pct: pct(cancelledTeacher), label: "Cancelled (Teacher)", sub: cancelledTeacher.toLocaleString(), color: "#9CA3AF" },
  ]

  // ── Section E: Coordinator Workload ──
  const coordsRaw = await prisma.coordinatorProfile.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { firstName: true, lastName: true } },
      students: {
        select: {
          id: true,
          status: true,
          classes: { select: { status: true, isTrial: true } },
          onboardingStage: true,
        },
      },
    },
  })

  const coordinators = coordsRaw.map((c) => {
    const activeStuds = c.students.filter((s) => s.status === "ACTIVE").length
    const scheduled = c.students.reduce((sum, s) => sum + s.classes.filter((cl) => ["SCHEDULED", "CONFIRMED"].includes(cl.status)).length, 0)
    const trialStudents = c.students.filter((s) => s.classes.some((cl) => cl.isTrial))
    const converted = trialStudents.filter((s) => s.onboardingStage === "CONVERTED").length
    const convRate = trialStudents.length > 0 ? Math.round((converted / trialStudents.length) * 100) : 0
    return {
      name: `${c.user.firstName} ${c.user.lastName}`,
      bucket: c.bucketSize,
      active: activeStuds,
      scheduled,
      converted,
      rate: `${convRate}%`,
    }
  })

  const totalActiveCoord = coordinators.reduce((s, c) => s + c.active, 0)
  const totalScheduledCoord = coordinators.reduce((s, c) => s + c.scheduled, 0)
  const totalConvertedCoord = coordinators.reduce((s, c) => s + c.converted, 0)
  const totalTrials = coordsRaw.reduce((s, c) => s + c.students.filter((st) => st.classes.some((cl) => cl.isTrial)).length, 0)
  const avgConvRate = totalTrials > 0 ? Math.round((totalConvertedCoord / totalTrials) * 100) : 0

  // ── Assemble data ──
  const data: ReportsData = {
    financial: {
      totalCollected,
      teacherPayouts,
      pendingPayments,
      refundsIssued,
      netRevenue: totalCollected - teacherPayouts - refundsIssued,
    },
    students: {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      trialPending: trialPendingStudents,
    },
    enrollment,
    teacherPerf,
    subjectClasses,
    completion,
    totalClasses,
    coordinators,
    coordTotals: {
      active: totalActiveCoord,
      scheduled: totalScheduledCoord,
      converted: totalConvertedCoord,
      avgRate: `${avgConvRate}% avg`,
    },
    periodLabel,
  }

  return <ReportsClient data={data} />
}
