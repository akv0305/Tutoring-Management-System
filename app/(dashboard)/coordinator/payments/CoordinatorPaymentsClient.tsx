"use client"

import React, { useState, useMemo } from "react"
import { Info, CheckCircle, XCircle, Eye, ExternalLink, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Payment = {
  id: string
  paymentId: string
  student: string
  parentEmail: string
  package: string
  amount: string
  method: string
  proof: string | null
  date: string
  status: string
  confirmedBy: string | null
}

type Counts = {
  total: number
  pending: number
  confirmed: number
  rejected: number
}

type FilterKey = "all" | "pending" | "confirmed" | "rejected"

const FILTERS: { key: FilterKey; label: string; countKey: keyof Counts | null }[] = [
  { key: "all", label: "All", countKey: null },
  { key: "pending", label: "Pending", countKey: "pending" },
  { key: "confirmed", label: "Confirmed", countKey: "confirmed" },
  { key: "rejected", label: "Rejected", countKey: "rejected" },
]

export function CoordinatorPaymentsClient({
  payments: initialPayments,
  counts: initialCounts,
  canConfirmPayments,
}: {
  payments: Payment[]
  counts: Counts
  canConfirmPayments: boolean
}) {
  const [payments, setPayments] = useState(initialPayments)
  const [counts, setCounts] = useState(initialCounts)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("pending")
  const [search, setSearch] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchFilter = activeFilter === "all" || p.status === activeFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.student.toLowerCase().includes(q) ||
        p.paymentId.toLowerCase().includes(q) ||
        p.package.toLowerCase().includes(q) ||
        p.parentEmail.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [activeFilter, search, payments])

  async function handleAction(paymentId: string, action: "confirm" | "reject") {
    setProcessing(paymentId)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? { ...p, status: action === "confirm" ? "confirmed" : "failed" }
              : p
          )
        )
        setCounts((prev) => ({
          ...prev,
          pending: prev.pending - 1,
          ...(action === "confirm"
            ? { confirmed: prev.confirmed + 1 }
            : { rejected: prev.rejected + 1 }),
        }))
      } else {
        alert(data.error || "Failed to process payment")
      }
    } catch {
      alert("Network error")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Payment {canConfirmPayments ? "Confirmations" : "Overview"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {canConfirmPayments
            ? "Review and confirm student payment proofs"
            : "View payment status for your students"}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const badge = f.countKey ? counts[f.countKey] : null
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                activeFilter === f.key
                  ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
              {badge !== null && badge > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    activeFilter === f.key
                      ? "bg-white text-[#1E3A5F]"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          {canConfirmPayments ? (
            <>
              <span className="font-semibold">Coordinator Action Required:</span>{" "}
              You have been granted permission to confirm or reject payments.
              Verify the payment proof and take action.
            </>
          ) : (
            <>
              <span className="font-semibold">View Only:</span>{" "}
              Payment confirmations are handled by the admin. Contact admin if
              you need a payment processed urgently.
            </>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by student, ID, package…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Payment ID",
                  "Student",
                  "Parent Email",
                  "Package",
                  "Amount",
                  "Method",
                  "Proof",
                  "Date",
                  "Status",
                  ...(canConfirmPayments ? ["Actions"] : []),
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
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canConfirmPayments ? 10 : 9}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    No payments found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50/60 transition-colors ${
                    p.status === "pending" ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-[#1E3A5F]">
                      {p.paymentId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">
                    {p.student}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.parentEmail}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {p.package}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1E293B]">
                    {p.amount}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {p.method}
                  </td>
                  <td className="px-4 py-3">
                    {p.proof ? (
                      <button className="inline-flex items-center gap-1 text-xs text-[#0D9488] hover:underline">
                        <ExternalLink className="w-3 h-3" />
                        {p.proof}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {p.date}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  {canConfirmPayments && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="View Details"
                          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {p.status === "pending" && (
                          <>
                            <button
                              title="Confirm"
                              disabled={processing === p.id}
                              onClick={() => handleAction(p.id, "confirm")}
                              className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                              {processing === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              title="Reject"
                              disabled={processing === p.id}
                              onClick={() => handleAction(p.id, "reject")}
                              className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Showing {filtered.length} of {payments.length} payments
        </div>
      </div>
    </div>
  )
}
