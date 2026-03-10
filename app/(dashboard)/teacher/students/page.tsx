"use client"

import React from "react"
import { Eye, Calendar } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Types ─── */
type Student = Record<string, unknown> & {
  id: string
  studentName: string
  grade: string
  subject: string
  package: string
  classesRemaining: number | string
  nextClass: string
  ratingGiven: number | null
  status: string
}

/* ─── Data ─── */
const STUDENTS: Student[] = [
  { id: "s1", studentName: "Alex Smith",    grade: "Grade 8",  subject: "Mathematics", package: "8 Classes", classesRemaining: 5, nextClass: "Mar 10, 9AM",    ratingGiven: 5.0,  status: "active" },
  { id: "s2", studentName: "Ryan Chen",     grade: "Grade 6",  subject: "Mathematics", package: "8 Classes", classesRemaining: 7, nextClass: "Mar 10, 10:30AM", ratingGiven: 5.0,  status: "active" },
  { id: "s3", studentName: "Priya Patel",   grade: "Grade 11", subject: "AP Calculus", package: "6 Classes", classesRemaining: 4, nextClass: "Mar 10, 2PM",    ratingGiven: 4.0,  status: "active" },
  { id: "s4", studentName: "Maya Johnson",  grade: "Grade 10", subject: "SAT Prep",    package: "4 Classes", classesRemaining: 2, nextClass: "Mar 14, 2PM",    ratingGiven: 5.0,  status: "active" },
  { id: "s5", studentName: "Aiden Brown",   grade: "Grade 12", subject: "AP Calculus", package: "4 Classes", classesRemaining: 3, nextClass: "Mar 11, 11AM",   ratingGiven: 4.5,  status: "active" },
  { id: "s6", studentName: "Noah Martinez", grade: "Grade 10", subject: "Mathematics", package: "Trial",     classesRemaining: 1, nextClass: "Mar 10, 4:30PM", ratingGiven: null, status: "trial" },
  { id: "s7", studentName: "Emma Wilson",   grade: "Grade 9",  subject: "Science",     package: "Trial",     classesRemaining: 1, nextClass: "Mar 11, 4PM",    ratingGiven: null, status: "trial" },
]

/* ─── KPI box ─── */
function MiniKPI({ label, value, valueColor = "text-[#1E293B]" }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

/* ─── Columns ─── */
const columns = [
  {
    key: "studentName",
    label: "Student Name",
    sortable: true,
    render: (row: Student) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-[#0D9488]">
            {row.studentName.split(" ").map((n: string) => n[0]).join("")}
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
    render: (row: Student) => <span className="text-sm text-gray-600">{row.grade}</span>,
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
    render: (row: Student) => <span className="text-sm text-gray-600">{row.package}</span>,
  },
  {
    key: "classesRemaining",
    label: "Classes Left",
    sortable: true,
    render: (row: Student) => {
      const n = typeof row.classesRemaining === "number" ? row.classesRemaining : -1
      const color = n === 0 ? "text-[#EF4444]" : n <= 2 ? "text-[#F59E0B]" : "text-[#22C55E]"
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
    render: (row: Student) => <span className="text-xs text-gray-500">{row.nextClass}</span>,
  },
  {
    key: "ratingGiven",
    label: "Rating Given",
    render: (row: Student) =>
      row.ratingGiven !== null ? (
        <RatingStars rating={row.ratingGiven as number} size="sm" />
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Student) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (row: Student) => (
      <div className="flex items-center gap-1">
        <button title="View" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
        {row.status !== "inactive" && (
          <button title="Schedule" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
            <Calendar className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    ),
  },
]

/* ─── Page ─── */
export default function TeacherStudentsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">Students currently assigned to you</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniKPI label="Active Students"         value={28} valueColor="text-[#22C55E]" />
        <MiniKPI label="Trial Students"          value={2}  valueColor="text-[#F59E0B]" />
        <MiniKPI label="Total Classes This Month" value={32} />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={STUDENTS as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search students…"
        pageSize={10}
      />
    </div>
  )
}
