import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorDashboardClient } from "./CoordinatorDashboardClient"

export default async function CoordinatorPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  // Get coordinator profile
  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { user: { select: { firstName: true, lastName: true } } },
  })

  if (!coordinator) redirect("/unauthorized")

  // Fetch assigned students with all related data
  const students = await prisma.student.findMany({
    where: { coordinatorId: coordinator.id },
    include: {
      parent: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      subjects: { include: { subject: { select: { name: true } } } },
      classes: {
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          subject: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
      payments: true,
      packages: true,
    },
  })

  // Today boundaries
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Today's classes
  const todayClasses = students.flatMap((s) =>
    s.classes
      .filter((c) => c.scheduledAt >= todayStart && c.scheduledAt <= todayEnd)
      .map((c) => ({
        id: c.id,
        student: `${s.firstName} ${s.lastName}`,
        teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
        subject: c.subject.name,
        time: c.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        status: c.status.toLowerCase(),
      }))
  )

  // Upcoming classes (next 7 days, excluding today)
  const next7 = new Date()
  next7.setDate(next7.getDate() + 7)
  const upcomingCount = students.reduce(
    (sum, s) =>
      sum +
      s.classes.filter(
        (c) =>
          c.scheduledAt > todayEnd &&
          c.scheduledAt <= next7 &&
          ["SCHEDULED", "CONFIRMED"].includes(c.status)
      ).length,
    0
  )

  // Onboarding pipeline
  const newLeads = students
    .filter((s) => s.onboardingStage === "NEW_LEAD")
    .map((s) => ({
      name: `${s.firstName} ${s.lastName}`,
      grade: `Grade ${s.grade}`,
      subjects: s.subjects.map((ss) => ss.subject.name).join(", ") || "—",
      note: `Registered: ${s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    }))

  const trialScheduled = students
    .filter((s) => s.onboardingStage === "TRIAL_SCHEDULED")
    .map((s) => {
      const trial = s.classes.find((c) => c.isTrial && ["SCHEDULED", "CONFIRMED"].includes(c.status))
      return {
        name: `${s.firstName} ${s.lastName}`,
        grade: `Grade ${s.grade}`,
        subjects: s.subjects.map((ss) => ss.subject.name).join(", ") || "—",
        note: trial
          ? `Trial: ${trial.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "Trial TBD",
      }
    })

  const trialCompleted = students
    .filter((s) => s.onboardingStage === "TRIAL_COMPLETED")
    .map((s) => {
      const trial = s.classes.find((c) => c.isTrial && c.status === "COMPLETED")
      return {
        name: `${s.firstName} ${s.lastName}`,
        grade: `Grade ${s.grade}`,
        subjects: s.subjects.map((ss) => ss.subject.name).join(", ") || "—",
        note: trial ? "Trial completed ✓" : "Trial info unavailable",
        rating: trial?.parentRating ? `Rating: ${trial.parentRating}★` : undefined,
      }
    })

  // Pending payments
  const pendingPayments = students.flatMap((s) =>
    s.payments
      .filter((p) => p.status === "PENDING")
      .map((p) => {
        const pkg = s.packages.find((pk) => pk.id === p.packageId)
        return {
          student: `${s.firstName} ${s.lastName}`,
          pkg: pkg ? pkg.name : "Direct Payment",
          amount: `$${Number(p.amount)}`,
          method: p.method.replace("_", " "),
          date: p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }
      })
  )

  const pendingOnboarding = newLeads.length + trialScheduled.length + trialCompleted.length

  const data = {
    coordinatorFirstName: coordinator.user.firstName,
    totalStudents: students.length,
    upcomingCount,
    pendingOnboarding,
    pendingPayments,
    pendingPaymentTotal: pendingPayments.reduce(
      (sum, p) => sum + Number(p.amount.replace("$", "")),
      0
    ),
    todayClasses,
    newLeads,
    trialScheduled,
    trialCompleted,
  }

  return <CoordinatorDashboardClient data={data} />
}