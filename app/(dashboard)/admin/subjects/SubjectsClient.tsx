"use client"

import React from "react"
import { Plus, Pencil, ToggleRight } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

const CATEGORY_STYLES: Record<string, string> = {
  "MATH":             "bg-blue-100 text-blue-700 border-blue-200",
  "SCIENCE":          "bg-purple-100 text-purple-700 border-purple-200",
  "ENGLISH":          "bg-indigo-100 text-indigo-700 border-indigo-200",
  "TEST PREP":        "bg-orange-100 text-orange-700 border-orange-200",
  "COMPUTER SCIENCE": "bg-teal-100 text-teal-700 border-teal-200",
  "LANGUAGES":        "bg-pink-100 text-pink-700 border-pink-200",
  "OTHER":            "bg-gray-100 text-gray-600 border-gray-200",
}

type Subject = Record<string, unknown> & {
  id: string
  subjectName: string
  category: string
  activeTeachers: number
  activeStudents: number
  basePrice: string
  status: string
}

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
      const cat = (row.category as string).toUpperCase()
      const style = CATEGORY_STYLES[cat] ?? "bg-gray-100 text-gray-600 border-gray-200"
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
          {row.category}
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
    render: (row: Subject) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Subject) => (
      <div className="flex items-center gap-1">
        <button title="Edit" className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button title="Toggle Active/Off" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><ToggleRight className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
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
        data={subjects as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search subjects..."
        pageSize={10}
      />
    </div>
  )
}
