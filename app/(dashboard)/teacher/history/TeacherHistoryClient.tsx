"use client"

import React, { useState } from "react"
import { Download, Eye, X, Calendar, Clock, User, BookOpen, Star, FileText } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

type HistoryRow = {
  id: string
  date: string
  time: string
  student: string
  subject: string
  topic: string
  duration: string
  status: string
  feedbackRating: number | null
  scheduledAt: string
}

type Stats = {
  total: number
  completed: number
  cancelled: number
  noShow: number
  completionRate: string
}

function StatBox({
  label,
  value,
  valueColor = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

/* ── Class Detail Modal ── */
function ClassDetailModal({
  open,
  onClose,
  cls,
}: {
  open: boolean
  onClose: () => void
  cls: HistoryRow
}) {
  if (!open) return null

  const statusLabel = cls.status.replace(/_/g, " ")

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Class Details</h2>
              <p className="text-xs text-gray-500">{cls.subject}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={cls.status} size="sm" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" />Date</span>
              <span className="text-sm font-medium text-[#1E293B]">{cls.date}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" />Time</span>
              <span className="text-sm font-medium text-[#1E293B]">{cls.time}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><User className="w-4 h-4" />Student</span>
              <span className="text-sm font-medium text-[#1E293B]">{cls.student}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Subject</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">{cls.subject}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Duration</span>
              <span className="text-sm font-medium text-[#1E293B]">{cls.duration}</span>
            </div>
            <div className="flex items-start justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><FileText className="w-4 h-4" />Topic Covered</span>
              <span className="text-sm text-[#1E293B] text-right max-w-[200px]">{cls.topic}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500 flex items-center gap-2"><Star className="w-4 h-4" />Feedback</span>
              {cls.feedbackRating !== null ? (
                <RatingStars rating={cls.feedbackRating} size="sm" />
              ) : (
                <span className="text-xs text-gray-400">No feedback</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Export handler ── */
function exportCSV(classes: HistoryRow[]) {
  const headers = ["Date", "Time", "Student", "Subject", "Topic", "Duration", "Status", "Rating"]
  const rows = classes.map((c) => [
    c.date, c.time, c.student, c.subject, c.topic, c.duration, c.status, c.feedbackRating ?? ""
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `class-history-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Main Component ── */
export function TeacherHistoryClient({
  classes,
  stats,
}: {
  classes: HistoryRow[]
  stats: Stats
}) {
  const [selectedClass, setSelectedClass] = useState<HistoryRow | null>(null)

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
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">{r.subject}</span>
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
      render: (r: HistoryRow) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: "feedbackRating",
      label: "Feedback",
      render: (r: HistoryRow) =>
        r.feedbackRating !== null ? <RatingStars rating={r.feedbackRating} size="sm" /> : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: HistoryRow) => (
        <button
          onClick={() => setSelectedClass(r as HistoryRow)}
          className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Class History</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCSV(classes)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatBox label="Total Classes" value={stats.total} />
        <StatBox label="Completed" value={stats.completed} valueColor="text-[#22C55E]" />
        <StatBox label="Cancelled" value={stats.cancelled} valueColor="text-[#F97316]" />
        <StatBox label="No-Show" value={stats.noShow} valueColor="text-[#22C55E]" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Completion Rate</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-lg font-bold w-fit">{stats.completionRate}%</span>
        </div>
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={classes as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search classes…"
        pageSize={10}
      />

      {selectedClass && (
        <ClassDetailModal
          open={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          cls={selectedClass}
        />
      )}
    </div>
  )
}
