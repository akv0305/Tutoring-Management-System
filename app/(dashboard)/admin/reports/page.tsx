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

/* ═══════════════════════════════════════════════════════════════════
   SECTION A — Financial stat box
═══════════════════════════════════════════════════════════════════ */
function FinancialBox({
  label,
  value,
  icon: Icon,
  bg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ElementType
  bg: string
  iconColor: string
}) {
  return (
    <div className={`rounded-lg p-4 flex items-center gap-4 ${bg}`}>
      <div className="flex-shrink-0">
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-[#1E293B] mt-0.5">{value}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION B-LEFT — Horizontal bar
═══════════════════════════════════════════════════════════════════ */
function HBar({
  label,
  value,
  widthPct,
  color,
}: {
  label: string
  value: number
  widthPct: number
  color: string
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-[#1E293B]">{label}</span>
        <span className="text-sm font-bold text-[#1E293B]">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
        <div
          className="h-full rounded-lg transition-all duration-500"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION B-RIGHT — Vertical bar chart (Tailwind only)
   Max value = 62 → 200 px
═══════════════════════════════════════════════════════════════════ */
const ENROLLMENT_DATA = [
  { month: "Oct '25", value: 38 },
  { month: "Nov '25", value: 42 },
  { month: "Dec '25", value: 29 },
  { month: "Jan '26", value: 55 },
  { month: "Feb '26", value: 48 },
  { month: "Mar '26", value: 62 },
]
const MAX_ENROLL = 62
const MAX_PX = 200

function VBar({ month, value }: { month: string; value: number }) {
  const height = Math.round((value / MAX_ENROLL) * MAX_PX)
  return (
    <div className="flex flex-col items-center gap-1" style={{ flex: "1 1 0" }}>
      <span className="text-xs font-bold text-[#1E293B]">{value}</span>
      <div
        className="w-full max-w-[44px] rounded-t-md"
        style={{ height, backgroundColor: "#0D9488" }}
      />
      <span className="text-[10px] text-gray-500 text-center leading-tight">{month}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION C — Teacher performance data
═══════════════════════════════════════════════════════════════════ */
const TEACHER_PERF = [
  { rank: "#1", name: "Dr. Ananya Sharma",  subject: "Mathematics",      classes: 156, rating: "4.9 ★", noShows: 0, feedback: "Excellent",  status: "active"   },
  { rank: "#2", name: "Ms. Deepika Nair",   subject: "English",          classes: 132, rating: "4.8 ★", noShows: 1, feedback: "Very Good",  status: "active"   },
  { rank: "#3", name: "Prof. Vikram Rao",   subject: "Physics",          classes: 128, rating: "4.7 ★", noShows: 2, feedback: "Very Good",  status: "active"   },
  { rank: "#4", name: "Dr. Meera Krishnan", subject: "Computer Science", classes: 98,  rating: "4.6 ★", noShows: 0, feedback: "Good",       status: "on_leave" },
  { rank: "#5", name: "Mr. Suresh Iyer",    subject: "Chemistry",        classes: 112, rating: "4.5 ★", noShows: 3, feedback: "Good",       status: "active"   },
  { rank: "#6", name: "Mr. Arjun Reddy",    subject: "Biology",          classes: 76,  rating: "4.4 ★", noShows: 1, feedback: "Average",    status: "inactive" },
]

/* ═══════════════════════════════════════════════════════════════════
   SECTION D-LEFT — Classes by subject
═══════════════════════════════════════════════════════════════════ */
const SUBJECT_CLASSES = [
  { subject: "Mathematics",     count: 890, pct: 100, color: "#0D9488" },
  { subject: "Physics",         count: 620, pct: 70,  color: "#0D9488" },
  { subject: "English",         count: 480, pct: 54,  color: "#1E3A5F" },
  { subject: "SAT Prep",        count: 410, pct: 46,  color: "#1E3A5F" },
  { subject: "Chemistry",       count: 350, pct: 39,  color: "#F59E0B" },
  { subject: "Computer Science",count: 240, pct: 27,  color: "#F59E0B" },
  { subject: "ACT Prep",        count: 160, pct: 18,  color: "#9CA3AF" },
  { subject: "Biology",         count: 97,  pct: 11,  color: "#9CA3AF" },
]

/* ═══════════════════════════════════════════════════════════════════
   SECTION D-RIGHT — Completion rate stat
═══════════════════════════════════════════════════════════════════ */
const COMPLETION_STATS = [
  { pct: "94.2%", label: "Completed",           sub: "3,060 of 3,247", color: "#0D9488" },
  { pct: "3.1%",  label: "Cancelled (Student)", sub: "101",            color: "#F59E0B" },
  { pct: "1.8%",  label: "No-Show (Teacher)",   sub: "58",             color: "#EF4444" },
  { pct: "0.9%",  label: "Cancelled (Teacher)", sub: "28",             color: "#9CA3AF" },
]

/* ═══════════════════════════════════════════════════════════════════
   SECTION E — Coordinator workload
═══════════════════════════════════════════════════════════════════ */
const COORD_DATA = [
  { name: "Priya Menon",  bucket: 50, active: 42, scheduled: 86, converted: 8,  rate: "72%" },
  { name: "Amit Sharma",  bucket: 50, active: 38, scheduled: 74, converted: 6,  rate: "67%" },
  { name: "Sneha Reddy",  bucket: 40, active: 40, scheduled: 92, converted: 10, rate: "80%" },
  { name: "Rahul Verma",  bucket: 45, active: 15, scheduled: 28, converted: 4,  rate: "57%" },
]

/* ═══════════════════════════════════════════════════════════════════
   PAGE (server component — no interactivity needed)
═══════════════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  return (
    <div className="space-y-6">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Reports &amp; Analytics</h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-xs text-gray-400 font-medium">From</span>
            <input
              type="date"
              defaultValue="2026-03-01"
              className="text-sm text-[#1E293B] bg-transparent outline-none"
            />
            <span className="text-gray-300">–</span>
            <span className="text-xs text-gray-400 font-medium">To</span>
            <input
              type="date"
              defaultValue="2026-03-10"
              className="text-sm text-[#1E293B] bg-transparent outline-none"
            />
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION A — Financial Overview
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">
          Financial Overview — March 2026
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <FinancialBox label="Total Collected"   value="$48,350" icon={DollarSign} bg="bg-[#F0FDF4]" iconColor="text-green-500" />
          <FinancialBox label="Teacher Payouts"   value="$32,200" icon={Wallet}     bg="bg-[#EFF6FF]" iconColor="text-blue-500"  />
          <FinancialBox label="Pending Payments"  value="$2,400"  icon={Clock}      bg="bg-[#FFFBEB]" iconColor="text-amber-500" />
          <FinancialBox label="Refunds Issued"    value="$850"    icon={RotateCcw}  bg="bg-[#FEF2F2]" iconColor="text-red-500"   />
        </div>
        <p className="mt-4 text-sm font-bold text-[#1E3A5F] text-right">
          Net Revenue: $48,350 − $32,200 − $850 ={" "}
          <span className="text-[#22C55E]">$15,300</span>
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION B — Student Analytics
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* B-Left: Status breakdown (horizontal bars) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">
            Student Status Breakdown
          </h2>
          <HBar label="Total Registered" value={847} widthPct={100} color="#1E3A5F" />
          <HBar label="Active Students"  value={623} widthPct={78}  color="#0D9488" />
          <HBar label="Inactive Students"value={189} widthPct={24}  color="#9CA3AF" />
          <HBar label="Trial Pending"    value={35}  widthPct={4}   color="#F59E0B" />
        </div>

        {/* B-Right: Monthly enrollment trend (vertical bars) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">
            Monthly Enrollment Trend
          </h2>
          {/* Chart area */}
          <div
            className="flex items-end gap-2 border-b-2 border-gray-200 pb-1 px-2"
            style={{ height: MAX_PX + 36 }}
          >
            {ENROLLMENT_DATA.map((d) => (
              <VBar key={d.month} month={d.month} value={d.value} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Students enrolled per month (Oct 2025 – Mar 2026)
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION C — Teacher Performance
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1E293B]">
            Teacher Performance Summary
          </h2>
          <span className="text-sm text-[#0D9488] font-medium cursor-pointer hover:underline">
            View All →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Rank","Teacher Name","Subject","Total Classes","Rating","No-Shows","Student Feedback","Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TEACHER_PERF.map((row, i) => (
                <tr key={row.rank} className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                  <td className="px-5 py-3 font-bold text-[#1E3A5F]">{row.rank}</td>
                  <td className="px-5 py-3 font-medium text-[#1E293B] whitespace-nowrap">{row.name}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{row.subject}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E293B] text-center">{row.classes}</td>
                  <td className="px-5 py-3 font-semibold text-[#F59E0B] whitespace-nowrap">{row.rating}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-semibold ${row.noShows === 0 ? "text-[#22C55E]" : row.noShows >= 3 ? "text-[#EF4444]" : "text-[#F97316]"}`}>
                      {row.noShows}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.feedback === "Excellent" ? "bg-green-100 text-green-700" :
                      row.feedback === "Very Good" ? "bg-teal-100 text-teal-700" :
                      row.feedback === "Good"      ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {row.feedback}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION D — Class Statistics
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* D-Left: Classes by subject */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Classes by Subject</h2>
          <div className="space-y-3">
            {SUBJECT_CLASSES.map((s) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="text-sm text-[#1E293B] font-medium" style={{ minWidth: 160 }}>
                  {s.subject}
                </span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500 text-right" style={{ minWidth: 36 }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* D-Right: Completion rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-5">Class Completion Rate</h2>
          <div className="grid grid-cols-2 gap-5">
            {COMPLETION_STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-5 text-center"
              >
                <span className="text-3xl font-extrabold" style={{ color: s.color }}>
                  {s.pct}
                </span>
                <span className="text-sm font-semibold text-[#1E293B] mt-1">{s.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION E — Coordinator Workload
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E293B]">Coordinator Workload</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Coordinator","Bucket Size","Active Students","Classes Scheduled","Trials Converted","Conversion Rate"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {COORD_DATA.map((row, i) => (
                <tr key={row.name} className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                  <td className="px-5 py-3 font-medium text-[#1E293B]">{row.name}</td>
                  <td className="px-5 py-3 text-gray-600 text-center">{row.bucket}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E293B] text-center">{row.active}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E293B] text-center">{row.scheduled}</td>
                  <td className="px-5 py-3 text-center text-[#0D9488] font-semibold">{row.converted}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-bold text-sm ${
                      parseInt(row.rate) >= 75 ? "text-[#22C55E]" :
                      parseInt(row.rate) >= 65 ? "text-[#F59E0B]" :
                      "text-[#EF4444]"
                    }`}>
                      {row.rate}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-[#1E3A5F]/5 border-t-2 border-[#1E3A5F]/20 font-bold">
                <td className="px-5 py-3 text-[#1E3A5F] font-bold">Total</td>
                <td className="px-5 py-3 text-gray-400 text-center">—</td>
                <td className="px-5 py-3 text-[#1E3A5F] text-center">135</td>
                <td className="px-5 py-3 text-[#1E3A5F] text-center">280</td>
                <td className="px-5 py-3 text-[#1E3A5F] text-center">28</td>
                <td className="px-5 py-3 text-center text-[#0D9488] font-bold">70% avg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
