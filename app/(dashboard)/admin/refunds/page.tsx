"use client"

import React, { useState } from "react"
import { CheckCircle, XCircle, DollarSign, Eye, Info } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Hard-coded data ─────────────────── */
type Refund = Record<string, unknown> & {
  id: string
  requestId: string
  student: string
  originalPayment: string
  refundAmount: string
  reason: string
  requestedDate: string
  status: string
  reviewedBy: string
}

const REFUNDS: Refund[] = [
  { id: "1", requestId: "#REF-001", student: "Ethan Williams", originalPayment: "#PAY-012 ($400)", refundAmount: "$200.00", reason: "Teacher unavailable for 2 weeks",     requestedDate: "Mar 5, 2026",  status: "pending",   reviewedBy: "—"           },
  { id: "2", requestId: "#REF-002", student: "Sophia Lee",     originalPayment: "#PAY-008 ($220)", refundAmount: "$220.00", reason: "Unsatisfied with trial, never started", requestedDate: "Mar 3, 2026",  status: "pending",   reviewedBy: "—"           },
  { id: "3", requestId: "#REF-003", student: "Ryan Chen",      originalPayment: "#PAY-009 ($342)", refundAmount: "$114.00", reason: "Partial refund – 2 unused classes",   requestedDate: "Feb 28, 2026", status: "approved",  reviewedBy: "Admin Rajesh" },
  { id: "4", requestId: "#REF-004", student: "Maya Johnson",   originalPayment: "#PAY-005 ($240)", refundAmount: "$240.00", reason: "Family relocation",                   requestedDate: "Feb 20, 2026", status: "processed", reviewedBy: "Admin Rajesh" },
  { id: "5", requestId: "#REF-005", student: "Aiden Brown",    originalPayment: "#PAY-011 ($260)", refundAmount: "$260.00", reason: "Duplicate payment",                   requestedDate: "Feb 15, 2026", status: "rejected",  reviewedBy: "Admin Rajesh" },
]

type FilterTab = "all" | "pending" | "approved" | "rejected"

/* ─────────────────── Columns ─────────────────── */
const columns = [
  {
    key: "requestId",
    label: "Request ID",
    render: (row: Refund) => (
      <span className="font-mono text-xs font-semibold text-[#1E3A5F]">{row.requestId}</span>
    ),
  },
  {
    key: "student",
    label: "Student",
    sortable: true,
    render: (row: Refund) => (
      <span className="font-medium text-[#1E293B]">{row.student}</span>
    ),
  },
  {
    key: "originalPayment",
    label: "Original Payment",
    render: (row: Refund) => (
      <span className="font-mono text-xs text-gray-500">{row.originalPayment}</span>
    ),
  },
  {
    key: "refundAmount",
    label: "Refund Amount",
    sortable: true,
    render: (row: Refund) => (
      <span className="font-bold text-[#EF4444]">{row.refundAmount}</span>
    ),
  },
  {
    key: "reason",
    label: "Reason",
    render: (row: Refund) => (
      <span className="text-sm text-gray-600 max-w-[200px] block truncate" title={row.reason as string}>
        {row.reason}
      </span>
    ),
  },
  {
    key: "requestedDate",
    label: "Requested Date",
    sortable: true,
    render: (row: Refund) => (
      <span className="text-xs text-gray-400">{row.requestedDate}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Refund) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "reviewedBy",
    label: "Reviewed By",
    render: (row: Refund) => (
      <span className="text-sm text-gray-500">{row.reviewedBy}</span>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (row: Refund) => {
      const status = row.status as string
      if (status === "pending") {
        return (
          <div className="flex items-center gap-1">
            <button title="Approve" className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
            <button title="Reject"  className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><XCircle     className="w-3.5 h-3.5" /></button>
          </div>
        )
      }
      if (status === "approved") {
        return (
          <button title="Process Refund" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
            <DollarSign className="w-3.5 h-3.5" />
          </button>
        )
      }
      return (
        <button title="View" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
      )
    },
  },
]

/* ─────────────────── Page ─────────────────── */
export default function RefundsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const filteredData =
    activeTab === "all"
      ? REFUNDS
      : REFUNDS.filter((r) => r.status === activeTab)

  const pendingCount = REFUNDS.filter((r) => r.status === "pending").length

  const tabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: "all",      label: "All"      },
    { key: "pending",  label: "Pending",  badge: pendingCount },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Refund Requests</h1>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#1E3A5F] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key ? "bg-white text-[#1E3A5F]" : "bg-red-500 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filteredData as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search refund requests..."
        pageSize={10}
      />

      {/* Policy info card */}
      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold text-blue-800">Refund Policy:</span>{" "}
          Cancellations credit class balance back to the student's package. Monetary refunds require a
          separate request and Admin approval. Refund amount may be partial based on classes already consumed.
        </p>
      </div>
    </div>
  )
}
