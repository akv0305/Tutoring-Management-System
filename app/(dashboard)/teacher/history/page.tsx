"use client"

import React, { useState } from "react"
import { Download, Eye } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Types ─── */
type HistoryRow = Record<string, unknown> & {
  id: string
  date: string
  time: string
  student: string
  subject: string
  topic: string
  duration: string
  status: string
  feedbackRating: number | null
}

/* ─── Data ─── */
const CLASS_HISTORY: HistoryRow[] = [
  { id: "h1",  date: "Mar 10", time: "9:00–10:00 AM",    student: "Alex Smith",   subject: "Mathematics", topic: "Quadratic Equations",     duration: "60 min", status: "completed",        feedbackRating: 5.0  },
  { id: "h2",  date: "Mar 10", time: "10:30–11:30 AM",   student: "Ryan Chen",    subject: "Mathematics", topic: "Fractions Review",        duration: "60 min", status: "completed",        feedbackRating: 5.0  },
  { id: "h3",  date: "Mar 8",  time: "9:00–10:00 AM",    student: "Alex Smith",   subject: "Mathematics", topic: "Completing the Square",   duration: "60 min", status: "completed",        feedbackRating: 5.0  },
  { id: "h4",  date: "Mar 8",  time: "2:00–3:00 PM",     student: "Priya Patel",  subject: "AP Calculus", topic: "Integration Techniques",  duration: "60 min", status: "completed",        feedbackRating: 4.0  },
  { id: "h5",  date: "Mar 7",  time: "9:00–10:00 AM",    student: "Alex Smith",   subject: "Mathematics", topic: "Quadratic Formula",       duration: "60 min", status: "completed",        feedbackRating: null },
  { id: "h6",  date: "Mar 7",  time: "11:00–12:00 PM",   student: "Aiden Brown",  subject: "AP Calculus", topic: "Chain Rule Practice",     duration: "60 min", status: "completed",        feedbackRating: 4.5  },
  { id: "h7",  date: "Mar 6",  time: "9:00–10:00 AM",    student: "Ryan Chen",    subject: "Mathematics", topic: "Decimal Operations",      duration: "60 min", status: "completed",        feedbackRating: 5.0  },
  { id: "h8",  date: "Mar 5",  time: "2:00–3:00 PM",     student: "Maya Johnson", subject: "SAT Prep",    topic: "Algebra Section Review",  duration: "60 min", status: "completed",        feedbackRating: 5.0  },
  { id: "h9",  date: "Mar 4",  time: "9:00–10:00 AM",    student: "Alex Smith",   subject: "Mathematics", topic: "Factoring Polynomials",   duration: "60 min", status: "cancelled_student",feedbackRating: null },
  { id: "h10", date: "Mar 3",  time: "10:30–11:30 AM",   student: "Priya Patel",  subject: "AP Calculus", topic: "Derivatives Review",      duration: "60 min", status: "completed",        feedbackRating: 4.0  },
]

/* ─── Stat box ─── */
function StatBox({ label, value, valueColor = "text-[#1E293B]" }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

const MONTHS = ["March 2026", "February 2026", "January 2026"]

/* ─── Columns ─── */
const columns = [
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (r: HistoryRow) => <span className="text-sm font-medium text-[#1E293B]">{r.date}</span>,
  },
  {
    key: "time",
    label: "Time",
    render: (r: HistoryRow) => <span className="text-xs text-gray-500 whitespace-nowrap">{r.time}</span>,
  },
  {
    key: "student",
    label: "Student",
    sortable: true,
    render: (r: HistoryRow) => <span className="text-sm text-[#1E293B]">{r.student}</span>,
  },
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    render: (r: HistoryRow) => (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
        {r.subject}
      </span>
    ),
  },
  {
    key: "topic",
    label: "Topic Covered",
    render: (r: HistoryRow) => <span className="text-xs text-gray-500 max-w-[160px] block truncate">{r.topic}</span>,
  },
  {
    key: "duration",
    label: "Duration",
    render: (r: HistoryRow) => <span className="text-xs text-gray-500">{r.duration}</span>,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (r: HistoryRow) => <StatusBadge status={r.status as string} size="sm" />,
  },
  {
    key: "feedbackRating",
    label: "Feedback",
    render: (r: HistoryRow) =>
      r.feedbackRating !== null ? (
        <RatingStars rating={r.feedbackRating as number} size="sm" />
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
  },
  {
    key: "actions",
    label: "Actions",
    render: () => (
      <button className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
        <Eye className="w-3.5 h-3.5" />
      </button>
    ),
  },
]

/* ─── Page ─── */
export default function ClassHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState("March 2026")

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Class History</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          >
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatBox label="Classes This Month" value={32} />
        <StatBox label="Completed"          value={28} valueColor="text-[#22C55E]" />
        <StatBox label="Cancelled"          value={2}  valueColor="text-[#F97316]" />
        <StatBox label="No-Show"            value={0}  valueColor="text-[#22C55E]" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Completion Rate</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-lg font-bold w-fit">
            100%
          </span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={CLASS_HISTORY as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search classes…"
        pageSize={10}
      />
    </div>
  )
}
