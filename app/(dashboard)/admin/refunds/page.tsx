import { prisma } from "@/lib/prisma"
import { RefundsClient } from "./RefundsClient"

export default async function RefundsPage() {
  const refundsRaw = await prisma.refundRequest.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      payment: {
        select: {
          id: true,
          amount: true,
          package: { select: { name: true } },
        },
      },
      reviewedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const refunds = refundsRaw.map((r, idx) => ({
    id: r.id,
    requestId: `#REF-${String(refundsRaw.length - idx).padStart(3, "0")}`,
    student: `${r.student.firstName} ${r.student.lastName}`,
    originalPayment: `$${Number(r.payment.amount).toFixed(2)}${r.payment.package ? ` (${r.payment.package.name})` : ""}`,
    refundAmount: `$${Number(r.refundAmount).toFixed(2)}`,
    refundNum: Number(r.refundAmount),
    reason: r.reason,
    requestedDate: r.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: r.status.toLowerCase(),
    reviewedBy: r.reviewedBy
      ? `${r.reviewedBy.firstName} ${r.reviewedBy.lastName}`
      : "—",
  }))

  return <RefundsClient refunds={refunds} />
}
