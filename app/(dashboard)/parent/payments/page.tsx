"use client"

import React, { useState } from "react"
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
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { DataTable } from "@/components/tables/DataTable"

/* ─── Types ─── */
type Payment = {
  id: string
  txnId: string
  description: string
  amount: string
  date: string
  method: string
  methodIcon: string
  status: string
}

/* ─── Data ─── */
const ALL_PAYMENTS: Payment[] = [
  {
    id: "1",
    txnId: "TXN-001",
    description: "8-Class Mathematics Pack",
    amount: "$240",
    date: "Mar 5, 2026",
    method: "Credit Card",
    methodIcon: "card",
    status: "completed",
  },
  {
    id: "2",
    txnId: "TXN-002",
    description: "4-Class SAT Prep Pack",
    amount: "$120",
    date: "Feb 20, 2026",
    method: "Bank Transfer",
    methodIcon: "bank",
    status: "completed",
  },
  {
    id: "3",
    txnId: "TXN-003",
    description: "4-Class Physics Pack",
    amount: "$120",
    date: "Feb 1, 2026",
    method: "UPI",
    methodIcon: "upi",
    status: "completed",
  },
  {
    id: "4",
    txnId: "TXN-004",
    description: "8-Class Mathematics Pack (Renewal)",
    amount: "$240",
    date: "Mar 10, 2026",
    method: "Credit Card",
    methodIcon: "card",
    status: "pending",
  },
  {
    id: "5",
    txnId: "TXN-005",
    description: "4-Class Physics Pack (Duplicate)",
    amount: "$120",
    date: "Jan 15, 2026",
    method: "UPI",
    methodIcon: "upi",
    status: "refunded",
  },
]

const METHOD_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-4 h-4 text-[#1E3A5F]" />,
  bank: <Banknote className="w-4 h-4 text-[#0D9488]" />,
  upi: <Smartphone className="w-4 h-4 text-[#F59E0B]" />,
}

type FilterTab = "all" | "completed" | "pending" | "refunded"

const FILTER_TABS: { key: FilterTab; label: string; count?: number }[] = [
  { key: "all", label: "All", count: 5 },
  { key: "completed", label: "Completed", count: 3 },
  { key: "pending", label: "Pending", count: 1 },
  { key: "refunded", label: "Refunded", count: 1 },
]

export default function PaymentsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")

  const filtered = ALL_PAYMENTS.filter((p) =>
    activeFilter === "all" ? true : p.status === activeFilter
  )

  type PaymentRow = {
    id: string
    txnId: string
    description: string
    amount: string
    date: string
    method: string
    methodIcon: string
    status: string
    [key: string]: unknown
  }

  const columns = [
    {
      key: "txnId",
      label: "Transaction ID",
      render: (row: PaymentRow) => (
        <span className="text-xs font-mono font-medium text-[#1E3A5F] bg-[#1E3A5F]/5 px-2 py-1 rounded">
          {row.txnId}
        </span>
      ),
    },
    {
      key: "description",
      label: "Package / Description",
      render: (row: PaymentRow) => (
        <span className="text-sm text-[#1E293B] font-medium">{row.description}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row: PaymentRow) => (
        <span className="text-sm font-bold text-[#1E293B]">{row.amount}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (row: PaymentRow) => (
        <span className="text-sm text-gray-500">{row.date}</span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (row: PaymentRow) => (
        <div className="flex items-center gap-1.5">
          {METHOD_ICONS[row.methodIcon as string]}
          <span className="text-sm text-gray-600">{row.method}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: PaymentRow) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: PaymentRow) => (
        row.status === "completed" ? (
          <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Invoice
          </button>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Payment History</h1>
        <p className="text-sm text-gray-500 mt-1">All transactions for Alex&apos;s learning account</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Spent"
          value="$660"
          subtitle="All time payments"
          change="Since Jan 2026"
          changeType="neutral"
          icon={DollarSign}
        />
        <KPICard
          title="Last Payment"
          value="$240"
          subtitle="Mar 5, 2026"
          change="8-Class Math Pack"
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Pending Amount"
          value="$0"
          subtitle="No pending payments"
          change="All clear"
          changeType="positive"
          icon={Clock}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 w-fit">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveFilter(t.key)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeFilter === t.key
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={[
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                  activeFilter === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">Transactions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <DataTable<PaymentRow>
          columns={columns}
          data={filtered as PaymentRow[]}
          searchable={false}
          pageSize={10}
        />
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Need help with a payment?</p>
          <p className="text-sm text-blue-600 mt-0.5">
            Contact your coordinator <span className="font-semibold">Priya Menon</span> at{" "}
            <a href="mailto:priya@expertguru.net" className="underline hover:no-underline">
              priya@expertguru.net
            </a>
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">Payment Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Completed", count: 3, icon: CheckCircle, color: "text-[#22C55E]", bg: "bg-green-50" },
            { label: "Pending", count: 1, icon: Clock, color: "text-[#F59E0B]", bg: "bg-amber-50" },
            { label: "Refunded", count: 1, icon: RotateCcw, color: "text-[#EF4444]", bg: "bg-red-50" },
            { label: "Total Txns", count: 5, icon: CreditCard, color: "text-[#1E3A5F]", bg: "bg-[#1E3A5F]/5" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-3 p-3 ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
