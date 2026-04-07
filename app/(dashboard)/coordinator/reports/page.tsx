import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  CoordinatorReportsClient,
  type ReportsData,
} from "./CoordinatorReportsClient"

export const dynamic = "force-dynamic"

export default async function CoordinatorReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { user: { select: { firstName: true, lastName: true } } },
  })
  if (!coordinator) redirect("/unauthorized")

  const coordinatorName = `${coordinator.user.firstName} ${coordinator.user.lastName}`

  // All students for this coordinator
  const students = await prisma.student.findMany({
    where: { coordinatorId: coordinator.id },
    include: {
      packages: {
        where: { status: "ACTIVE" },
        select: {
          classesIncluded: true,
          classesUsed: true,
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          subject: { select: { name: true } },
        },
      },
      subjects: { include: { subject: { select: { name: true } } } },
      payments: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
  })

  // ── Bucket Summary ──
  const total = students.length
  const active = students.filter((s) => s.status === "ACTIVE").length
  const trialStudents = students.filter((s) =>
    ["TRIAL_SCHEDULED", "TRIAL_COMPLETED"].includes(s.onboardingStage)
  )
  const trial = trialStudents.length
  const trialScheduled = students.filter(
    (s) => s.onboardingStage === "TRIAL_SCHEDULED"
  ).length
  const inactive = students.filter(
    (s) => s.status === "INACTIVE" || s.status === "DROPPED"
  ).length
  const converted = students.filter(
    (s) => s.onboardingStage === "CONVERTED"
  ).length
  const totalTrialEver = converted + trialStudents.length
  const conversionRate =
    totalTrialEver > 0
      ? Math.round((converted / totalTrialEver) * 100) + "%"
      : "0%"

  // ── Class Statistics (last 6 months) ──
  const now = new Date()
  const classStats = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const monthLabel = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })

    const studentIds = students.map((s) => s.id)

    const classes = await prisma.class.findMany({
      where: {
        studentId: { in: studentIds },
        scheduledAt: { gte: monthStart, lt: monthEnd },
      },
      select: { status: true },
    })

    const scheduled = classes.length
    const completed = classes.filter((c) => c.status === "COMPLETED").length
    const cancelled = classes.filter((c) =>
      ["CANCELLED_STUDENT", "CANCELLED_TEACHER"].includes(c.status)
    ).length
    const noShow = classes.filter((c) =>
      ["NO_SHOW_STUDENT", "NO_SHOW_TEACHER"].includes(c.status)
    ).length
    const rate =
      scheduled > 0
        ? ((completed / scheduled) * 100).toFixed(1) + "%"
        : "0%"

    classStats.push({ month: monthLabel, scheduled, completed, cancelled, noShow, rate })
  }

  // ── Active Students with classes remaining ──
  const activeStudents = students
    .filter((s) => s.status === "ACTIVE" && s.packages.length > 0)
    .map((s) => {
      const remaining = s.packages.reduce(
        (sum, p) => sum + (p.classesIncluded - p.classesUsed),
        0
      )
      const subjectNames = s.subjects.map((ss) => ss.subject.name).join(", ")
      const teacher = s.packages[0]?.teacher?.user
        ? `${s.packages[0].teacher.user.firstName} ${s.packages[0].teacher.user.lastName}`
        : "—"
      return {
        name: `${s.firstName} ${s.lastName}`,
        subject: subjectNames || "—",
        classesLeft: remaining,
        teacher,
      }
    })
    .sort((a, b) => a.classesLeft - b.classesLeft)
    .slice(0, 10)

  // ── Needs Attention ──
  const attentionStudents: { name: string; issue: string; color: string }[] = []

  for (const s of students) {
    const name = `${s.firstName} ${s.lastName}`

    // Pending payments
    if (s.payments.length > 0) {
      attentionStudents.push({
        name,
        issue: "Payment pending",
        color: "text-amber-600 bg-amber-50 border-amber-200",
      })
    }

    // Trial scheduled
    if (s.onboardingStage === "TRIAL_SCHEDULED") {
      attentionStudents.push({
        name,
        issue: "Trial scheduled",
        color: "text-blue-600 bg-blue-50 border-blue-200",
      })
    }

    // Trial completed but not converted
    if (s.onboardingStage === "TRIAL_COMPLETED") {
      attentionStudents.push({
        name,
        issue: "Trial completed — convert",
        color: "text-green-600 bg-green-50 border-green-200",
      })
    }

    // Package expiring (2 or fewer classes left)
    if (s.status === "ACTIVE" && s.packages.length > 0) {
      const remaining = s.packages.reduce(
        (sum, p) => sum + (p.classesIncluded - p.classesUsed),
        0
      )
      if (remaining <= 2 && remaining > 0) {
        attentionStudents.push({
          name,
          issue: "Package expiring",
          color: "text-red-600 bg-red-50 border-red-200",
        })
      }
    }

    // New lead not contacted
    if (s.onboardingStage === "NEW_LEAD") {
      attentionStudents.push({
        name,
        issue: "New lead — contact family",
        color: "text-purple-600 bg-purple-50 border-purple-200",
      })
    }
  }

  const data: ReportsData = {
    coordinatorName,
    bucket: {
      total,
      active,
      trial,
      trialScheduled,
      inactive,
      converted,
      conversionRate,
    },
    classStats,
    activeStudents,
    attentionStudents: attentionStudents.slice(0, 10),
  }

  return <CoordinatorReportsClient data={data} />
}
