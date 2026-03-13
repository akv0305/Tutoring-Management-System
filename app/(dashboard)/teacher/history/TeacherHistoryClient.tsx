"use client"

import React from "react"
import { Download, Eye } from "lucide-react"
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
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

const columns = [
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (r: HistoryRow) => (
      <span className="text-sm font-medium text-[#1E293B]">{r.date}</span>
    ),
  },
  {
    key: "time",
    label: "Time",
    render: (r: HistoryRow) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">{r.time}</span>
    ),
  },
  {
    key: "student",
    label: "Student",
    sortable: true,
    render: (r: HistoryRow) => (
      <span className="text-sm text-[#1E293B]">{r.student}</span>
    ),
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
    render: (r: HistoryRow) => (
      <span className="text-xs text-gray-500 max-w-[160px] block truncate">
        {r.topic}
      </span>
    ),
  },
  {
    key: "duration",
    label: "Duration",
    render: (r: HistoryRow) => (
      <span className="text-xs text-gray-500">{r.duration}</span>
    ),
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
      r.feedbackRating !== null ? (
        <RatingStars rating={r.feedbackRating} size="sm" />
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

export function TeacherHistoryClient({
  classes,
  stats,
}: {
  classes: HistoryRow[]
  stats: Stats
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Class History</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatBox label="Total Classes" value={stats.total} />
        <StatBox
          label="Completed"
          value={stats.completed}
          valueColor="text-[#22C55E]"
        />
        <StatBox
          label="Cancelled"
          value={stats.cancelled}
          valueColor="text-[#F97316]"
        />
        <StatBox
          label="No-Show"
          value={stats.noShow}
          valueColor="text-[#22C55E]"
        />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Completion Rate
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-lg font-bold w-fit">
            {stats.completionRate}%
          </span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={classes as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search classes…"
        pageSize={10}
      />
    </div>
  )
}
