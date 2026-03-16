import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RefundsClient } from "./RefundsClient"

// Always fetch fresh data — no server-side caching
export const dynamic = "force-dynamic"

export default async function RefundsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/unauthorized")

  const refundsRaw = await prisma.refundRequest.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      payment: {
        select: {
          id: true,
          amount: true,
          method: true,
          package: { select: { name: true } },
        },
      },
      reviewedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const refunds = refundsRaw.map((r, idx) => {
    const refundAmt = Number(r.refundAmount.toString())
    const paymentAmt = Number(r.payment.amount.toString())

    return {
      id: r.id,
      requestId: `#REF-${String(refundsRaw.length - idx).padStart(3, "0")}`,
      student: `${r.student.firstName} ${r.student.lastName}`,
      originalPayment: `$${paymentAmt.toFixed(2)}${
        r.payment.package ? ` (${r.payment.package.name})` : ""
      }`,
      paymentMethod: r.payment.method.replace("_", " "),
      refundAmount: `$${refundAmt.toFixed(2)}`,
      refundNum: refundAmt,
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
      reviewedAt: r.reviewedAt
        ? r.reviewedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null,
    }
  })

  const counts = {
    all: refunds.length,
    pending: refunds.filter((r) => r.status === "pending").length,
    approved: refunds.filter((r) => r.status === "approved").length,
    rejected: refunds.filter((r) => r.status === "rejected").length,
    processed: refunds.filter((r) => r.status === "processed").length,
  }

  return <RefundsClient refunds={refunds} counts={counts} />
}
