"use client"

import React, { useState } from "react"
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Info,
  Loader2,
  AlertCircle,
  Clock,
  RotateCcw,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Refund = {
  id: string
  requestId: string
  student: string
  originalPayment: string
  paymentMethod: string
  refundAmount: string
  refundNum: number
  reason: string
  requestedDate: string
  status: string
  reviewedBy: string
  reviewedAt: string | null
}

type Counts = {
  all: number
  pending: number
  approved: number
  rejected: number
  processed: number
}

type FilterTab = "all" | "pending" | "approved" | "rejected" | "processed"

export function RefundsClient({
  refunds,
  counts,
}: {
  refunds: Refund[]
  counts: Counts
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [actionModal, setActionModal] = useState<{
    refund: Refund
    action: "approve" | "reject" | "process"
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState("")

  const filteredData =
    activeTab === "all"
      ? refunds
      : refunds.filter((r) => r.status === activeTab)

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "processed", label: "Processed", count: counts.processed },
  ]

  const handleAction = async () => {
    if (!actionModal) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/refunds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionModal.refund.id,
          action: actionModal.action,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")

      // Close modal, show page-level loading, then reload
      setActionModal(null)
      setPageLoading(true)
      window.location.reload()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong"
      setError(message)
      setLoading(false)
    }
  }

  const openAction = (
    refund: Refund,
    action: "approve" | "reject" | "process"
  ) => {
    setActionModal({ refund, action })
    setError("")
    setLoading(false)
  }

  // Page-level loading overlay
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" />
        <span className="ml-3 text-gray-600 text-sm">Updating…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Refund Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage student refund requests
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: "All",
            count: counts.all,
            icon: RotateCcw,
            color: "text-[#1E3A5F]",
            bg: "bg-[#1E3A5F]/5",
            border: "border-[#1E3A5F]/10",
          },
          {
            label: "Pending",
            count: counts.pending,
            icon: Clock,
            color: "text-[#F59E0B]",
            bg: "bg-amber-50",
            border: "border-amber-200",
          },
          {
            label: "Approved",
            count: counts.approved,
            icon: CheckCircle,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
          },
          {
            label: "Rejected",
            count: counts.rejected,
            icon: XCircle,
            color: "text-[#EF4444]",
            bg: "bg-red-50",
            border: "border-red-200",
          },
          {
            label: "Processed",
            count: counts.processed,
            icon: DollarSign,
            color: "text-[#22C55E]",
            bg: "bg-green-50",
            border: "border-green-200",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`${k.bg} border ${k.border} rounded-xl p-3`}
          >
            <k.icon className={`w-4 h-4 ${k.color} mb-1`} />
            <div className={`text-xl font-bold ${k.color}`}>{k.count}</div>
            <div className="text-xs text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1 ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : tab.key === "pending"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Refunds List — scrollable container */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <RotateCcw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No refund requests found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
          {filteredData.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* Top row: info + status */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-[#1E3A5F] bg-[#1E3A5F]/5 px-2 py-0.5 rounded">
                  {r.requestId}
                </span>
                <span className="font-semibold text-[#1E293B] text-sm">
                  {r.student}
                </span>
                <StatusBadge status={r.status} size="sm" />
              </div>

              {/* Details */}
              <div className="text-sm text-gray-500 space-y-0.5 mb-3">
                <div>
                  Refund:{" "}
                  <span className="font-bold text-[#EF4444]">
                    {r.refundAmount}
                  </span>
                  <span className="mx-1.5 text-gray-300">|</span>
                  Original: {r.originalPayment}
                  <span className="mx-1.5 text-gray-300">|</span>
                  {r.paymentMethod}
                </div>
                <div>
                  Requested: {r.requestedDate}
                  {r.reviewedBy !== "—" && (
                    <span className="ml-2">
                      · Reviewed by {r.reviewedBy}
                      {r.reviewedAt && ` on ${r.reviewedAt}`}
                    </span>
                  )}
                </div>
                <div className="text-gray-600 italic text-xs mt-1">
                  &quot;{r.reason}&quot;
                </div>
              </div>

              {/* Action buttons — always visible at bottom of card */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                {r.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openAction(r, "approve")
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F]/90 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openAction(r, "reject")
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EF4444] text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}
                {r.status === "approved" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openAction(r, "process")
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Mark Processed
                  </button>
                )}
                {(r.status === "rejected" || r.status === "processed") && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    View only
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Policy info card */}
      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold text-blue-800">Refund Policy:</span>{" "}
          Cancellations credit class balance back to the student&apos;s package.
          Monetary refunds require a separate request and Admin approval. Refund
          amount may be partial based on classes already consumed.
        </p>
      </div>

      {/* Confirmation Modal */}
      {actionModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActionModal(null)
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-1">
                {actionModal.action === "approve" && "Approve Refund"}
                {actionModal.action === "reject" && "Reject Refund"}
                {actionModal.action === "process" && "Process Refund"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {actionModal.action === "approve" && (
                  <>
                    Approve <strong>{actionModal.refund.refundAmount}</strong>{" "}
                    refund for{" "}
                    <strong>{actionModal.refund.student}</strong>?
                  </>
                )}
                {actionModal.action === "reject" && (
                  <>
                    Reject the refund request from{" "}
                    <strong>{actionModal.refund.student}</strong>?
                  </>
                )}
                {actionModal.action === "process" && (
                  <>
                    Mark <strong>{actionModal.refund.refundAmount}</strong>{" "}
                    refund as processed (payment sent) for{" "}
                    <strong>{actionModal.refund.student}</strong>?
                  </>
                )}
              </p>

              {/* Refund details */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Request</span>
                  <span className="font-mono text-xs font-medium">
                    {actionModal.refund.requestId}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Original Payment</span>
                  <span className="text-gray-700">
                    {actionModal.refund.originalPayment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund Amount</span>
                  <span className="font-bold text-[#EF4444]">
                    {actionModal.refund.refundAmount}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  disabled={loading}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={loading}
                  className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer ${
                    actionModal.action === "reject"
                      ? "bg-[#EF4444] hover:bg-red-600"
                      : actionModal.action === "process"
                      ? "bg-[#22C55E] hover:bg-green-600"
                      : "bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionModal.action === "approve" && "Approve"}
                  {actionModal.action === "reject" && "Reject"}
                  {actionModal.action === "process" && "Process"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
