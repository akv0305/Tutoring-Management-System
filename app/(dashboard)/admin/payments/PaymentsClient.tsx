"use client"

import React, { useState } from "react"
import { CheckCircle, XCircle, Eye } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Payment = Record<string, unknown> & {
  id: string
  paymentId: string
  student: string
  packageName: string
  amount: string
  amountNum: number
  method: string
  status: string
  date: string
  confirmedBy: string
}

type KPIs = {
  totalCollected: number
  pending: number
  pendingCount: number
  refunded: number
  total: number
}

const columns = [
  {
    key: "paymentId",
    label: "Payment ID",
    render: (row: Payment) => (
      <span className="font-mono text-xs font-semibold text-[#1E3A5F]">{row.paymentId}</span>
    ),
  },
  {
    key: "student",
    label: "Student",
    sortable: true,
    render: (row: Payment) => (
      <span className="font-medium text-[#1E293B]">{row.student}</span>
    ),
  },
  {
    key: "packageName",
    label: "Package",
    render: (row: Payment) => (
      <span className="text-sm text-gray-600">{row.packageName}</span>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
    render: (row: Payment) => (
      <span className="font-bold text-[#1E293B]">{row.amount}</span>
    ),
  },
  {
    key: "method",
    label: "Method",
    render: (row: Payment) => (
      <span className="text-sm text-gray-500">{row.method}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Payment) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (row: Payment) => (
      <span className="text-xs text-gray-400">{row.date}</span>
    ),
  },
  {
    key: "confirmedBy",
    label: "Confirmed By",
    render: (row: Payment) => (
      <span className="text-sm text-gray-500">{row.confirmedBy}</span>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (row: Payment) => {
      if (row.status === "pending") {
        return (
          <div className="flex items-center gap-1">
            <button title="Confirm" className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
            <button title="Reject" className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
          </div>
        )
      }
      return (
        <button title="View Receipt" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
      )
    },
  },
]

function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

export function PaymentsClient({ payments, kpis }: { payments: Payment[]; kpis: KPIs }) {
  const [activeFilter, setActiveFilter] = useState<"all" | "pending">("all")

  const filtered = activeFilter === "pending"
    ? payments.filter((p) => p.status === "pending")
    : payments

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Payment Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("pending")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "pending"
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pending
            {kpis.pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {kpis.pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Collected" value={`$${kpis.totalCollected.toLocaleString()}`} />
        <MiniKPI label="Total Payments" value={`$${kpis.total.toLocaleString()}`} />
        <MiniKPI label="Pending Confirmation" value={`$${kpis.pending.toLocaleString()}`} valueClass="text-[#F59E0B]" />
        <MiniKPI label="Refunded" value={`$${kpis.refunded.toLocaleString()}`} valueClass="text-[#EF4444]" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search payments..."
        pageSize={10}
      />
    </div>
  )
}