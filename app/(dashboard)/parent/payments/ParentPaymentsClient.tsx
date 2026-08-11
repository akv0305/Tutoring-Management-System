"use client"

import React, { useState, useMemo } from "react"
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  RotateCcw,
  Download,
  Info,
  Banknote,
  Smartphone,
  XCircle,
  Loader2,
  X,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RefundRequestModal } from "@/components/modals/RefundRequestModal"

type Payment = {
  id: string
  txnId: string
  description: string
  amount: string
  amountNum: number
  date: string
  method: string
  methodIcon: string
  status: string
  studentId: string
  refundStatus: string
  canRetry: boolean // ← NEW
}

type Counts = {
  all: number
  completed: number
  pending: number
  refunded: number
}

type KPIs = {
  totalSpent: number
  lastPaymentAmount: number
  lastPaymentDate: string
  lastPaymentDesc: string
  pendingAmount: number
}

type FilterTab = "all" | "completed" | "pending" | "refunded"

const METHOD_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-4 h-4 text-[#1E3A5F]" />,
  bank: <Banknote className="w-4 h-4 text-[#0D9488]" />,
  upi: <Smartphone className="w-4 h-4 text-[#F59E0B]" />,
}

/* ═══════════════════════════════════════════════════════════
   GATEWAY LABELS & ICONS
   ═══════════════════════════════════════════════════════════ */
const GATEWAY_META: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  CCAVENUE: {
    label: "Credit / Debit Card",
    description: "Pay via CCAvenue (cards, net banking, UPI)",
    icon: <CreditCard className="w-5 h-5 text-[#1E3A5F]" />,
  },
  PAYPAL: {
    label: "PayPal",
    description: "Pay with your PayPal account or card",
    icon: <DollarSign className="w-5 h-5 text-[#003087]" />,
  },
}

/* ═══════════════════════════════════════════════════════════
   REFUND ACTION CELL  (unchanged from original)
   ═══════════════════════════════════════════════════════════ */
