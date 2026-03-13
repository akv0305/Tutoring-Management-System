"use client"

import React, { useState, useMemo } from "react"
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

type Payment = {
  id: string
  txnId: string
  description: string
  amount: string
  amountNum: number
  date: string
  method: string
  methodIcon: string
  status: string
}

type Counts = {
  all: number
  completed: number
  pending: number
  refunded: number
}

type KPIs = {
  totalSpent: number
  lastPaymentAmount: number
  lastPaymentDate: string
  lastPaymentDesc: string
  pendingAmount: number
}

type FilterTab = "all" | "completed" | "pending" | "refunded"

const METHOD_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-4 h-4 text-[#1E3A5F]" />,
  bank: <Banknote className="w-4 h-4 text-[#0D9488]" />,
  upi: <Smartphone className="w-4 h-4 text-[#F59E0B]" />,
}

export function ParentPaymentsClient({
  childName,
  payments,
  counts,
  kpis,
  coordinatorName,
  coordinatorEmail,
}: {
  childName: string
  payments: Payment[]
  counts: Counts
  kpis: KPIs
  coordinatorName: string
  coordinatorEmail: string
}) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")

  const filtered = useMemo(
    () =>
      payments.filter((p) =>
        activeFilter === "all" ? true : p.status === activeFilter
      ),
    [activeFilter, payments]
  )

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "refunded", label: "Refunded", count: counts.refunded },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Payment History</h1>
        <p className="text-sm text-gray-500 mt-1">
          All transactions for {childName}&apos;s learning account
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Spent"
          value={`$${kpis.totalSpent.toLocaleString()}`}
          subtitle="All time payments"
          change=""
          changeType="neutral"
          icon={DollarSign}
        />
        <KPICard
          title="Last Payment"
          value={`$${kpis.lastPaymentAmount.toLocaleString()}`}
          subtitle={kpis.lastPaymentDate}
          change={kpis.lastPaymentDesc}
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Pending Amount"
          value={`$${kpis.pendingAmount.toLocaleString()}`}
          subtitle={
            kpis.pendingAmount === 0
              ? "No pending payments"
              : "Awaiting confirmation"
          }
          change={kpis.pendingAmount === 0 ? "All clear" : ""}
          changeType={kpis.pendingAmount === 0 ? "positive" : "negative"}
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
            <span
              className={[
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                activeFilter === t.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">
              Transactions
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Transaction ID",
                  "Package / Description",
                  "Amount",
                  "Date",
                  "Method",
                  "Status",
                  "Actions",
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    No payments found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-medium text-[#1E3A5F] bg-[#1E3A5F]/5 px-2 py-1 rounded">
                        {p.txnId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1E293B] font-medium">
                      {p.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#1E293B]">
                      {p.amount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {METHOD_ICONS[p.methodIcon]}
                        <span className="text-sm text-gray-600">
                          {p.method}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "completed" ? (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Need help with a payment?
          </p>
          <p className="text-sm text-blue-600 mt-0.5">
            Contact your coordinator{" "}
            <span className="font-semibold">{coordinatorName}</span> at{" "}
            <a
              href={`mailto:${coordinatorEmail}`}
              className="underline hover:no-underline"
            >
              {coordinatorEmail}
            </a>
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">
          Payment Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Completed",
              count: counts.completed,
              icon: CheckCircle,
              color: "text-[#22C55E]",
              bg: "bg-green-50",
            },
            {
              label: "Pending",
              count: counts.pending,
              icon: Clock,
              color: "text-[#F59E0B]",
              bg: "bg-amber-50",
            },
            {
              label: "Refunded",
              count: counts.refunded,
              icon: RotateCcw,
              color: "text-[#EF4444]",
              bg: "bg-red-50",
            },
            {
              label: "Total Txns",
              count: counts.all,
              icon: CreditCard,
              color: "text-[#1E3A5F]",
              bg: "bg-[#1E3A5F]/5",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-3 p-3 ${s.bg} rounded-xl`}
            >
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