"use client"

import React, { useState, useMemo } from "react"
import { Info, CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Types ─── */
type Payment = {
  id: string
  student: string
  parentEmail: string
  package: string
  amount: string
  method: string
  proof: string | null
  date: string
  status: "pending" | "confirmed" | "rejected"
}

/* ─── Data ─── */
const PAYMENTS: Payment[] = [
  {
    id: "PAY-0091",
    student: "Maya Johnson",
    parentEmail: "robert.j@email.com",
    package: "4 Classes – Physics",
    amount: "$240.00",
    method: "Bank Transfer",
    proof: "receipt_091.pdf",
    date: "Mar 7, 2026",
    status: "pending",
  },
  {
    id: "PAY-0092",
    student: "Priya Patel",
    parentEmail: "vikram.p@email.com",
    package: "8 Classes – Chemistry",
    amount: "$480.00",
    method: "Bank Transfer",
    proof: "receipt_092.jpg",
    date: "Mar 6, 2026",
    status: "pending",
  },
  {
    id: "PAY-0093",
    student: "Aiden Brown",
    parentEmail: "maria.b@email.com",
    package: "4 Classes – ACT Prep",
    amount: "$260.00",
    method: "Zelle",
    proof: "zelle_093.png",
    date: "Mar 4, 2026",
    status: "pending",
  },
  {
    id: "PAY-0088",
    student: "Alex Smith",
    parentEmail: "jane.s@email.com",
    package: "8 Classes – Math",
    amount: "$400.00",
    method: "Bank Transfer",
    proof: null,
    date: "Mar 1, 2026",
    status: "confirmed",
  },
  {
    id: "PAY-0089",
    student: "Ryan Chen",
    parentEmail: "lisa.c@email.com",
    package: "4 Classes – Math",
    amount: "$200.00",
    method: "Venmo",
    proof: null,
    date: "Feb 28, 2026",
    status: "confirmed",
  },
]

type FilterKey = "all" | "pending" | "confirmed" | "rejected"

const FILTERS: { key: FilterKey; label: string; badge?: number }[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending", badge: 3 },
  { key: "confirmed", label: "Confirmed" },
  { key: "rejected",  label: "Rejected" },
]

/* ─── Page ─── */
export default function CoordinatorPaymentsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("pending")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return PAYMENTS.filter((p) => {
      const matchFilter = activeFilter === "all" || p.status === activeFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.student.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.package.toLowerCase().includes(q) ||
        p.parentEmail.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [activeFilter, search])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Payment Confirmations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and confirm student payment proofs</p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
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
            {f.badge !== undefined && (
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  activeFilter === f.key
                    ? "bg-white text-[#1E3A5F]"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {f.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Info Banner ── */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <span className="font-semibold">Coordinator Action Required:</span> All payments are received directly by families via bank transfer, Zelle, or Venmo. Your role is to verify the payment proof uploaded by the parent and confirm or reject it. Only confirmed payments unlock class credits for the student.
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by student, ID, package…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Payment ID", "Student", "Parent Email", "Package", "Amount", "Method", "Proof", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400 text-sm">
                    No payments found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50/60 transition-colors ${p.status === "pending" ? "bg-amber-50/30" : ""}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-[#1E3A5F]">{p.id}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">{p.student}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.parentEmail}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.package}</td>
                  <td className="px-4 py-3 font-bold text-[#1E293B]">{p.amount}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.method}</td>
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
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.date}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="View Details" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {p.status === "pending" && (
                        <>
                          <button title="Confirm" className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button title="Reject" className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Showing {filtered.length} of {PAYMENTS.length} payments
        </div>
      </div>
    </div>
  )
}