function RefundActionCell({
  payment,
  onRequestRefund,
}: {
  payment: Payment
  onRequestRefund: (p: Payment) => void
}) {
  if (payment.status === "refunded") {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 border border-green-200 text-[#22C55E] rounded-lg text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Refunded
      </span>
    )
  }

  if (payment.status !== "completed") {
    if (payment.status === "pending") {
      return (
        <span className="text-xs text-gray-400 italic">
          Awaiting confirmation
        </span>
      )
    }
    return null
  }

  switch (payment.refundStatus) {
    case "pending":
      return (
        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          Refund Pending
        </span>
      )
    case "approved":
      return (
        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Refund Approved
        </span>
      )
    case "rejected":
      return (
        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-400 rounded-lg text-xs font-medium">
          <XCircle className="w-3.5 h-3.5" />
          Refund Rejected
        </span>
      )
    case "processed":
      return (
        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 border border-green-200 text-[#22C55E] rounded-lg text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Refund Processed
        </span>
      )
    case "none":
      return (
        <button
          type="button"
          onClick={() => onRequestRefund(payment)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-[#EF4444] rounded-lg text-xs font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Request Refund
        </button>
      )
    default:
      return (
        <span className="text-xs text-gray-400 italic">
          Refund: {payment.refundStatus}
        </span>
      )
  }
}

/* ═══════════════════════════════════════════════════════════
   GATEWAY SELECTION MODAL
   ═══════════════════════════════════════════════════════════ */
function GatewayModal({
  gateways,
  defaultGateway,
  onSelect,
  onClose,
  processing,
}: {
  gateways: string[]
  defaultGateway: string
  onSelect: (gw: string) => void
  onClose: () => void
  processing: string | null
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1E293B]">
            Select Payment Method
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={!!processing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {gateways.map((gw) => {
            const meta = GATEWAY_META[gw] || {
              label: gw,
              description: "",
              icon: <CreditCard className="w-5 h-5 text-gray-500" />,
            }
            const isProcessing = processing === gw
            return (
              <button
                key={gw}
                type="button"
                disabled={!!processing}
                onClick={() => onSelect(gw)}
                className={`w-full flex items-center gap-3 p-4 border rounded-xl transition
                  ${processing ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"}
                  ${gw === defaultGateway ? "border-[#0D9488] bg-teal-50/50" : "border-gray-200"}`}
              >
                <div className="flex-shrink-0">
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 text-[#0D9488] animate-spin" />
                  ) : (
                    meta.icon
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-[#1E293B] text-sm">
                    {meta.label}
                  </span>
                  {meta.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {meta.description}
                    </p>
                  )}
                </div>
                {gw === defaultGateway && !isProcessing && (
                  <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={!!processing}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function ParentPaymentsClient({
  childName,
  payments,
  counts,
  kpis,
  coordinatorName,
  coordinatorEmail,
}: {
  childName: string
  payments: Payment[]
  counts: Counts
  kpis: KPIs
  coordinatorName: string
  coordinatorEmail: string
}) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null)

  // ── Gateway selection state ──
  const [gatewayPaymentId, setGatewayPaymentId] = useState<string | null>(null)
  const [gateways, setGateways] = useState<string[]>([])
  const [defaultGateway, setDefaultGateway] = useState("")
  const [gatewayProcessing, setGatewayProcessing] = useState<string | null>(null)
  const [payButtonLoading, setPayButtonLoading] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      payments.filter((p) =>
        activeFilter === "all" ? true : p.status === activeFilter
      ),
    [activeFilter, payments]
  )

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "refunded", label: "Refunded", count: counts.refunded },
  ]

  /* ── Proceed with the chosen gateway ── */
  function proceedWithGateway(paymentId: string, gateway: string) {
    setGatewayProcessing(gateway)

    if (gateway === "CCAVENUE") {
      // Submit a hidden form to CCAvenue redirect (existing flow)
      const form = document.createElement("form")
      form.method = "POST"
      form.action = "/api/payments/ccavenue/redirect"
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "paymentId"
      input.value = paymentId
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    } else if (gateway === "PAYPAL") {
      // Call PayPal create-order API, then redirect to approval URL
      fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.approvalUrl) {
            window.location.href = data.approvalUrl
          } else {
            alert(data.error || "Failed to initiate PayPal payment")
            setGatewayProcessing(null)
            setGatewayPaymentId(null)
            setPayButtonLoading(null)
          }
        })
        .catch(() => {
          alert("Failed to initiate PayPal payment. Please try again.")
          setGatewayProcessing(null)
          setGatewayPaymentId(null)
          setPayButtonLoading(null)
        })
    }
  }

  /* ── Handle Pay Now click: fetch gateways then decide ── */
  async function handlePayNow(paymentId: string) {
    setPayButtonLoading(paymentId)
    try {
      const res = await fetch("/api/payments/gateways")
      const data = await res.json()
      const enabledGateways: string[] = data.gateways || []
      const defaultGw: string = data.default || "CCAVENUE"

      if (enabledGateways.length === 0) {
        alert("No payment gateways are currently enabled. Please contact support.")
        setPayButtonLoading(null)
        return
      }

      // If only one gateway, auto-proceed
      if (enabledGateways.length === 1) {
        proceedWithGateway(paymentId, enabledGateways[0])
        return
      }

      // Multiple gateways — show modal
      setGateways(enabledGateways)
      setDefaultGateway(defaultGw)
      setGatewayPaymentId(paymentId)
      setPayButtonLoading(null)
    } catch {
      alert("Failed to load payment methods. Please try again.")
      setPayButtonLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Payment History</h1>
        <p className="text-sm text-gray-500 mt-1">
          All transactions for {childName}&apos;s learning account
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Spent"
          value={`$${kpis.totalSpent.toLocaleString()}`}
          subtitle="All time payments"
          change=""
          changeType="neutral"
          icon={DollarSign}
        />
        <KPICard
          title="Last Payment"
          value={`$${kpis.lastPaymentAmount.toLocaleString()}`}
          subtitle={kpis.lastPaymentDate}
          change={kpis.lastPaymentDesc}
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Pending Amount"
          value={`$${kpis.pendingAmount.toLocaleString()}`}
          subtitle={
            kpis.pendingAmount === 0
              ? "No pending payments"
              : "Awaiting confirmation"
          }
          change={kpis.pendingAmount === 0 ? "All clear" : ""}
          changeType={kpis.pendingAmount === 0 ? "positive" : "negative"}
          icon={Clock}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 w-fit">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveFilter(t.key)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeFilter === t.key
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {t.label}
            <span
              className={[
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                activeFilter === t.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">
              Transactions
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Transaction ID",
                  "Package / Description",
                  "Amount",
                  "Date",
                  "Method",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    No payments found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-medium text-[#1E3A5F] bg-[#1E3A5F]/5 px-2 py-1 rounded">
                        {p.txnId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1E293B] font-medium">
                      {p.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#1E293B]">
                      {p.amount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {p.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {METHOD_ICONS[p.methodIcon]}
                        <span className="text-sm text-gray-600">
                          {p.method}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {/* ── PAY NOW (only if retry is possible) ── */}
                        {p.status === "pending" && p.canRetry && (
                          <button
                            type="button"
                            disabled={payButtonLoading === p.id}
                            onClick={() => handlePayNow(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-semibold hover:bg-[#0B7C72] transition-colors disabled:opacity-60"
                          >
                            {payButtonLoading === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            Pay Now
                          </button>
                        )}
                        {/* ── EXPIRED badge for pending payments that can't be retried ── */}
                        {p.status === "pending" && !p.canRetry && (
                          <span className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            Expired
                          </span>
                        )}

                        {p.status === "completed" && (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/api/payments/${p.id}/invoice`,
                                "_blank"
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Invoice
                          </button>
                        )}
                        <RefundActionCell
                          payment={p}
                          onRequestRefund={setRefundPayment}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Need help with a payment?
          </p>
          <p className="text-sm text-blue-600 mt-0.5">
            Contact your coordinator{" "}
            <span className="font-semibold">{coordinatorName}</span> at{" "}
            <a
              href={`mailto:${coordinatorEmail}`}
              className="underline hover:no-underline"
            >
              {coordinatorEmail}
            </a>
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">
          Payment Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Completed",
              count: counts.completed,
              icon: CheckCircle,
              color: "text-[#22C55E]",
              bg: "bg-green-50",
            },
            {
              label: "Pending",
              count: counts.pending,
              icon: Clock,
              color: "text-[#F59E0B]",
              bg: "bg-amber-50",
            },
            {
              label: "Refunded",
              count: counts.refunded,
              icon: RotateCcw,
              color: "text-[#EF4444]",
              bg: "bg-red-50",
            },
            {
              label: "Total Txns",
              count: counts.all,
              icon: CreditCard,
              color: "text-[#1E3A5F]",
              bg: "bg-[#1E3A5F]/5",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-3 p-3 ${s.bg} rounded-xl`}
            >
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gateway Selection Modal ── */}
      {gatewayPaymentId && (
        <GatewayModal
          gateways={gateways}
          defaultGateway={defaultGateway}
          processing={gatewayProcessing}
          onSelect={(gw) => proceedWithGateway(gatewayPaymentId, gw)}
          onClose={() => {
            if (!gatewayProcessing) {
              setGatewayPaymentId(null)
              setGateways([])
            }
          }}
        />
      )}

      {/* ── Refund Modal ── */}
      {refundPayment && (
        <RefundRequestModal
          open={true}
          onClose={() => setRefundPayment(null)}
          onSuccess={() => {
            setRefundPayment(null)
            window.location.reload()
          }}
          paymentId={refundPayment.id}
          studentId={refundPayment.studentId}
          paymentAmount={refundPayment.amountNum}
          packageName={refundPayment.description}
          paymentDate={refundPayment.date}
        />
      )}
    </div>
  )
}
