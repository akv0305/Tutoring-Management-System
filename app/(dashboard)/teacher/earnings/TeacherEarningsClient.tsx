"use client"

import React from "react"
import { DollarSign, Calendar, TrendingUp, Wallet } from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"

type PayoutRow = {
  id: string
  period: string
  classes: number
  gross: number
  deductions: number
  net: number
  status: string
  paidDate: string
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

export function TeacherEarningsClient({ data }: { data: EarningsData }) {
  const maxAmount = Math.max(...data.trend.map((t) => t.amount), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Earnings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Track your teaching income
        </p>
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
        <h2 className="text-base font-semibold text-[#1E293B] mb-5">
          Payout History
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Payout Period",
                  "Classes",
                  "Gross Amount",
                  "Deductions",
                  "Net Amount",
                  "Status",
                  "Paid Date",
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
                  <td
                    colSpan={7}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    No payout records yet.
                  </td>
                </tr>
              ) : (
                data.payouts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">
                      {p.period}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.classes}</td>
                    <td className="px-4 py-3 font-semibold text-[#1E293B]">
                      ${p.gross.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {p.deductions === 0 ? (
                        <span className="text-gray-400">$0</span>
                      ) : (
                        <span className="text-[#EF4444] font-medium">
                          -${p.deductions.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1E293B]">
                      ${p.net.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.paidDate}
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
          <h2 className="text-base font-semibold text-[#1E293B] mb-6">
            Earnings Trend
          </h2>
          <div
            className="flex items-end justify-center gap-6 px-4"
            style={{ height: MAX_BAR_H + 60 }}
          >
            {data.trend.map((item) => {
              const barH = Math.round((item.amount / maxAmount) * MAX_BAR_H)
              return (
                <div
                  key={item.month}
                  className="flex flex-col items-center gap-2 flex-1 max-w-[72px]"
                >
                  <span className="text-xs font-semibold text-[#0D9488]">
                    ${item.amount >= 1000
                      ? `${(item.amount / 1000).toFixed(1)}k`
                      : item.amount}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[#0D9488] hover:bg-[#0D9488]/80 transition-all duration-300 cursor-pointer"
                    style={{ height: `${Math.max(barH, 4)}px` }}
                    title={`${item.month}: $${item.amount}`}
                  />
                  <span className="text-xs text-gray-500 font-medium">
                    {item.month}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong className="text-[#1E293B]">Payout Policy:</strong> Payouts are
          processed monthly by the last business day. Deductions may apply for
          cancellations exceeding the monthly limit (3) or no-shows. For payout
          queries, contact your coordinator or admin.
        </p>
      </div>
    </div>
  )
}
