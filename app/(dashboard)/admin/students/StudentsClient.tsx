"use client"

import React, { useState, useCallback } from "react"
import {
  UserCog,
  Download,
  Eye,
  UserX,
  UserPlus,
  UserCheck,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
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
  coordinatorId: string
  status: string
  joinedDate: string
}

type Coordinator = {
  id: string
  name: string
  currentStudents: number
  bucketSize: number
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-[#1E293B]">Student Details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0D9488] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {student.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E293B] text-lg">
                {student.studentName}
              </p>
              <StatusBadge status={student.status} size="sm" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Parent</span>
              <span className="font-medium text-[#1E293B]">
                {student.parentName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-[#1E293B]">
                {student.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-[#1E293B]">
                {student.phone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Grade</span>
              <span className="font-medium text-[#1E293B]">
                {student.grade}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coordinator</span>
              <span
                className={`font-medium ${
                  student.coordinator === "Unassigned"
                    ? "text-gray-400 italic"
                    : "text-[#1E293B]"
                }`}
              >
                {student.coordinator}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-[#1E293B]">
                {student.joinedDate}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Subjects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {student.subjects.length > 0 ? (
                student.subjects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">
                  No subjects assigned
                </span>
              )}
            </div>
          </div>
        </div>

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

/* ─── Toggle Status Modal ─── */

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#1E293B] mb-2">
          {actionLabel} Student
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to {actionLabel.toLowerCase()}{" "}
          <strong>{student.studentName}</strong>?
          {isActive && (
            <span className="block mt-1 text-xs text-gray-400">
              The student will no longer appear in active lists and classes
              won&apos;t be scheduled.
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

/* ─── Bulk Assign Coordinator Modal ─── */

function BulkAssignModal({
  selectedIds,
  students,
  coordinators,
  onClose,
  onSuccess,
}: {
  selectedIds: string[]
  students: Student[]
  coordinators: Coordinator[]
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [coordinatorId, setCoordinatorId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id))

  const handleAssign = async () => {
    if (!coordinatorId) {
      setError("Please select a coordinator.")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/students/bulk-assign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds, coordinatorId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Assignment failed.")
        return
      }
      onSuccess(data.message)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E293B]">
            Bulk Assign Coordinator
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Selected students summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {selectedStudents.length} Student
            {selectedStudents.length !== 1 ? "s" : ""} Selected
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedStudents.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-white border border-gray-200 text-gray-700"
              >
                {s.studentName}
                {s.coordinator !== "Unassigned" && (
                  <span className="text-gray-400 ml-1">
                    → {s.coordinator}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Coordinator selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Assign to Coordinator
          </label>
          <select
            value={coordinatorId}
            onChange={(e) => setCoordinatorId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            <option value="">Select a coordinator...</option>
            {coordinators.map((c) => {
              const available = c.bucketSize - c.currentStudents
              return (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.currentStudents}/{c.bucketSize} students (
                  {available} slots available)
                </option>
              )
            })}
          </select>
        </div>

        {/* Capacity warning */}
        {coordinatorId && (() => {
          const coord = coordinators.find((c) => c.id === coordinatorId)
          if (!coord) return null
          const available = coord.bucketSize - coord.currentStudents
          if (selectedStudents.length > available) {
            return (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {coord.name} only has {available} available slot
                  {available !== 1 ? "s" : ""} but{" "}
                  {selectedStudents.length} student
                  {selectedStudents.length !== 1 ? "s are" : " is"} selected.
                </span>
              </div>
            )
          }
          return null
        })()}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-gray-400 mb-4">
          Parents will be notified via email when a coordinator is assigned to
          their child.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !coordinatorId}
            className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserCog className="w-4 h-4" />
                Assign Coordinator
              </>
            )}
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
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Main Component ─── */

export function StudentsClient({
  students,
  kpis,
  coordinators = [],
}: {
  students: Student[]
  kpis: KPIs
  coordinators: Coordinator[]
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [toggleStudent, setToggleStudent] = useState<Student | null>(null)
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const handleStudentAdded = () => {
    window.location.reload()
  }

  const handleStatusToggled = () => {
    setToggleStudent(null)
    window.location.reload()
  }

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids)
  }, [])

  const handleBulkAssignClick = () => {
    if (selectedIds.length === 0) {
      setToast("Please select at least one student from the table first.")
      setTimeout(() => setToast(null), 4000)
      return
    }
    setShowBulkAssign(true)
  }

  const handleBulkAssignSuccess = (message: string) => {
    setShowBulkAssign(false)
    setSelectedIds([])
    setToast(message)
    setTimeout(() => setToast(null), 5000)
    window.location.reload()
  }

  const handleExportCSV = () => {
    const headers = [
      "Student Name",
      "Parent Name",
      "Email",
      "Phone",
      "Grade",
      "Subjects",
      "Coordinator",
      "Status",
      "Joined Date",
    ]

    const rows = students.map((s) => [
      s.studentName,
      s.parentName,
      s.email,
      s.phone,
      s.grade,
      s.subjects.join("; "),
      s.coordinator,
      s.status,
      s.joinedDate,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const escaped = String(cell).replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
        <span
          className={`text-sm ${
            row.coordinator === "Unassigned"
              ? "text-gray-400 italic"
              : "text-gray-600"
          }`}
        >
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
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Student Management
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
          <button
            onClick={handleBulkAssignClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              selectedIds.length > 0
                ? "border-[#0D9488] text-[#0D9488] bg-teal-50 hover:bg-teal-100"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <UserCog className="w-4 h-4" />
            Bulk Assign Coordinator
            {selectedIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold">
                {selectedIds.length}
              </span>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium bg-teal-50 border border-teal-200 text-teal-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="p-0.5 hover:bg-black/5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Students" value={kpis.total} />
        <MiniKPI
          label="Active"
          value={kpis.active}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI
          label="Inactive"
          value={kpis.inactive}
          valueClass="text-gray-400"
        />
        <MiniKPI
          label="Trial Pending"
          value={kpis.trialPending}
          valueClass="text-[#F59E0B]"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={students as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search students..."
        pageSize={10}
        selectable
        onSelectionChange={handleSelectionChange}
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

      {showBulkAssign && (
        <BulkAssignModal
          selectedIds={selectedIds}
          students={students}
          coordinators={coordinators}
          onClose={() => setShowBulkAssign(false)}
          onSuccess={handleBulkAssignSuccess}
        />
      )}
    </div>
  )
}
