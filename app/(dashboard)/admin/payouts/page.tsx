import { prisma } from "@/lib/prisma"
import { PayoutsClient } from "./PayoutsClient"

export default async function PayoutsPage() {
  const payoutsRaw = await prisma.payout.findMany({
    include: {
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { createdAt: "desc" }],
  })

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const payouts = payoutsRaw.map((po, idx) => ({
    id: po.id,
    payoutId: `#PO-${String(po.periodYear).slice(2)}${String(po.periodMonth).padStart(2, "0")}-${String(payoutsRaw.length - idx).padStart(3, "0")}`,
    teacher: `${po.teacher.user.firstName} ${po.teacher.user.lastName}`,
    period: `${months[po.periodMonth - 1]} ${po.periodYear}`,
    classesCompleted: po.classesCompleted,
    compRate: `$${Number(po.compensationRate)}/hr`,
    grossAmount: `$${Number(po.grossAmount).toLocaleString()}`,
    grossNum: Number(po.grossAmount),
    deductions: Number(po.deductions) === 0 ? "$0" : `$${Number(po.deductions).toLocaleString()}`,
    deductionsNum: Number(po.deductions),
    netAmount: `$${Number(po.netAmount).toLocaleString()}`,
    netNum: Number(po.netAmount),
    status: po.status.toLowerCase().replace("_", " "),
  }))

  const kpis = {
    totalPaid: payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.netNum, 0),
    pendingAmount: payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.netNum, 0),
    teachersToPay: new Set(payouts.filter((p) => p.status === "pending").map((p) => p.teacher)).size,
    avgPayout: payouts.length > 0
      ? Math.round(payouts.reduce((s, p) => s + p.netNum, 0) / payouts.length)
      : 0,
  }

  return <PayoutsClient payouts={payouts} kpis={kpis} />
}
