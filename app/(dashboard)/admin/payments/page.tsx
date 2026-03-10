"use client"

import React, { useState } from "react"
import { CheckCircle, XCircle, Eye } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Hard-coded data ─────────────────── */
type Payment = Record<string, unknown> & {
  id: string
  paymentId: string
  student: string
  packageName: string
  amount: string
  method: string
  status: string
  date: string
  confirmedBy: string
}

const PAYMENTS: Payment[] = [
  { id: "1", paymentId: "#PAY-001", student: "Alex Smith",    packageName: "8 Classes - Math",      amount: "$400.00", method: "Bank Transfer", status: "confirmed", date: "Mar 8, 2026",  confirmedBy: "Coord. Priya" },
  { id: "2", paymentId: "#PAY-002", student: "Maya Johnson",  packageName: "4 Classes - Physics",   amount: "$240.00", method: "—",             status: "pending",   date: "Mar 7, 2026",  confirmedBy: "—"           },
  { id: "3", paymentId: "#PAY-003", student: "Ryan Chen",     packageName: "6 Classes - SAT",       amount: "$342.00", method: "Stripe",         status: "confirmed", date: "Mar 7, 2026",  confirmedBy: "System"      },
  { id: "4", paymentId: "#PAY-004", student: "Priya Patel",   packageName: "8 Classes - Chemistry", amount: "$480.00", method: "Bank Transfer", status: "pending",   date: "Mar 6, 2026",  confirmedBy: "—"           },
  { id: "5", paymentId: "#PAY-005", student: "Ethan Williams",packageName: "4 Classes - English",   amount: "$192.00", method: "Stripe",         status: "confirmed", date: "Mar 5, 2026",  confirmedBy: "System"      },
  { id: "6", paymentId: "#PAY-006", student: "Sophia Lee",    packageName: "Trial - Math",          amount: "$0.00",   method: "Free Trial",     status: "confirmed", date: "Mar 8, 2026",  confirmedBy: "System"      },
  { id: "7", paymentId: "#PAY-007", student: "Aiden Brown",   packageName: "4 Classes - ACT",       amount: "$260.00", method: "Bank Transfer", status: "pending",   date: "Mar 4, 2026",  confirmedBy: "—"           },
]

/* ─────────────────── Columns ─────────────────── */
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
    render: (row: Payment) => <StatusBadge status={row.status as string} size="sm" />,
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
      const status = row.status as string
      if (status === "pending") {
        return (
          <div className="flex items-center gap-1">
            <button title="Confirm"  className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
            <button title="Reject"   className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><XCircle     className="w-3.5 h-3.5" /></button>
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
export default function PaymentsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "pending">("all")

  const filtered = activeFilter === "pending"
    ? PAYMENTS.filter((p) => p.status === "pending")
    : PAYMENTS

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
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              5
            </span>
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Collected" value="$48,350" />
        <MiniKPI label="This Month" value="$12,800" />
        <MiniKPI label="Pending Confirmation" value="$2,400" valueClass="text-[#F59E0B]" />
        <MiniKPI label="Refunded" value="$850" valueClass="text-[#EF4444]" />
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
