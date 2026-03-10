"use client"

import React from "react"
import { UserCog, Download, Eye, Pencil, UserX } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Hard-coded data ─────────────────── */
type Student = Record<string, unknown> & {
  id: string
  studentName: string
  parentName: string
  email: string
  grade: string
  subjects: string[]
  coordinator: string
  status: string
  joinedDate: string
}

const STUDENTS: Student[] = [
  { id: "1", studentName: "Alex Smith",     parentName: "Jane Smith",    email: "jane@email.com",   grade: "Grade 8",  subjects: ["Math","Science"],      coordinator: "Coord. Priya", status: "active",   joinedDate: "Jan 15, 2026" },
  { id: "2", studentName: "Maya Johnson",   parentName: "Robert Johnson", email: "robert@email.com", grade: "Grade 10", subjects: ["Physics","SAT Prep"],   coordinator: "Coord. Priya", status: "active",   joinedDate: "Feb 3, 2026"  },
  { id: "3", studentName: "Ryan Chen",      parentName: "Lisa Chen",     email: "lisa@email.com",   grade: "Grade 6",  subjects: ["Math"],                 coordinator: "Coord. Amit",  status: "active",   joinedDate: "Dec 10, 2025" },
  { id: "4", studentName: "Priya Patel",    parentName: "Vikram Patel",  email: "vikram@email.com", grade: "Grade 11", subjects: ["Chemistry","AP Calc"],  coordinator: "Coord. Priya", status: "active",   joinedDate: "Mar 1, 2026"  },
  { id: "5", studentName: "Ethan Williams", parentName: "Sarah Williams",email: "sarah@email.com",  grade: "Grade 9",  subjects: ["English"],              coordinator: "Coord. Amit",  status: "inactive", joinedDate: "Nov 5, 2025"  },
  { id: "6", studentName: "Sophia Lee",     parentName: "David Lee",     email: "david@email.com",  grade: "Grade 7",  subjects: ["Math","Coding"],        coordinator: "Unassigned",   status: "trial",    joinedDate: "Mar 8, 2026"  },
  { id: "7", studentName: "Aiden Brown",    parentName: "Maria Brown",   email: "maria@email.com",  grade: "Grade 12", subjects: ["ACT Prep"],             coordinator: "Coord. Priya", status: "active",   joinedDate: "Jan 22, 2026" },
  { id: "8", studentName: "Olivia Davis",   parentName: "James Davis",   email: "james@email.com",  grade: "Grade 5",  subjects: ["Reading","Math"],       coordinator: "Unassigned",   status: "trial",    joinedDate: "Mar 9, 2026"  },
]

/* ─────────────────── Column definitions ─────────────────── */
const columns = [
  {
    key: "studentName",
    label: "Student Name",
    sortable: true,
    render: (row: Student) => (
      <span className="font-medium text-[#1E293B]">{row.studentName}</span>
    ),
  },
  {
    key: "parentName",
    label: "Parent Name",
    sortable: true,
    render: (row: Student) => (
      <span className="text-gray-600">{row.parentName}</span>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (row: Student) => (
      <span className="text-gray-500 text-sm">{row.email}</span>
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
    key: "subjects",
    label: "Subjects",
    render: (row: Student) => (
      <div className="flex flex-wrap gap-1">
        {(row.subjects as string[]).map((s) => (
          <span
            key={s}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20"
          >
            {s}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: "coordinator",
    label: "Coordinator",
    render: (row: Student) => (
      <span className={`text-sm ${row.coordinator === "Unassigned" ? "text-gray-400 italic" : "text-gray-600"}`}>
        {row.coordinator}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Student) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "joinedDate",
    label: "Joined Date",
    sortable: true,
    render: (row: Student) => (
      <span className="text-xs text-gray-400">{row.joinedDate}</span>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Student) => (
      <div className="flex items-center gap-1">
        <button
          title="View"
          className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          title="Edit"
          className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          title="Deactivate"
          className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"
        >
          <UserX className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
  },
]

/* ─────────────────── Mini KPI card ─────────────────── */
function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─────────────────── Page ─────────────────── */
export default function StudentsPage() {
  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Student Management</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <UserCog className="w-4 h-4" />
            Bulk Assign Coordinator
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Students" value={847} />
        <MiniKPI label="Active" value={623} valueClass="text-[#22C55E]" />
        <MiniKPI label="Inactive" value={189} valueClass="text-gray-400" />
        <MiniKPI label="Trial Pending" value={35} valueClass="text-[#F59E0B]" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={STUDENTS as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search students..."
        pageSize={10}
        selectable
      />
    </div>
  )
}
