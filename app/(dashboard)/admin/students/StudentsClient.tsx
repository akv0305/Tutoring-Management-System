"use client"

import React, { useState } from "react"
import { UserCog, Download, Eye, Pencil, UserX, UserPlus, UserCheck, X, Loader2, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { AddStudentModal } from "@/components/modals/AddStudentModal"

type Student = Record<string, unknown> & {
  id: string
  studentName: string
  parentName: string
  email: string
  phone: string
  grade: string
  subjects: string[]
  coordinator: string
  status: string
  joinedDate: string
}

type KPIs = {
  total: number
  active: number
  inactive: number
  trialPending: number
}

/* ─── Student Detail Modal ─── */

function StudentDetailModal({
  student,
  onClose,
}: {
  student: Student
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-[#1E293B]">Student Details</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Name + Status */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0D9488] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {student.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E293B] text-lg">{student.studentName}</p>
              <StatusBadge status={student.status} size="sm" />
            </div>
          </div>

          {/* Info rows */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Parent</span>
              <span className="font-medium text-[#1E293B]">{student.parentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-[#1E293B]">{student.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-[#1E293B]">{student.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Grade</span>
              <span className="font-medium text-[#1E293B]">{student.grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coordinator</span>
              <span className={`font-medium ${student.coordinator === "Unassigned" ? "text-gray-400 italic" : "text-[#1E293B]"}`}>
                {student.coordinator}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-[#1E293B]">{student.joinedDate}</span>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {student.subjects.length > 0 ? student.subjects.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20"
                >
                  {s}
                </span>
              )) : (
                <span className="text-sm text-gray-400">No subjects assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Toggle Status Confirmation Modal ─── */

function ToggleStatusModal({
  student,
  onClose,
  onSuccess,
}: {
  student: Student
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isActive = student.status === "active"
  const newStatus = isActive ? "INACTIVE" : "ACTIVE"
  const actionLabel = isActive ? "Deactivate" : "Activate"

  const handleConfirm = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: student.id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Action failed")
        return
      }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1E293B] mb-2">{actionLabel} Student</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to {actionLabel.toLowerCase()}{" "}
          <strong>{student.studentName}</strong>?
          {isActive && (
            <span className="block mt-1 text-xs text-gray-400">
              The student will no longer appear in active lists and classes won&apos;t be scheduled.
            </span>
          )}
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
              isActive
                ? "bg-[#EF4444] hover:bg-red-600"
                : "bg-[#22C55E] hover:bg-green-600"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── MiniKPI ─── */

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

/* ─── Main Component ─── */

export function StudentsClient({ students, kpis }: { students: Student[]; kpis: KPIs }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [toggleStudent, setToggleStudent] = useState<Student | null>(null)

  const handleStudentAdded = () => {
    window.location.reload()
  }

  const handleStatusToggled = () => {
    setToggleStudent(null)
    window.location.reload()
  }

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
          {row.subjects.map((s) => (
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
      sortable: true,
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
      render: (row: Student) => <StatusBadge status={row.status} size="sm" />,
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
      render: (row: Student) => (
        <div className="flex items-center gap-1">
          <button
            title="View"
            onClick={() => setViewStudent(row)}
            className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            title={row.status === "active" ? "Deactivate" : "Activate"}
            onClick={() => setToggleStudent(row)}
            className={`p-1.5 rounded-md transition-colors ${
              row.status === "active"
                ? "text-[#EF4444] hover:bg-red-50"
                : "text-[#22C55E] hover:bg-green-50"
            }`}
          >
            {row.status === "active" ? (
              <UserX className="w-3.5 h-3.5" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Student Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
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
        <MiniKPI label="Total Students" value={kpis.total} />
        <MiniKPI label="Active" value={kpis.active} valueClass="text-[#22C55E]" />
        <MiniKPI label="Inactive" value={kpis.inactive} valueClass="text-gray-400" />
        <MiniKPI label="Trial Pending" value={kpis.trialPending} valueClass="text-[#F59E0B]" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={students as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search students..."
        pageSize={10}
        selectable
      />

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleStudentAdded}
      />

      {viewStudent && (
        <StudentDetailModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
        />
      )}

      {toggleStudent && (
        <ToggleStatusModal
          student={toggleStudent}
          onClose={() => setToggleStudent(null)}
          onSuccess={handleStatusToggled}
        />
      )}
    </div>
  )
}
