import { prisma } from "@/lib/prisma"
import { PaymentsClient } from "./PaymentsClient"

export default async function PaymentsPage() {
  const paymentsRaw = await prisma.payment.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      package: { select: { name: true } },
      confirmedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const payments = paymentsRaw.map((p, idx) => ({
    id: p.id,
    paymentId: `#PAY-${String(paymentsRaw.length - idx).padStart(3, "0")}`,
    student: `${p.student.firstName} ${p.student.lastName}`,
    packageName: p.package?.name ?? "—",
    amount: `$${Number(p.amount).toFixed(2)}`,
    amountNum: Number(p.amount),
    method: p.method.replace("_", " "),
    status: p.status.toLowerCase(),
    date: p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    confirmedBy: p.confirmedBy
      ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
      : "—",
  }))

  const kpis = {
    totalCollected: payments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amountNum, 0),
    pending: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amountNum, 0),
    pendingCount: payments.filter((p) => p.status === "pending").length,
    refunded: payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amountNum, 0),
    total: payments.reduce((s, p) => s + p.amountNum, 0),
  }

  return <PaymentsClient payments={payments} kpis={kpis} />
}