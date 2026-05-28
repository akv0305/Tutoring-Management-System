"use client"

import React, { useState, useMemo } from "react"
import {
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  X,
  MessageSquareText,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Payment = {
  id: string
  paymentId: string
  student: string
  packageName: string
  amount: string
  amountNum: number
  method: string
  status: string
  date: string
  confirmedBy: string | null
  bankReference: string
  adminNotes: string
  refundedAmount: number
}

type KPIs = {
  totalCollected: number
  pending: number
  pendingCount: number
  refunded: number
  total: number
}

type ActionModal = {
  paymentId: string
  action: "confirm" | "reject"
  student: string
  amount: string
} | null

function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

export function PaymentsClient({
  payments: initialPayments,
  kpis: initialKpis,
}: {
  payments: Payment[]
  kpis: KPIs
}) {
  const [payments, setPayments] = useState(initialPayments)
  const [kpis, setKpis] = useState(initialKpis)
  const [filter, setFilter] = useState<"all" | "pending">("all")
  const [processing, setProcessing] = useState(false)

  // ── Modal state ──
  const [actionModal, setActionModal] = useState<ActionModal>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [notesError, setNotesError] = useState(false)

  const filtered = useMemo(() => {
    if (filter === "pending")
      return payments.filter((p) => p.status === "pending")
    return payments
  }, [filter, payments])

  function openModal(
    paymentId: string,
    action: "confirm" | "reject",
    student: string,
    amount: string
  ) {
    setActionModal({ paymentId, action, student, amount })
    setAdminNotes("")
    setNotesError(false)
  }

  function closeModal() {
    setActionModal(null)
    setAdminNotes("")
    setNotesError(false)
  }

  async function handleSubmit() {
    if (!actionModal) return
    if (!adminNotes.trim()) {
      setNotesError(true)
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionModal.paymentId,
          action: actionModal.action,
          adminNotes: adminNotes.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const payment = payments.find((p) => p.id === actionModal.paymentId)
        setPayments((prev) =>
          prev.map((p) =>
            p.id === actionModal.paymentId
              ? {
                  ...p,
                  status:
                    actionModal.action === "confirm" ? "confirmed" : "failed",
                  adminNotes: adminNotes.trim(),
                }
              : p
          )
        )
        setKpis((prev) => ({
          ...prev,
          pendingCount: prev.pendingCount - 1,
          pending: prev.pending - (payment?.amountNum ?? 0),
          ...(actionModal.action === "confirm"
            ? {
                totalCollected:
                  prev.totalCollected + (payment?.amountNum ?? 0),
              }
            : {}),
        }))
        closeModal()
      } else {
        alert(data.error || "Failed to process payment")
      }
    } catch {
      alert("Network error")
    } finally {
      setProcessing(false)
    }
  }

  const columns = [
    {
      key: "paymentId",
      label: "Payment ID",
      render: (r: Payment) => (
        <span className="font-mono text-xs font-semibold text-[#1E3A5F]">
          {r.paymentId}
        </span>
      ),
    },
    {
      key: "student",
      label: "Student",
      sortable: true,
      render: (r: Payment) => (
        <span className="font-medium text-[#1E293B]">{r.student}</span>
      ),
    },
    {
      key: "packageName",
      label: "Package",
      render: (r: Payment) => (
        <span className="text-sm text-gray-600">{r.packageName}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (r: Payment) => (
        <span className="font-bold text-[#1E293B]">{r.amount}</span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (r: Payment) => (
        <span className="text-sm text-gray-600">{r.method}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r: Payment) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={r.status} size="sm" />
          {r.status === "refunded" &&
            r.refundedAmount > 0 &&
            r.refundedAmount < r.amountNum && (
              <span className="text-[10px] text-gray-400">
                Partial: ${r.refundedAmount.toFixed(2)} of {r.amount}
              </span>
            )}
        </div>
      ),
    },
    {
      key: "adminNotes",
      label: "Notes",
      render: (r: Payment) =>
        r.adminNotes ? (
          <span
            className="text-xs text-gray-600 max-w-[180px] truncate block cursor-help"
            title={r.adminNotes}
          >
            {r.adminNotes}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (r: Payment) => (
        <span className="text-xs text-gray-500">{r.date}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: Payment) => (
        <div className="flex items-center gap-1">
          <button
            title="View"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {r.status === "pending" && (
            <>
              <button
                title="Approve"
                onClick={() =>
                  openModal(r.id, "confirm", r.student, r.amount)
                }
                className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
              <button
                title="Reject"
                onClick={() =>
                  openModal(r.id, "reject", r.student, r.amount)
                }
                className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const isConfirm = actionModal?.action === "confirm"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Payment Management
        </h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filter === "all"
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filter === "pending"
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Pending
          {kpis.pendingCount > 0 && (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                filter === "pending"
                  ? "bg-white text-[#1E3A5F]"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {kpis.pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI
          label="Total Collected"
          value={`$${kpis.totalCollected.toLocaleString()}`}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI label="Total Payments" value={kpis.total} />
        <MiniKPI
          label="Pending Confirmation"
          value={`$${kpis.pending.toLocaleString()}`}
          valueClass="text-[#F59E0B]"
        />
        <MiniKPI
          label="Refunded"
          value={`$${kpis.refunded.toLocaleString()}`}
          valueClass="text-[#EF4444]"
        />
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search payments..."
        pageSize={10}
      />

      {/* ── Approve / Reject Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between ${
                isConfirm ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {isConfirm ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h2
                  className={`text-lg font-bold ${
                    isConfirm ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isConfirm ? "Approve Payment" : "Reject Payment"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-md hover:bg-white/60 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Student</span>
                <span className="font-semibold text-[#1E293B]">
                  {actionModal.student}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-[#1E293B]">
                  {actionModal.amount}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MessageSquareText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  Notes / Remarks{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => {
                    setAdminNotes(e.target.value)
                    if (e.target.value.trim()) setNotesError(false)
                  }}
                  placeholder={
                    isConfirm
                      ? 'e.g., "Bank ref: TXN-98765" or "Opening balance — pre-paid before go-live"'
                      : 'e.g., "Payment not received" or "Duplicate booking"'
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    notesError
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-200 focus:ring-blue-300"
                  }`}
                />
                {notesError && (
                  <p className="text-xs text-red-500 mt-1">
                    Notes are required before {isConfirm ? "approving" : "rejecting"}.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2 ${
                  isConfirm
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {isConfirm ? "Approve Payment" : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
