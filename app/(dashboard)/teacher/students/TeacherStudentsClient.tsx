"use client"

import React from "react"
import { Eye, Calendar } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

type Student = {
  id: string
  studentName: string
  grade: string
  subject: string
  package: string
  classesRemaining: number
  nextClass: string
  ratingGiven: number | null
  status: string
}

type KPIs = { active: number; trial: number; classesThisMonth: number }

function MiniKPI({
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
    key: "studentName",
    label: "Student Name",
    sortable: true,
    render: (row: Student) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-[#0D9488]">
            {row.studentName
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </span>
        </div>
        <span className="font-medium text-[#1E293B]">{row.studentName}</span>
      </div>
    ),
  },
  {
    key: "grade",
    label: "Grade",
    sortable: true,
    render: (row: Student) => (
      <span className="text-sm text-gray-600">{row.grade}</span>
    ),
  },
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    render: (row: Student) => (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
        {row.subject}
      </span>
    ),
  },
  {
    key: "package",
    label: "Package",
    render: (row: Student) => (
      <span className="text-sm text-gray-600">{row.package}</span>
    ),
  },
  {
    key: "classesRemaining",
    label: "Classes Left",
    sortable: true,
    render: (row: Student) => {
      const n = row.classesRemaining
      const color =
        n === 0
          ? "text-[#EF4444]"
          : n <= 2
          ? "text-[#F59E0B]"
          : "text-[#22C55E]"
      return (
        <span className={`font-semibold text-sm ${color}`}>
          {row.classesRemaining}
        </span>
      )
    },
  },
  {
    key: "nextClass",
    label: "Next Class",
    render: (row: Student) => (
      <span className="text-xs text-gray-500">{row.nextClass}</span>
    ),
  },
  {
    key: "ratingGiven",
    label: "Rating Given",
    render: (row: Student) =>
      row.ratingGiven !== null ? (
        <RatingStars rating={row.ratingGiven} size="sm" />
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Student) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (row: Student) => (
      <div className="flex items-center gap-1">
        <button
          title="View"
          className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        {row.status !== "inactive" && (
          <button
            title="Schedule"
            className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    ),
  },
]

export function TeacherStudentsClient({
  students,
  kpis,
}: {
  students: Student[]
  kpis: KPIs
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Students currently assigned to you
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniKPI
          label="Active Students"
          value={kpis.active}
          valueColor="text-[#22C55E]"
        />
        <MiniKPI
          label="Trial Students"
          value={kpis.trial}
          valueColor="text-[#F59E0B]"
        />
        <MiniKPI label="Total Classes This Month" value={kpis.classesThisMonth} />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={students as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search students…"
        pageSize={10}
      />
    </div>
  )
}
