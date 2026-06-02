// app/(dashboard)/teacher/earnings/TeacherEarningsClient.tsx
"use client"

import React, { useState } from "react"
import { DollarSign, Calendar, TrendingUp, Wallet, X, AlertCircle, Info } from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"

type PayoutRow = {
  id: string
  period: string
  classes: number
  gross: number
  deductions: number
  bonus: number
  net: number
  status: string
  paidDate: string
  adminNotes: string | null
}

type TrendItem = { month: string; amount: number }

type EarningsData = {
  thisMonthEarnings: number
  thisMonthClasses: number
  lastMonthNet: number
  lastMonthClasses: number
  totalEarned: number
  nextPayoutEstimate: number
  payouts: PayoutRow[]
  trend: TrendItem[]
}

const MAX_BAR_H = 180

function DeductionDetailsModal({
  open,
  onClose,
  payout,
}: {
  open: boolean
  onClose: () => void
  payout: PayoutRow
}) {
  if (!open) return null

  // Parse admin notes — each credit/deduction is separated by " | " or newline
  const noteLines = (payout.adminNotes ?? "")
    .split(/\s*[\|\n]\s*/)
    .filter((line) => line.trim().length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-[#1E293B] mb-1">Payout Details</h3>
        <p className="text-sm text-gray-500 mb-5">{payout.period}</p>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Classes</p>
            <p className="text-lg font-bold text-[#1E293B]">{payout.classes}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Gross</p>
            <p className="text-lg font-bold text-[#1E293B]">${payout.gross.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Deductions</p>
            <p className="text-lg font-bold text-red-500">
              {payout.deductions > 0 ? `-$${payout.deductions.toLocaleString()}` : "$0"}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Bonus</p>
            <p className="text-lg font-bold text-green-600">
              {payout.bonus > 0 ? `+$${payout.bonus.toLocaleString()}` : "$0"}
            </p>
          </div>
        </div>

        {/* Net */}
        <div className="flex items-center justify-between p-4 bg-[#1E3A5F] rounded-lg mb-5">
          <span className="text-sm font-medium text-white/80">Net Amount</span>
          <span className="text-xl font-bold text-white">${payout.net.toLocaleString()}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-gray-600">Status</span>
          <StatusBadge status={payout.status} />
        </div>

        {payout.paidDate !== "—" && (
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm text-gray-600">Paid On</span>
            <span className="text-sm font-medium text-[#1E293B]">{payout.paidDate}</span>
          </div>
        )}

        {/* Notes / Deduction Breakdown */}
        {noteLines.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Adjustment Notes
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {noteLines.map((line, i) => {
                const isCredit = line.toLowerCase().includes("credit") || line.toLowerCase().includes("deduct")
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                      isCredit ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    {isCredit ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-gray-600 leading-relaxed">{line}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {noteLines.length === 0 && payout.deductions === 0 && payout.bonus === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No adjustments for this period.</p>
        )}
      </div>
    </div>
  )
}

export function TeacherEarningsClient({ data }: { data: EarningsData }) {
  const maxAmount = Math.max(...data.trend.map((t) => t.amount), 1)
  const [detailPayout, setDetailPayout] = useState<PayoutRow | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Earnings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your teaching income</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="This Month"
          value={`$${data.thisMonthEarnings.toLocaleString()}`}
          subtitle={`${data.thisMonthClasses} classes`}
          change=""
          changeType="neutral"
          icon={DollarSign}
        />
        <KPICard
          title="Last Month"
          value={`$${data.lastMonthNet.toLocaleString()}`}
          subtitle={`${data.lastMonthClasses} classes`}
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Total Earned"
          value={`$${data.totalEarned.toLocaleString()}`}
          subtitle="All time"
          change=""
          changeType="neutral"
          icon={TrendingUp}
        />
        <KPICard
          title="Next Payout"
          value={`$${data.nextPayoutEstimate.toLocaleString()}`}
          subtitle="Estimated end of month"
          change=""
          changeType="neutral"
          icon={Wallet}
        />
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-5">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Payout Period",
                  "Classes",
                  "Gross Amount",
                  "Deductions",
                  "Bonus",
                  "Net Amount",
                  "Status",
                  "Paid Date",
                  "",
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
              {data.payouts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">
                    No payout records yet.
                  </td>
                </tr>
              ) : (
                data.payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">{p.period}</td>
                    <td className="px-4 py-3 text-gray-600">{p.classes}</td>
                    <td className="px-4 py-3 font-semibold text-[#1E293B]">${p.gross.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {p.deductions === 0 ? (
                        <span className="text-gray-400">$0</span>
                      ) : (
                        <span className="text-[#EF4444] font-medium">-${p.deductions.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.bonus === 0 ? (
                        <span className="text-gray-400">$0</span>
                      ) : (
                        <span className="text-[#22C55E] font-medium">+${p.bonus.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1E293B]">${p.net.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.paidDate}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailPayout(p)}
                        className="text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80 hover:underline whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Earnings Trend */}
      {data.trend.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-6">Earnings Trend</h2>
          <div className="flex items-end justify-center gap-6 px-4" style={{ height: MAX_BAR_H + 60 }}>
            {data.trend.map((item) => {
              const barH = Math.round((item.amount / maxAmount) * MAX_BAR_H)
              return (
                <div key={item.month} className="flex flex-col items-center gap-2 flex-1 max-w-[72px]">
                  <span className="text-xs font-semibold text-[#0D9488]">
                    ${item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[#0D9488] hover:bg-[#0D9488]/80 transition-all duration-300 cursor-pointer"
                    style={{ height: `${Math.max(barH, 4)}px` }}
                    title={`${item.month}: $${item.amount}`}
                  />
                  <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong className="text-[#1E293B]">Payout Policy:</strong> Payouts are processed monthly by the
          last business day. Deductions may apply for class credits issued to parents, cancellations
          exceeding the monthly limit (3), or no-shows. Click &quot;View Details&quot; on any payout to see the
          full breakdown. For payout queries, contact your coordinator or admin.
        </p>
      </div>

      {/* Detail Modal */}
      {detailPayout && (
        <DeductionDetailsModal
          open={!!detailPayout}
          onClose={() => setDetailPayout(null)}
          payout={detailPayout}
        />
      )}
    </div>
  )
}
