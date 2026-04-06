"use client"

import React from "react"
import {
  FileText,
  Download,
  DollarSign,
  Wallet,
  Clock,
  RotateCcw,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ═══════════ Types ═══════════ */

type FinancialData = {
  totalCollected: number
  teacherPayouts: number
  pendingPayments: number
  refundsIssued: number
  netRevenue: number
}

type StudentBreakdown = {
  total: number
  active: number
  inactive: number
  trialPending: number
}

type EnrollmentMonth = {
  month: string
  value: number
}

type TeacherPerf = {
  rank: string
  name: string
  subject: string
  classes: number
  rating: string
  noShows: number
  feedback: string
  status: string
}

type SubjectClassCount = {
  subject: string
  count: number
  pct: number
  color: string
}

type CompletionStat = {
  pct: string
  label: string
  sub: string
  color: string
}

type CoordRow = {
  name: string
  bucket: number
  active: number
  scheduled: number
  converted: number
  rate: string
}

type CoordTotals = {
  active: number
  scheduled: number
  converted: number
  avgRate: string
}

export type ReportsData = {
  financial: FinancialData
  students: StudentBreakdown
  enrollment: EnrollmentMonth[]
  teacherPerf: TeacherPerf[]
  subjectClasses: SubjectClassCount[]
  completion: CompletionStat[]
  totalClasses: number
  coordinators: CoordRow[]
  coordTotals: CoordTotals
  periodLabel: string
}

/* ═══════════ Sub-components ═══════════ */

function FinancialBox({
  label, value, icon: Icon, bg, iconColor,
}: {
  label: string; value: string; icon: React.ElementType; bg: string; iconColor: string
}) {
  return (
    <div className={`rounded-lg p-4 flex items-center gap-4 ${bg}`}>
      <div className="flex-shrink-0"><Icon className={`w-6 h-6 ${iconColor}`} /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-[#1E293B] mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function HBar({ label, value, widthPct, color }: { label: string; value: number; widthPct: number; color: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-[#1E293B]">{label}</span>
        <span className="text-sm font-bold text-[#1E293B]">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
        <div className="h-full rounded-lg transition-all duration-500" style={{ width: `${widthPct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function VBar({ month, value, maxVal }: { month: string; value: number; maxVal: number }) {
  const height = maxVal > 0 ? Math.round((value / maxVal) * 200) : 0
  return (
    <div className="flex flex-col items-center gap-1" style={{ flex: "1 1 0" }}>
      <span className="text-xs font-bold text-[#1E293B]">{value}</span>
      <div className="w-full max-w-[44px] rounded-t-md" style={{ height, backgroundColor: "#0D9488" }} />
      <span className="text-[10px] text-gray-500 text-center leading-tight">{month}</span>
    </div>
  )
}

/* ═══════════ Main Component ═══════════ */

export function ReportsClient({ data }: { data: ReportsData }) {
  const { financial, students, enrollment, teacherPerf, subjectClasses, completion, totalClasses, coordinators, coordTotals, periodLabel } = data
  const maxEnroll = Math.max(...enrollment.map((e) => e.value), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Reports &amp; Analytics</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <FileText className="w-4 h-4" />Generate Report
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />Export PDF
          </button>
        </div>
      </div>

      {/* SECTION A — Financial Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">Financial Overview — {periodLabel}</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <FinancialBox label="Total Collected" value={`$${financial.totalCollected.toLocaleString()}`} icon={DollarSign} bg="bg-[#F0FDF4]" iconColor="text-green-500" />
          <FinancialBox label="Teacher Payouts" value={`$${financial.teacherPayouts.toLocaleString()}`} icon={Wallet} bg="bg-[#EFF6FF]" iconColor="text-blue-500" />
          <FinancialBox label="Pending Payments" value={`$${financial.pendingPayments.toLocaleString()}`} icon={Clock} bg="bg-[#FFFBEB]" iconColor="text-amber-500" />
          <FinancialBox label="Refunds Issued" value={`$${financial.refundsIssued.toLocaleString()}`} icon={RotateCcw} bg="bg-[#FEF2F2]" iconColor="text-red-500" />
        </div>
        <p className="mt-4 text-sm font-bold text-[#1E3A5F] text-right">
          Net Revenue: ${financial.totalCollected.toLocaleString()} − ${financial.teacherPayouts.toLocaleString()} − ${financial.refundsIssued.toLocaleString()} ={" "}
          <span className="text-[#22C55E]">${financial.netRevenue.toLocaleString()}</span>
        </p>
      </div>

      {/* SECTION B — Student Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Student Status Breakdown</h2>
          <HBar label="Total Registered" value={students.total} widthPct={100} color="#1E3A5F" />
          <HBar label="Active Students" value={students.active} widthPct={students.total > 0 ? Math.round((students.active / students.total) * 100) : 0} color="#0D9488" />
          <HBar label="Inactive Students" value={students.inactive} widthPct={students.total > 0 ? Math.round((students.inactive / students.total) * 100) : 0} color="#9CA3AF" />
          <HBar label="Trial Pending" value={students.trialPending} widthPct={students.total > 0 ? Math.round((students.trialPending / students.total) * 100) : 0} color="#F59E0B" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Monthly Enrollment Trend</h2>
          <div className="flex items-end gap-2 border-b-2 border-gray-200 pb-1 px-2" style={{ height: 236 }}>
            {enrollment.map((d) => (
              <VBar key={d.month} month={d.month} value={d.value} maxVal={maxEnroll} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">Students enrolled per month (last 6 months)</p>
        </div>
      </div>

      {/* SECTION C — Teacher Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1E293B]">Teacher Performance Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Rank", "Teacher Name", "Subject", "Total Classes", "Rating", "No-Shows", "Student Feedback", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teacherPerf.length > 0 ? teacherPerf.map((row, i) => (
                <tr key={row.rank} className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                  <td className="px-5 py-3 font-bold text-[#1E3A5F]">{row.rank}</td>
                  <td className="px-5 py-3 font-medium text-[#1E293B] whitespace-nowrap">{row.name}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{row.subject}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E293B] text-center">{row.classes}</td>
                  <td className="px-5 py-3 font-semibold text-[#F59E0B] whitespace-nowrap">{row.rating}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-semibold ${row.noShows === 0 ? "text-[#22C55E]" : row.noShows >= 3 ? "text-[#EF4444]" : "text-[#F97316]"}`}>{row.noShows}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.feedback === "Excellent" ? "bg-green-100 text-green-700" :
                      row.feedback === "Very Good" ? "bg-teal-100 text-teal-700" :
                      row.feedback === "Good" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{row.feedback}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={row.status} size="sm" /></td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">No teacher data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION D — Class Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Classes by Subject</h2>
          <div className="space-y-3">
            {subjectClasses.length > 0 ? subjectClasses.map((s) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="text-sm text-[#1E293B] font-medium" style={{ minWidth: 160 }}>{s.subject}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
                <span className="text-xs font-semibold text-gray-500 text-right" style={{ minWidth: 36 }}>{s.count}</span>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">No class data</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Class Completion Rate</h2>
          <div className="grid grid-cols-2 gap-5">
            {completion.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-5 text-center">
                <span className="text-3xl font-extrabold" style={{ color: s.color }}>{s.pct}</span>
                <span className="text-sm font-semibold text-[#1E293B] mt-1">{s.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION E — Coordinator Workload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E293B]">Coordinator Workload</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Coordinator", "Bucket Size", "Active Students", "Classes Scheduled", "Trials Converted", "Conversion Rate"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coordinators.length > 0 ? coordinators.map((row, i) => (
                <tr key={row.name} className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                  <td className="px-5 py-3 font-medium text-[#1E293B]">{row.name}</td>
                  <td className="px-5 py-3 text-gray-600 text-center">{row.bucket}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E293B] text-center">{row.active}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E293B] text-center">{row.scheduled}</td>
                  <td className="px-5 py-3 text-center text-[#0D9488] font-semibold">{row.converted}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-bold text-sm ${parseInt(row.rate) >= 75 ? "text-[#22C55E]" : parseInt(row.rate) >= 65 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>{row.rate}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No coordinator data</td></tr>
              )}
              {coordinators.length > 0 && (
                <tr className="bg-[#1E3A5F]/5 border-t-2 border-[#1E3A5F]/20 font-bold">
                  <td className="px-5 py-3 text-[#1E3A5F] font-bold">Total</td>
                  <td className="px-5 py-3 text-gray-400 text-center">—</td>
                  <td className="px-5 py-3 text-[#1E3A5F] text-center">{coordTotals.active}</td>
                  <td className="px-5 py-3 text-[#1E3A5F] text-center">{coordTotals.scheduled}</td>
                  <td className="px-5 py-3 text-[#1E3A5F] text-center">{coordTotals.converted}</td>
                  <td className="px-5 py-3 text-center text-[#0D9488] font-bold">{coordTotals.avgRate}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
