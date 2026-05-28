import { prisma } from "@/lib/prisma"
import { PaymentsClient } from "./PaymentsClient"

export const dynamic = "force-dynamic"

export default async function PaymentsPage() {
  const paymentsRaw = await prisma.payment.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      package: { select: { name: true } },
      confirmedBy: { select: { firstName: true, lastName: true } },
      refundRequests: {
        where: { status: { in: ["APPROVED", "PROCESSED"] } },
        select: { refundAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const payments = paymentsRaw.map((p, idx) => {
    const refundedAmount = p.refundRequests.reduce(
      (sum, r) => sum + Number(r.refundAmount),
      0
    )

    return {
      id: p.id,
      paymentId: `#PAY-${String(paymentsRaw.length - idx).padStart(3, "0")}`,
      student: `${p.student.firstName} ${p.student.lastName}`,
      packageName: p.package?.name ?? "—",
      amount: `$${Number(p.amount).toFixed(2)}`,
      amountNum: Number(p.amount),
      method: p.method.replace("_", " "),
      status: p.status.toLowerCase(),
      date: p.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      confirmedBy: p.confirmedBy
        ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
        : "—",
      bankReference: p.bankReference ?? "",
      adminNotes: p.adminNotes ?? "",
      refundedAmount,
    }
  })

  const totalRefundedFromRequests = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + p.refundedAmount, 0)

  const kpis = {
    totalCollected: payments
      .filter((p) => p.status === "confirmed")
      .reduce((s, p) => s + p.amountNum, 0),
    pending: payments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.amountNum, 0),
    pendingCount: payments.filter((p) => p.status === "pending").length,
    refunded: totalRefundedFromRequests,
    total: payments.length,
  }

  return <PaymentsClient payments={payments} kpis={kpis} />
}
