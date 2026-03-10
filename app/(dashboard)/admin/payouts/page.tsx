"use client"

import React from "react"
import { Calculator, Download, CheckCircle, XCircle, DollarSign, Eye, Lock } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Hard-coded data ─────────────────── */
type Payout = Record<string, unknown> & {
  id: string
  payoutId: string
  teacher: string
  period: string
  classesCompleted: number
  compRate: string
  grossAmount: string
  deductions: string
  netAmount: string
  status: string
}

const PAYOUTS: Payout[] = [
  { id: "1", payoutId: "#PO-2603-001", teacher: "Dr. Ananya Sharma",  period: "Mar 2026", classesCompleted: 32, compRate: "$35/hr", grossAmount: "$1,120", deductions: "$0",              netAmount: "$1,120", status: "pending"  },
  { id: "2", payoutId: "#PO-2603-002", teacher: "Prof. Vikram Rao",   period: "Mar 2026", classesCompleted: 28, compRate: "$40/hr", grossAmount: "$1,120", deductions: "$40 (1 no-show)", netAmount: "$1,080", status: "pending"  },
  { id: "3", payoutId: "#PO-2603-003", teacher: "Ms. Deepika Nair",   period: "Mar 2026", classesCompleted: 24, compRate: "$30/hr", grossAmount: "$720",   deductions: "$0",              netAmount: "$720",   status: "approved" },
  { id: "4", payoutId: "#PO-2603-004", teacher: "Mr. Suresh Iyer",    period: "Mar 2026", classesCompleted: 20, compRate: "$38/hr", grossAmount: "$760",   deductions: "$0",              netAmount: "$760",   status: "paid"     },
  { id: "5", payoutId: "#PO-2602-005", teacher: "Dr. Ananya Sharma",  period: "Feb 2026", classesCompleted: 30, compRate: "$35/hr", grossAmount: "$1,050", deductions: "$0",              netAmount: "$1,050", status: "paid"     },
]

/* ─────────────────── Columns ─────────────────── */
const columns = [
  {
    key: "payoutId",
    label: "Payout ID",
    render: (row: Payout) => (
      <span className="font-mono text-xs font-semibold text-[#1E3A5F]">{row.payoutId}</span>
    ),
  },
  {
    key: "teacher",
    label: "Teacher",
    sortable: true,
    render: (row: Payout) => (
      <span className="font-medium text-[#1E293B]">{row.teacher}</span>
    ),
  },
  {
    key: "period",
    label: "Period",
    sortable: true,
    render: (row: Payout) => (
      <span className="text-sm text-gray-600">{row.period}</span>
    ),
  },
  {
    key: "classesCompleted",
    label: "Classes",
    sortable: true,
    render: (row: Payout) => (
      <span className="font-semibold text-[#1E293B]">{row.classesCompleted}</span>
    ),
  },
  {
    key: "compRate",
    label: "Comp. Rate 🔒",
    render: (row: Payout) => (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <Lock className="w-3 h-3" />
        {row.compRate}
      </span>
    ),
  },
  {
    key: "grossAmount",
    label: "Gross",
    render: (row: Payout) => (
      <span className="text-sm text-gray-600">{row.grossAmount}</span>
    ),
  },
  {
    key: "deductions",
    label: "Deductions",
    render: (row: Payout) => {
      const d = row.deductions as string
      return (
        <span className={`text-sm ${d === "$0" ? "text-gray-400" : "text-[#EF4444] font-medium"}`}>
          {d}
        </span>
      )
    },
  },
  {
    key: "netAmount",
    label: "Net Amount",
    sortable: true,
    render: (row: Payout) => (
      <span className="font-bold text-[#1E3A5F]">{row.netAmount}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Payout) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (row: Payout) => {
      const status = row.status as string
      if (status === "pending") {
        return (
          <div className="flex items-center gap-1">
            <button title="Approve" className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
            <button title="On Hold" className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><XCircle     className="w-3.5 h-3.5" /></button>
          </div>
        )
      }
      if (status === "approved") {
        return (
          <button title="Mark Paid" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
            <DollarSign className="w-3.5 h-3.5" />
          </button>
        )
      }
      return (
        <button title="View Details" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
      )
    },
  },
]

/* ─────────────────── Mini KPI ─────────────────── */
function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─────────────────── Page ─────────────────── */
export default function PayoutsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Payouts</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <Calculator className="w-4 h-4" />
            Generate Monthly Payout
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Paid (All Time)" value="$86,200" />
        <MiniKPI label="This Month Pending" value="$12,450" valueClass="text-[#F59E0B]" />
        <MiniKPI label="Teachers to Pay" value="18" valueClass="text-[#1E3A5F]" />
        <MiniKPI label="Avg Payout/Teacher" value="$691" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={PAYOUTS as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search payouts..."
        pageSize={10}
      />

      {/* Confidentiality note */}
      <div className="flex items-start gap-3 px-5 py-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">Comp. Rate column is confidential.</span>{" "}
          Only Admin can view this page. Teacher dashboard shows only the total payout amount — not the hourly rate.
        </p>
      </div>
    </div>
  )
}
