"use client"

import React from "react"
import { UserPlus, Eye, Pencil, Settings, Info } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─────────────────── Hard-coded data ─────────────────── */
type Coordinator = Record<string, unknown> & {
  id: string
  coordinatorName: string
  email: string
  bucketSize: number
  currentStudents: number
  availableSlots: number
  status: string
  joinedDate: string
}

const COORDINATORS: Coordinator[] = [
  { id: "1", coordinatorName: "Priya Menon",  email: "priya@eg.com",  bucketSize: 50, currentStudents: 42, availableSlots: 8,  status: "active", joinedDate: "Jun 2024" },
  { id: "2", coordinatorName: "Amit Sharma",  email: "amit@eg.com",   bucketSize: 50, currentStudents: 38, availableSlots: 12, status: "active", joinedDate: "Aug 2024" },
  { id: "3", coordinatorName: "Sneha Reddy",  email: "sneha@eg.com",  bucketSize: 40, currentStudents: 40, availableSlots: 0,  status: "active", joinedDate: "Jan 2025" },
  { id: "4", coordinatorName: "Rahul Verma",  email: "rahul@eg.com",  bucketSize: 45, currentStudents: 15, availableSlots: 30, status: "active", joinedDate: "Feb 2026" },
]

/* ─────────────────── Columns ─────────────────── */
const columns = [
  {
    key: "coordinatorName",
    label: "Coordinator Name",
    sortable: true,
    render: (row: Coordinator) => (
      <span className="font-medium text-[#1E293B]">{row.coordinatorName}</span>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (row: Coordinator) => (
      <span className="text-sm text-gray-500">{row.email}</span>
    ),
  },
  {
    key: "bucketSize",
    label: "Bucket Size",
    sortable: true,
    render: (row: Coordinator) => (
      <span className="font-semibold text-[#1E293B]">{row.bucketSize}</span>
    ),
  },
  {
    key: "currentStudents",
    label: "Current Students",
    sortable: true,
    render: (row: Coordinator) => (
      <span className="font-semibold text-[#1E293B]">{row.currentStudents}</span>
    ),
  },
  {
    key: "availableSlots",
    label: "Available Slots",
    sortable: true,
    render: (row: Coordinator) => {
      const slots = row.availableSlots as number
      return (
        <span
          className={`font-semibold text-sm ${
            slots === 0
              ? "text-[#EF4444]"
              : slots <= 5
              ? "text-[#F97316]"
              : "text-[#22C55E]"
          }`}
        >
          {slots === 0 ? "Full" : slots}
        </span>
      )
    },
  },
  {
    key: "status",
    label: "Status",
    render: (row: Coordinator) => <StatusBadge status={row.status as string} size="sm" />,
  },
  {
    key: "joinedDate",
    label: "Joined Date",
    sortable: true,
    render: (row: Coordinator) => (
      <span className="text-xs text-gray-400">{row.joinedDate}</span>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Coordinator) => (
      <div className="flex items-center gap-1">
        <button title="View"          className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Eye      className="w-3.5 h-3.5" /></button>
        <button title="Edit"          className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil  className="w-3.5 h-3.5" /></button>
        <button title="Bucket Config" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"><Settings className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

/* ─────────────────── Page ─────────────────── */
export default function CoordinatorsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Coordinator Management</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Add Coordinator
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={COORDINATORS as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search coordinators..."
        pageSize={10}
      />

      {/* Auto-assignment info card */}
      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-0.5">Auto-Assignment Rule</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            New students are automatically assigned to the coordinator with the most available slots.
            If all buckets are full, the least-crowded coordinator receives the assignment.
            Admin can manually reassign at any time.
          </p>
        </div>
      </div>
    </div>
  )
}