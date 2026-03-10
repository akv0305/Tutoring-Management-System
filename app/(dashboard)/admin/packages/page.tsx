"use client"

import React from "react"
import { Plus, Pencil, Copy, ToggleRight, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Hard-coded data ─────────────────── */
type Package = Record<string, unknown> & {
  id: string
  packageName: string
  teacher: string
  subject: string
  classesIncluded: number
  pricePerClass: string
  totalPrice: string
  validity: string
  status: string
}

const PACKAGES: Package[] = [
  { id: "1", packageName: "4 Classes - Math",     teacher: "Dr. Ananya Sharma",  subject: "Mathematics", classesIncluded: 4, pricePerClass: "$55", totalPrice: "$220", validity: "30 days", status: "active" },
  { id: "2", packageName: "6 Classes - Math",     teacher: "Dr. Ananya Sharma",  subject: "Mathematics", classesIncluded: 6, pricePerClass: "$52", totalPrice: "$312", validity: "45 days", status: "active" },
  { id: "3", packageName: "8 Classes - Math",     teacher: "Dr. Ananya Sharma",  subject: "Mathematics", classesIncluded: 8, pricePerClass: "$50", totalPrice: "$400", validity: "60 days", status: "active" },
  { id: "4", packageName: "4 Classes - Physics",  teacher: "Prof. Vikram Rao",   subject: "Physics",     classesIncluded: 4, pricePerClass: "$60", totalPrice: "$240", validity: "30 days", status: "active" },
  { id: "5", packageName: "6 Classes - Physics",  teacher: "Prof. Vikram Rao",   subject: "Physics",     classesIncluded: 6, pricePerClass: "$57", totalPrice: "$342", validity: "45 days", status: "active" },
  { id: "6", packageName: "4 Classes - SAT",      teacher: "Prof. Vikram Rao",   subject: "SAT Prep",    classesIncluded: 4, pricePerClass: "$65", totalPrice: "$260", validity: "30 days", status: "active" },
  { id: "7", packageName: "8 Classes - English",  teacher: "Ms. Deepika Nair",   subject: "English",     classesIncluded: 8, pricePerClass: "$48", totalPrice: "$384", validity: "60 days", status: "active" },
  { id: "8", packageName: "4 Classes - Coding",   teacher: "Dr. Meera Krishnan", subject: "Coding",      classesIncluded: 4, pricePerClass: "$60", totalPrice: "$240", validity: "30 days", status: "draft"  },
]

/* ─────────────────── Columns ─────────────────── */
const columns = [
  {
    key: "packageName",
    label: "Package Name",
    sortable: true,
    render: (row: Package) => (
      <span className="font-medium text-[#1E293B]">{row.packageName}</span>
    ),
  },
  {
    key: "teacher",
    label: "Teacher",
    sortable: true,
    render: (row: Package) => (
      <span className="text-sm text-gray-600">{row.teacher}</span>
    ),
  },
  {
    key: "subject",
    label: "Subject",
    render: (row: Package) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
        {row.subject}
      </span>
    ),
  },
  {
    key: "classesIncluded",
    label: "Classes",
    sortable: true,
    render: (row: Package) => (
      <span className="font-semibold text-[#1E293B]">{row.classesIncluded}</span>
    ),
  },
  {
    key: "pricePerClass",
    label: "Price/Class",
    sortable: true,
    render: (row: Package) => (
      <span className="text-sm text-gray-600">{row.pricePerClass}</span>
    ),
  },
  {
    key: "totalPrice",
    label: "Total Price",
    sortable: true,
    render: (row: Package) => (
      <span className="font-bold text-[#1E3A5F]">{row.totalPrice}</span>
    ),
  },
  {
    key: "validity",
    label: "Validity",
    render: (row: Package) => (
      <span className="text-sm text-gray-500">{row.validity}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row: Package) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Package) => (
      <div className="flex items-center gap-1">
        <button title="Edit"       className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil      className="w-3.5 h-3.5" /></button>
        <button title="Duplicate"  className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"><Copy        className="w-3.5 h-3.5" /></button>
        <button title="Toggle"     className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><ToggleRight className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

/* ─────────────────── Page ─────────────────── */
export default function PackagesPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Package Management</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Package
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-l-4 border-[#F59E0B] rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Note:</span> Packages are teacher-specific. Admin sets the price per class for each teacher.
          Parents purchase packages to book classes.
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={PACKAGES as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search packages..."
        pageSize={10}
      />
    </div>
  )
}
