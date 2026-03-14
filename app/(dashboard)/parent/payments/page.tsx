import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentPaymentsClient } from "./ParentPaymentsClient"

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true, firstName: true } } },
  })
  if (!parent) redirect("/unauthorized")

  const studentIds = parent.students.map((s) => s.id)
  const childName = parent.students[0]?.firstName ?? "your child"

  // Fetch payments WITH latest refund request status
  const paymentsRaw = await prisma.payment.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      package: { select: { name: true } },
      refundRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, refundAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const methodIconMap: Record<string, string> = {
    BANK_TRANSFER: "bank",
    CREDIT_CARD: "card",
    DEBIT_CARD: "card",
    UPI: "upi",
    OTHER: "bank",
  }

  const statusMap: Record<string, string> = {
    CONFIRMED: "completed",
    PENDING: "pending",
    REFUNDED: "refunded",
    FAILED: "failed",
  }

  const payments = paymentsRaw.map((p) => {
    const latestRefund = p.refundRequests[0] ?? null
    // "none" | "pending" | "approved" | "rejected" | "processed"
    const refundStatus = latestRefund
      ? latestRefund.status.toLowerCase()
      : "none"

    return {
      id: p.id,
      txnId: `TXN-${p.id.slice(-4).toUpperCase()}`,
      description: p.package?.name ?? "Direct Payment",
      amount: `$${Number(p.amount)}`,
      amountNum: Number(p.amount),
      date: p.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      method: p.method.replace("_", " "),
      methodIcon: methodIconMap[p.method] ?? "bank",
      status: statusMap[p.status] ?? p.status.toLowerCase(),
      studentId: p.studentId,
      refundStatus,
    }
  })

  const completedTotal = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amountNum, 0)

  const pendingTotal = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amountNum, 0)

  const lastCompleted = payments.find((p) => p.status === "completed")

  const counts = {
    all: payments.length,
    completed: payments.filter((p) => p.status === "completed").length,
    pending: payments.filter((p) => p.status === "pending").length,
    refunded: payments.filter((p) => p.status === "refunded").length,
  }

  const kpis = {
    totalSpent: completedTotal,
    lastPaymentAmount: lastCompleted?.amountNum ?? 0,
    lastPaymentDate: lastCompleted?.date ?? "—",
    lastPaymentDesc: lastCompleted?.description ?? "—",
    pendingAmount: pendingTotal,
  }

  // Get coordinator info
  const student = await prisma.student.findFirst({
    where: { id: { in: studentIds } },
    include: {
      coordinator: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  })

  const coordinatorName = student?.coordinator
    ? `${student.coordinator.user.firstName} ${student.coordinator.user.lastName}`
    : "your coordinator"
  const coordinatorEmail =
    student?.coordinator?.user.email ?? "support@expertguru.net"

  return (
    <ParentPaymentsClient
      childName={childName}
      payments={payments}
      counts={counts}
      kpis={kpis}
      coordinatorName={coordinatorName}
      coordinatorEmail={coordinatorEmail}
    />
  )
}
