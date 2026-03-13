"use client"

import React, { useState } from "react"
import { CheckCircle, XCircle, DollarSign, Eye, Info } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Refund = Record<string, unknown> & {
  id: string
  requestId: string
  student: string
  originalPayment: string
  refundAmount: string
  refundNum: number
  reason: string
  requestedDate: string
  status: string
  reviewedBy: string
}

type FilterTab = "all" | "pending" | "approved" | "rejected"

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
      <span className="text-sm text-gray-600 max-w-[200px] block truncate" title={row.reason}>
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
    render: (row: Refund) => <StatusBadge status={row.status} size="sm" />,
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
      if (row.status === "pending") {
        return (
          <div className="flex items-center gap-1">
            <button title="Approve" className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
            <button title="Reject" className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
          </div>
        )
      }
      if (row.status === "approved") {
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

export function RefundsClient({ refunds }: { refunds: Refund[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const filteredData =
    activeTab === "all"
      ? refunds
      : refunds.filter((r) => r.status === activeTab)

  const pendingCount = refunds.filter((r) => r.status === "pending").length

  const tabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending", badge: pendingCount },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Refund Requests</h1>
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
              {tab.badge !== undefined && tab.badge > 0 && (
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

      {/* Empty state or table */}
      {refunds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">No refund requests yet</p>
        </div>
      ) : (
        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          data={filteredData as unknown as Record<string, unknown>[]}
          searchable
          searchPlaceholder="Search refund requests..."
          pageSize={10}
        />
      )}

      {/* Policy info card */}
      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold text-blue-800">Refund Policy:</span>{" "}
          Cancellations credit class balance back to the student&apos;s package. Monetary refunds require a
          separate request and Admin approval. Refund amount may be partial based on classes already consumed.
        </p>
      </div>
    </div>
  )
}
