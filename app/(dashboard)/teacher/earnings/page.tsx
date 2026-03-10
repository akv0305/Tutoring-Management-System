import React from "react"
import { DollarSign, Calendar, TrendingUp, Wallet } from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Payout history ─── */
const PAYOUTS = [
  { period: "March 2026",    classes: 32, gross: "$1,240", deductions: "$0",           net: "$1,240", status: "pending", paidDate: "—" },
  { period: "February 2026", classes: 30, gross: "$1,050", deductions: "$0",           net: "$1,050", status: "paid",    paidDate: "Feb 28, 2026" },
  { period: "January 2026",  classes: 28, gross: "$980",   deductions: "$0",           net: "$980",   status: "paid",    paidDate: "Jan 31, 2026" },
  { period: "December 2025", classes: 22, gross: "$770",   deductions: "$35 (1 cancel)",net: "$735",  status: "paid",    paidDate: "Dec 31, 2025" },
  { period: "November 2025", classes: 26, gross: "$910",   deductions: "$0",           net: "$910",   status: "paid",    paidDate: "Nov 30, 2025" },
]

/* ─── Trend chart data ─── */
const TREND = [
  { month: "Oct",  amount: 680  },
  { month: "Nov",  amount: 910  },
  { month: "Dec",  amount: 735  },
  { month: "Jan",  amount: 980  },
  { month: "Feb",  amount: 1050 },
  { month: "Mar",  amount: 1240 },
]
const MAX_AMOUNT = 1240
const MAX_BAR_H  = 180  // px

export default function EarningsPage() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Earnings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your teaching income</p>
      </div>

      {/* Section A — KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="This Month"
          value="$1,240"
          subtitle="32 classes"
          change="+15%"
          changeType="positive"
          icon={DollarSign}
        />
        <KPICard
          title="Last Month"
          value="$1,050"
          subtitle="30 classes"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Total Earned"
          value="$8,450"
          subtitle="Since Jun 2024"
          change=""
          changeType="neutral"
          icon={TrendingUp}
        />
        <KPICard
          title="Next Payout"
          value="$1,240"
          subtitle="Estimated Mar 31"
          change=""
          changeType="neutral"
          icon={Wallet}
        />
      </div>

      {/* Section B — Payout History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-5">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Payout Period", "Classes", "Gross Amount", "Deductions", "Net Amount", "Status", "Paid Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PAYOUTS.map((p) => (
                <tr key={p.period} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">{p.period}</td>
                  <td className="px-4 py-3 text-gray-600">{p.classes}</td>
                  <td className="px-4 py-3 font-semibold text-[#1E293B]">{p.gross}</td>
                  <td className="px-4 py-3">
                    {p.deductions === "$0" ? (
                      <span className="text-gray-400">$0</span>
                    ) : (
                      <span className="text-[#EF4444] font-medium">{p.deductions}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1E293B]">{p.net}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.paidDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C — Monthly Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-6">Earnings Trend</h2>
        <div className="flex items-end justify-center gap-6 px-4" style={{ height: MAX_BAR_H + 60 }}>
          {TREND.map((item) => {
            const barH = Math.round((item.amount / MAX_AMOUNT) * MAX_BAR_H)
            return (
              <div key={item.month} className="flex flex-col items-center gap-2 flex-1 max-w-[72px]">
                {/* Amount label */}
                <span className="text-xs font-semibold text-[#0D9488]">
                  ${(item.amount / 1000).toFixed(item.amount >= 1000 ? 1 : 0)}k
                </span>
                {/* Bar */}
                <div
                  className="w-full rounded-t-md bg-[#0D9488] hover:bg-[#0D9488]/80 transition-all duration-300 cursor-pointer"
                  style={{ height: `${barH}px` }}
                  title={`${item.month}: $${item.amount}`}
                />
                {/* Month label */}
                <span className="text-xs text-gray-500 font-medium">{item.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section D — Info box */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong className="text-[#1E293B]">Payout Policy:</strong> Payouts are processed monthly by the last business
          day. Deductions may apply for cancellations exceeding the monthly limit (3) or no-shows. For payout queries,
          contact your coordinator or admin.
        </p>
      </div>
    </div>
  )
}
