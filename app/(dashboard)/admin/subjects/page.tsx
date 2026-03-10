"use client"

import React from "react"
import { Plus, Pencil, ToggleRight } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Category pill colours ─────────────────── */
const CATEGORY_STYLES: Record<string, string> = {
  "K-12":      "bg-blue-100 text-blue-700 border-blue-200",
  "AP":        "bg-purple-100 text-purple-700 border-purple-200",
  "IB":        "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Test Prep": "bg-orange-100 text-orange-700 border-orange-200",
  "Coding":    "bg-teal-100 text-teal-700 border-teal-200",
}

/* ─────────────────── Hard-coded data ─────────────────── */
type Subject = Record<string, unknown> & {
  id: string
  subjectName: string
  category: string
  activeTeachers: number
  activeStudents: number
  basePrice: string
  status: string
}

const SUBJECTS: Subject[] = [
  { id: "1",  subjectName: "Mathematics",          category: "K-12",      activeTeachers: 18, activeStudents: 312, basePrice: "$55/hr", status: "active" },
  { id: "2",  subjectName: "Physics",               category: "K-12",      activeTeachers: 12, activeStudents: 186, basePrice: "$60/hr", status: "active" },
  { id: "3",  subjectName: "Chemistry",             category: "K-12",      activeTeachers: 10, activeStudents: 142, basePrice: "$60/hr", status: "active" },
  { id: "4",  subjectName: "Biology",               category: "K-12",      activeTeachers: 8,  activeStudents: 98,  basePrice: "$55/hr", status: "active" },
  { id: "5",  subjectName: "English Language Arts", category: "K-12",      activeTeachers: 14, activeStudents: 180, basePrice: "$50/hr", status: "active" },
  { id: "6",  subjectName: "AP Calculus",           category: "AP",        activeTeachers: 6,  activeStudents: 78,  basePrice: "$70/hr", status: "active" },
  { id: "7",  subjectName: "AP Physics",            category: "AP",        activeTeachers: 5,  activeStudents: 52,  basePrice: "$70/hr", status: "active" },
  { id: "8",  subjectName: "IB Mathematics",        category: "IB",        activeTeachers: 4,  activeStudents: 34,  basePrice: "$75/hr", status: "active" },
  { id: "9",  subjectName: "SAT Prep",              category: "Test Prep", activeTeachers: 8,  activeStudents: 152, basePrice: "$65/hr", status: "active" },
  { id: "10", subjectName: "Coding & Python",       category: "Coding",    activeTeachers: 6,  activeStudents: 100, basePrice: "$60/hr", status: "active" },
]

/* ─────────────────── Columns ─────────────────── */
const columns = [
  {
    key: "subjectName",
    label: "Subject Name",
    sortable: true,
    render: (row: Subject) => (
      <span className="font-medium text-[#1E293B]">{row.subjectName}</span>
    ),
  },
  {
    key: "category",
    label: "Category",
    sortable: true,
    render: (row: Subject) => {
      const cat = row.category as string
      const style = CATEGORY_STYLES[cat] ?? "bg-gray-100 text-gray-600 border-gray-200"
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
          {cat}
        </span>
      )
    },
  },
  {
    key: "activeTeachers",
    label: "Active Teachers",
    sortable: true,
    render: (row: Subject) => (
      <span className="font-semibold text-[#1E293B]">{row.activeTeachers}</span>
    ),
  },
  {
    key: "activeStudents",
    label: "Active Students",
    sortable: true,
    render: (row: Subject) => (
      <span className="font-semibold text-[#1E293B]">{row.activeStudents}</span>
    ),
  },
  {
    key: "basePrice",
    label: "Base Price/Hr",
    sortable: true,
    render: (row: Subject) => (
      <span className="font-semibold text-[#0D9488]">{row.basePrice}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row: Subject) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Subject) => (
      <div className="flex items-center gap-1">
        <button title="Edit"               className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil      className="w-3.5 h-3.5" /></button>
        <button title="Toggle Active/Off"  className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><ToggleRight className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

/* ─────────────────── Page ─────────────────── */
export default function SubjectsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Subject Management</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={SUBJECTS as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search subjects..."
        pageSize={10}
      />
    </div>
  )
}
