"use client"

import React, { useState } from "react"
import { UserPlus, Eye, DollarSign, UserX, UserCheck, X, Loader2, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"
import { AddTeacherModal } from "@/components/modals/AddTeacherModal"

type Teacher = Record<string, unknown> & {
  id: string
  teacherName: string
  email: string
  qualification: string
  subjects: string[]
  hourlyRate: string
  studentFacingRate: string
  rating: number
  totalReviews: number
  activeStudents: number
  experience: number
  status: string
}

type KPIs = {
  total: number
  active: number
  onLeave: number
  avgRating: string
}

type SubjectOption = { id: string; name: string; category: string }

/* ─── Teacher Detail Modal ─── */

function TeacherDetailModal({
  teacher,
  onClose,
}: {
  teacher: Teacher
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-[#1E293B]">Teacher Details</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {teacher.teacherName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E293B] text-lg">{teacher.teacherName}</p>
              <p className="text-xs text-gray-400">{teacher.qualification}</p>
              <StatusBadge status={teacher.status} size="sm" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-[#1E293B]">{teacher.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Experience</span>
              <span className="font-medium text-[#1E293B]">{teacher.experience} year{teacher.experience !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Students</span>
              <span className="font-medium text-[#1E293B]">{teacher.activeStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Rating</span>
              <div className="flex items-center gap-1.5">
                <RatingStars rating={teacher.rating} size="sm" />
                <span className="text-xs text-gray-400">({teacher.totalReviews})</span>
              </div>
            </div>
          </div>

          {/* Confidential rates */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
              <span>🔒</span> Confidential Rates
            </p>
            <div className="flex justify-between">
              <span className="text-amber-800">Compensation Rate</span>
              <span className="font-bold text-amber-900">{teacher.hourlyRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-800">Student-Facing Rate</span>
              <span className="font-bold text-amber-900">{teacher.studentFacingRate}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {teacher.subjects.length > 0 ? teacher.subjects.map((s) => (
                <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20">
                  {s}
                </span>
              )) : (
                <span className="text-sm text-gray-400">No subjects assigned</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Set Rate Modal ─── */

function SetRateModal({
  teacher,
  onClose,
  onSuccess,
}: {
  teacher: Teacher
  onClose: () => void
  onSuccess: () => void
}) {
  const currentRate = teacher.hourlyRate.replace("$", "").replace("/hr", "")
  const [rate, setRate] = useState(currentRate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    const numRate = Number(rate)
    if (isNaN(numRate) || numRate < 0) {
      setError("Please enter a valid rate.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teacher.id, action: "update_rate", compensationRate: numRate }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); return }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E293B]">Set Compensation Rate</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Update the hourly compensation rate for <strong>{teacher.teacherName}</strong>.
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Current Rate</span>
            <span className="font-semibold text-[#1E293B]">{teacher.hourlyRate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Student-Facing Rate</span>
            <span className="text-gray-600">{teacher.studentFacingRate}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">New Compensation Rate ($/hr)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save Rate"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Toggle Status Modal ─── */

function ToggleStatusModal({
  teacher,
  onClose,
  onSuccess,
}: {
  teacher: Teacher
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isActive = teacher.status === "active"
  const actionLabel = isActive ? "Deactivate" : "Activate"

  const handleConfirm = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teacher.id, action: "toggle_status" }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Action failed"); return }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1E293B] mb-2">{actionLabel} Teacher</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to {actionLabel.toLowerCase()} <strong>{teacher.teacherName}</strong>?
          {isActive && (
            <span className="block mt-1 text-xs text-gray-400">
              This teacher will not appear in active lists and new classes won&apos;t be assigned.
            </span>
          )}
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${isActive ? "bg-[#EF4444] hover:bg-red-600" : "bg-[#22C55E] hover:bg-green-600"}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── MiniKPI ─── */

function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Main Component ─── */

export function TeachersClient({
  teachers,
  kpis,
  subjects,
}: {
  teachers: Teacher[]
  kpis: KPIs
  subjects: SubjectOption[]
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)
  const [rateTeacher, setRateTeacher] = useState<Teacher | null>(null)
  const [toggleTeacher, setToggleTeacher] = useState<Teacher | null>(null)

  const handleTeacherAdded = () => { window.location.reload() }
  const handleRateUpdated = () => { setRateTeacher(null); window.location.reload() }
  const handleStatusToggled = () => { setToggleTeacher(null); window.location.reload() }

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
          {row.subjects.map((s) => (
            <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20">
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
        <div className="flex items-center gap-1.5">
          <RatingStars rating={row.rating} size="sm" />
          <span className="text-xs text-gray-400">({row.totalReviews})</span>
        </div>
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
      render: (row: Teacher) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Teacher) => (
        <div className="flex items-center gap-1">
          <button title="View" onClick={() => setViewTeacher(row)} className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button title="Set Rate" onClick={() => setRateTeacher(row)} className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
            <DollarSign className="w-3.5 h-3.5" />
          </button>
          <button
            title={row.status === "active" ? "Deactivate" : "Activate"}
            onClick={() => setToggleTeacher(row)}
            className={`p-1.5 rounded-md transition-colors ${row.status === "active" ? "text-[#EF4444] hover:bg-red-50" : "text-[#22C55E] hover:bg-green-50"}`}
          >
            {row.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Management</h1>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Teachers" value={kpis.total} />
        <MiniKPI label="Active" value={kpis.active} valueClass="text-[#22C55E]" />
        <MiniKPI label="On Leave" value={kpis.onLeave} valueClass="text-[#F59E0B]" />
        <MiniKPI label="Average Rating" value={kpis.avgRating} valueClass="text-[#F59E0B]" />
      </div>

      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-amber-600 text-lg leading-none mt-0.5">🔒</span>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Confidential:</span> Compensation rates (Comp. Rate) are visible to Admins only. This column is hidden from Coordinators, Teachers, and Parents.
        </p>
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={teachers as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search teachers..."
        pageSize={10}
      />

      {/* Modals */}
      <AddTeacherModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleTeacherAdded} subjects={subjects} />
      {viewTeacher && <TeacherDetailModal teacher={viewTeacher} onClose={() => setViewTeacher(null)} />}
      {rateTeacher && <SetRateModal teacher={rateTeacher} onClose={() => setRateTeacher(null)} onSuccess={handleRateUpdated} />}
      {toggleTeacher && <ToggleStatusModal teacher={toggleTeacher} onClose={() => setToggleTeacher(null)} onSuccess={handleStatusToggled} />}
    </div>
  )
}
