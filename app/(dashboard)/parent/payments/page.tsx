import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentPaymentsClient } from "./ParentPaymentsClient"
import { getTzAbbr } from "@/lib/timezone"
import { expirePendingClasses } from "@/lib/expire-pending-classes"

// Prevent Next.js from caching this page — always fetch fresh data
export const dynamic = "force-dynamic"

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true, firstName: true } } },
  })
  if (!parent) redirect("/unauthorized")

  const parentTZ = parent.timezone || "America/New_York"

  const studentIds = parent.students.map((s) => s.id)
  const childName = parent.students[0]?.firstName ?? "your child"

  // ── AUTO-EXPIRE past pending-payment classes before fetching ──
  await expirePendingClasses({ studentIds })

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
    CCAVENUE: "card",
    PAYPAL: "card",
    WALLET: "bank",
    OTHER: "card",
  }

  const methodLabelMap: Record<string, string> = {
    BANK_TRANSFER: "Bank Transfer",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    UPI: "UPI",
    CCAVENUE: "CCAvenue",
    PAYPAL: "PayPal",
    WALLET: "Wallet",
    OTHER: "Other",
  }

  const statusMap: Record<string, string> = {
    PENDING: "pending",
    CONFIRMED: "completed",
    REFUNDED: "refunded",
    FAILED: "failed",
  }

  const now = new Date()

  // ── For each PENDING payment, determine if retry is possible ──
  // Retry is possible only if the booking order has at least one
  // class whose time window (scheduledAt + duration) is still in
  // the future.
  const pendingPaymentIds = paymentsRaw
    .filter((p) => p.status === "PENDING")
    .map((p) => p.id)

  // Fetch booking orders for pending payments
  const bookingOrders =
    pendingPaymentIds.length > 0
      ? await prisma.bookingOrder.findMany({
          where: { paymentId: { in: pendingPaymentIds } },
          include: {
            classes: {
              select: {
                scheduledAt: true,
                duration: true,
                status: true,
              },
            },
          },
        })
      : []

  const boByPaymentId = new Map(
    bookingOrders.map((bo) => [bo.paymentId, bo])
  )

  const payments = paymentsRaw.map((p) => {
    const refundReq = p.refundRequests[0]

    // Determine canRetry for pending payments
    let canRetry = false
    if (p.status === "PENDING") {
      const bo = boByPaymentId.get(p.id)
      if (bo) {
        // Has booking order — check if any class time window is still
        // in the future AND still pending payment
        canRetry = bo.classes.some((c) => {
          const classEnd = new Date(
            c.scheduledAt.getTime() + (c.duration ?? 60) * 60_000
          )
          return (
            classEnd > now &&
            ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)
          )
        })
      } else {
        // No booking order — standalone payment (admin-created)
        // Don't show Pay Now for standalone payments
        canRetry = false
      }
    }

    return {
      id: p.id,
      txnId: `TXN-${p.id.slice(-4).toUpperCase()}`,
      description: p.package?.name ?? "Direct Payment",
      amount: `$${Number(p.amount).toLocaleString()}`,
      amountNum: Number(p.amount),
      date: p.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: parentTZ,
      }),
      method: methodLabelMap[p.method] ?? p.method,
      methodIcon: methodIconMap[p.method] ?? "card",
      status: statusMap[p.status] ?? p.status.toLowerCase(),
      studentId: p.studentId,
      refundStatus: refundReq ? refundReq.status.toLowerCase() : "none",
      canRetry,
    }
  })

  const counts = {
    all: payments.length,
    completed: payments.filter((p) => p.status === "completed").length,
    pending: payments.filter((p) => p.status === "pending").length,
    refunded: payments.filter((p) => p.status === "refunded").length,
  }

  const confirmedPayments = payments.filter((p) => p.status === "completed")
  const lastConfirmed = confirmedPayments[0]

  const kpis = {
    totalSpent: confirmedPayments.reduce((s, p) => s + p.amountNum, 0),
    lastPaymentAmount: lastConfirmed?.amountNum ?? 0,
    lastPaymentDate: lastConfirmed?.date ?? "—",
    lastPaymentDesc: lastConfirmed?.description ?? "—",
    pendingAmount: payments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.amountNum, 0),
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