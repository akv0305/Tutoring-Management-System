"use client"

import React from "react"
import { UserPlus, Eye, Pencil, DollarSign, UserX } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─────────────────── Hard-coded data ─────────────────── */
type Teacher = Record<string, unknown> & {
  id: string
  teacherName: string
  email: string
  qualification: string
  subjects: string[]
  hourlyRate: string
  rating: number
  activeStudents: number
  status: string
}

const TEACHERS: Teacher[] = [
  { id: "1", teacherName: "Dr. Ananya Sharma",  email: "ananya@eg.com",  qualification: "Ph.D. Mathematics",      subjects: ["Math","AP Calc"],      hourlyRate: "$35/hr", rating: 4.9, activeStudents: 28, status: "active"   },
  { id: "2", teacherName: "Prof. Vikram Rao",   email: "vikram@eg.com",  qualification: "M.Sc. Physics",           subjects: ["Physics","SAT Prep"],   hourlyRate: "$40/hr", rating: 4.7, activeStudents: 22, status: "active"   },
  { id: "3", teacherName: "Ms. Deepika Nair",   email: "deepika@eg.com", qualification: "M.A. English",            subjects: ["English","Reading"],    hourlyRate: "$30/hr", rating: 4.8, activeStudents: 18, status: "active"   },
  { id: "4", teacherName: "Mr. Suresh Iyer",    email: "suresh@eg.com",  qualification: "M.Sc. Chemistry",         subjects: ["Chemistry","Science"], hourlyRate: "$38/hr", rating: 4.5, activeStudents: 15, status: "active"   },
  { id: "5", teacherName: "Dr. Meera Krishnan", email: "meera@eg.com",   qualification: "Ph.D. Computer Science",  subjects: ["Coding","CS"],          hourlyRate: "$42/hr", rating: 4.6, activeStudents: 12, status: "on_leave" },
  { id: "6", teacherName: "Mr. Arjun Reddy",    email: "arjun@eg.com",   qualification: "M.Sc. Biology",           subjects: ["Biology","Science"],    hourlyRate: "$32/hr", rating: 4.4, activeStudents: 8,  status: "inactive" },
]

/* ─────────────────── Column definitions ─────────────────── */
const columns = [
  {
    key: "teacherName",
    label: "Teacher Name",
    sortable: true,
    render: (row: Teacher) => (
      <div>
        <p className="font-medium text-[#1E293B]">{row.teacherName}</p>
        <p className="text-xs text-gray-400">{row.qualification}</p>
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (row: Teacher) => (
      <span className="text-sm text-gray-500">{row.email}</span>
    ),
  },
  {
    key: "subjects",
    label: "Subjects",
    render: (row: Teacher) => (
      <div className="flex flex-wrap gap-1">
        {(row.subjects as string[]).map((s) => (
          <span
            key={s}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20"
          >
            {s}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: "hourlyRate",
    label: "Comp. Rate (Confidential)",
    render: (row: Teacher) => (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        🔒 {row.hourlyRate}
      </span>
    ),
  },
  {
    key: "rating",
    label: "Rating",
    sortable: true,
    render: (row: Teacher) => (
      <RatingStars rating={row.rating as number} size="sm" />
    ),
  },
  {
    key: "activeStudents",
    label: "Active Students",
    sortable: true,
    render: (row: Teacher) => (
      <span className="font-semibold text-[#1E293B]">{row.activeStudents}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Teacher) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Teacher) => (
      <div className="flex items-center gap-1">
        <button title="View"        className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Eye       className="w-3.5 h-3.5" /></button>
        <button title="Edit"        className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil   className="w-3.5 h-3.5" /></button>
        <button title="Set Rate"    className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"><DollarSign className="w-3.5 h-3.5" /></button>
        <button title="Deactivate"  className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><UserX    className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

/* ─────────────────── Mini KPI ─────────────────── */
function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─────────────────── Page ─────────────────── */
export default function TeachersPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Management</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Teachers" value={124} />
        <MiniKPI label="Active" value={98} valueClass="text-[#22C55E]" />
        <MiniKPI label="On Leave" value={12} valueClass="text-[#F59E0B]" />
        <MiniKPI label="Average Rating" value="4.6 ★" valueClass="text-[#F59E0B]" />
      </div>

      {/* Confidentiality notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-amber-600 text-lg leading-none mt-0.5">🔒</span>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Confidential:</span> Compensation rates (Comp. Rate) are visible to Admins only. This column is hidden from Coordinators, Teachers, and Parents.
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={TEACHERS as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search teachers..."
        pageSize={10}
      />
    </div>
  )
}
