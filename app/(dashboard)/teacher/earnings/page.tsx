import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherEarningsClient } from "./TeacherEarningsClient"

export const dynamic = "force-dynamic"

export default async function EarningsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TEACHER") redirect("/unauthorized")

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) redirect("/unauthorized")

  // Fetch all payouts
  const payoutsRaw = await prisma.payout.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  })

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const payouts = payoutsRaw.map((p) => ({
    id: p.id,
    period: `${monthNames[p.periodMonth]} ${p.periodYear}`,
    periodMonth: p.periodMonth,
    periodYear: p.periodYear,
    classes: p.classesCompleted,
    gross: Number(p.grossAmount),
    deductions: Number(p.deductions),
    net: Number(p.netAmount),
    status: p.status.toLowerCase(),
    paidDate: p.paidAt
      ? p.paidAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
  }))

  // This month's completed classes & estimated earnings
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

  const thisMonthCompleted = await prisma.class.count({
    where: {
      teacherId: teacher.id,
      status: "COMPLETED",
      completedAt: { gte: monthStart, lte: monthEnd },
    },
  })

  const rate = Number(teacher.compensationRate)
  const thisMonthEarnings = thisMonthCompleted * rate

  // Last month
  const lastMonthPayout = payouts.find(
    (p) =>
      (p.periodMonth === now.getUTCMonth() && p.periodYear === now.getUTCFullYear()) ||
      (now.getUTCMonth() === 0
        ? p.periodMonth === 12 && p.periodYear === now.getUTCFullYear() - 1
        : p.periodMonth === now.getUTCMonth() && p.periodYear === now.getUTCFullYear())
  )

  // Total earned (all paid payouts)
  const totalEarned = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.net, 0)

  // Trend data (from payouts, last 6)
  const trend = payouts
    .slice(0, 6)
    .reverse()
    .map((p) => ({
      month: monthNames[p.periodMonth].slice(0, 3),
      amount: p.net,
    }))

  // If current month not in payouts yet, add estimated
  const currentMonthInPayouts = payouts.some(
    (p) => p.periodMonth === now.getUTCMonth() + 1 && p.periodYear === now.getUTCFullYear()
  )
  if (!currentMonthInPayouts && thisMonthEarnings > 0) {
    trend.push({
      month: monthNames[now.getUTCMonth() + 1].slice(0, 3),
      amount: thisMonthEarnings,
    })
  }

  const data = {
    thisMonthEarnings,
    thisMonthClasses: thisMonthCompleted,
    lastMonthNet: lastMonthPayout?.net ?? 0,
    lastMonthClasses: lastMonthPayout?.classes ?? 0,
    totalEarned: totalEarned + thisMonthEarnings,
    nextPayoutEstimate: thisMonthEarnings,
    payouts,
    trend,
  }

  return <TeacherEarningsClient data={data} />
}
