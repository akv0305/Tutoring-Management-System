"use client"

import React, { useState, useMemo } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  ToggleRight,
  ToggleLeft,
  X,
  Loader2,
  AlertCircle,
  DollarSign,
  Users,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  TrendingUp,
  Eye,
  EyeOff,
  GraduationCap,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ══════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════ */

   type GradeItem = {
    id: string
    name: string
    shortName: string
    sortOrder: number
    isActive: boolean
    gradeBandId: string
  }

type GradeBandItem = {
  id: string
  name: string
  displayName: string
  sortOrder: number
  isActive: boolean
  rateCount: number
  grades: GradeItem[]
}

type RateItem = Record<string, unknown> & {
  id: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  subjectId: string
  subjectName: string
  subjectCategory: string
  gradeBandId: string
  gradeBandName: string
  gradeBandDisplayName: string
  compensationRate: number
  studentFacingRate: number
  isActive: boolean
}

type TeacherOption = {
  id: string
  name: string
  email: string
  defaultCompRate: number
  defaultStudentRate: number
  subjects: { id: string; name: string }[]
}

type SubjectOption = {
  id: string
  name: string
  category: string
}

type KPIs = {
  totalRates: number
  activeRates: number
  teachersConfigured: number
  totalTeachers: number
  subjectsCovered: number
  totalSubjects: number
  avgMargin: number
}

/* ══════════════════════════════════════════════════════════
   Shared UI Components
   ══════════════════════════════════════════════════════════ */

function MiniKPI({
  label,
  value,
  subValue,
  icon: Icon,
  valueClass = "text-[#1E293B]",
  iconClass = "text-gray-400",
}: {
  label: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  valueClass?: string
  iconClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {subValue && <p className="text-[11px] text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  )
}

const BAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ELEMENTARY: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  SECONDARY: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  SECONDARY_TEST_PREP: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  AP: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  COLLEGE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  COLLEGE_STEM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
}

function BandBadge({ name, displayName }: { name: string; displayName: string }) {
  const colors = BAND_COLORS[name] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      {displayName}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   Generic Form Modal (used by Grade Bands tab)
   ══════════════════════════════════════════════════════════ */

type FieldDef = {
  key: string
  label: string
  type?: "text" | "number"
  placeholder?: string
  defaultValue?: string
}

function FormModal({
  title,
  fields,
  onSave,
  onClose,
}: {
  title: string
  fields: FieldDef[]
  onSave: (values: Record<string, string>) => Promise<void>
  onClose: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    fields.forEach((f) => {
      init[f.key] = f.defaultValue || ""
    })
    return init
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    try {
      await onSave(values)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              type={f.type || "text"}
              value={values[f.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Add Rate Modal
   ══════════════════════════════════════════════════════════ */

function AddRateModal({
  teachers,
  subjects,
  gradeBands,
  existingRates,
  onClose,
  onSuccess,
}: {
  teachers: TeacherOption[]
  subjects: SubjectOption[]
  gradeBands: GradeBandItem[]
  existingRates: RateItem[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [teacherId, setTeacherId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [gradeBandId, setGradeBandId] = useState("")
  const [compRate, setCompRate] = useState("")
  const [studentRate, setStudentRate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedTeacher = teachers.find((t) => t.id === teacherId)

  // Filter subjects to only those assigned to the selected teacher
  const availableSubjects = selectedTeacher
    ? subjects.filter((s) => selectedTeacher.subjects.some((ts) => ts.id === s.id))
    : []

  // Check for existing active rate
  const isDuplicate = existingRates.some(
    (r) =>
      r.teacherId === teacherId &&
      r.subjectId === subjectId &&
      r.gradeBandId === gradeBandId &&
      r.isActive
  )

  // Auto-fill default rates when teacher is selected
  const handleTeacherChange = (id: string) => {
    setTeacherId(id)
    setSubjectId("")
    const teacher = teachers.find((t) => t.id === id)
    if (teacher) {
      setCompRate(String(teacher.defaultCompRate))
      setStudentRate(String(teacher.defaultStudentRate))
    }
  }

  const handleSave = async () => {
    setError("")
    if (!teacherId) { setError("Please select a teacher."); return }
    if (!subjectId) { setError("Please select a subject."); return }
    if (!gradeBandId) { setError("Please select a grade band."); return }
    if (!compRate || Number(compRate) < 0) { setError("Valid compensation rate is required."); return }
    if (!studentRate || Number(studentRate) < 0) { setError("Valid student-facing rate is required."); return }
    if (isDuplicate) { setError("An active rate already exists for this combination."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          subjectId,
          gradeBandId,
          compensationRate: Number(compRate),
          studentFacingRate: Number(studentRate),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to create rate"); return }
      onSuccess()
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0D9488]/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#0D9488]" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B]">Add Rate</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Teacher */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teacher *</label>
          <select
            value={teacherId}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            <option value="">Select teacher...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subjects.length} subject{t.subjects.length !== 1 ? "s" : ""})
              </option>
            ))}
          </select>
        </div>

        {/* Subject — filtered to teacher's assigned subjects */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!teacherId}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] disabled:opacity-50 disabled:bg-gray-50"
          >
            <option value="">{teacherId ? "Select subject..." : "Select a teacher first"}</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {teacherId && availableSubjects.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1">
              This teacher has no subjects assigned. Assign subjects in Teacher Management first.
            </p>
          )}
        </div>

        {/* Grade Band */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Grade Band *</label>
          <select
            value={gradeBandId}
            onChange={(e) => setGradeBandId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            <option value="">Select grade band...</option>
            {gradeBands
              .filter((b) => b.isActive)
              .map((b) => (
                <option key={b.id} value={b.id}>{b.displayName}</option>
              ))}
          </select>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Compensation Rate ($/hr) <span className="text-amber-600">🔒</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={compRate}
              onChange={(e) => setCompRate(e.target.value)}
              placeholder="e.g. 10.00"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student-Facing Rate ($/hr)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={studentRate}
              onChange={(e) => setStudentRate(e.target.value)}
              placeholder="e.g. 15.00"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>
        </div>

        {/* Margin preview */}
        {compRate && studentRate && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Margin</span>
              <span className={`font-semibold ${Number(studentRate) - Number(compRate) > 0 ? "text-green-600" : "text-red-600"}`}>
                ${(Number(studentRate) - Number(compRate)).toFixed(2)}/hr
                {Number(studentRate) > 0 && (
                  <span className="text-gray-400 font-normal ml-1">
                    ({(((Number(studentRate) - Number(compRate)) / Number(studentRate)) * 100).toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>An active rate already exists for this combination. Edit the existing rate instead.</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || isDuplicate}
            className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating…" : "Create Rate"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Edit Rate Modal
   ══════════════════════════════════════════════════════════ */

function EditRateModal({
  rate,
  onClose,
  onSuccess,
}: {
  rate: RateItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [compRate, setCompRate] = useState(String(rate.compensationRate))
  const [studentRate, setStudentRate] = useState(String(rate.studentFacingRate))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (!compRate || Number(compRate) < 0) { setError("Valid compensation rate is required."); return }
    if (!studentRate || Number(studentRate) < 0) { setError("Valid student-facing rate is required."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rate.id,
          compensationRate: Number(compRate),
          studentFacingRate: Number(studentRate),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); return }
      onSuccess()
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">Edit Rate</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Context */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Teacher</span>
            <span className="font-medium text-[#1E293B]">{rate.teacherName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subject</span>
            <span className="font-medium text-[#1E293B]">{rate.subjectName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Grade Band</span>
            <BandBadge name={rate.gradeBandName} displayName={rate.gradeBandDisplayName} />
          </div>
        </div>

        {/* Rate inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Compensation ($/hr) <span className="text-amber-600">🔒</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={compRate}
              onChange={(e) => setCompRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student Rate ($/hr)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={studentRate}
              onChange={(e) => setStudentRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>
        </div>

        {/* Margin preview */}
        {compRate && studentRate && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
            <span className="text-gray-500">Margin</span>
            <span
              className={`font-semibold ${
                Number(studentRate) - Number(compRate) > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${(Number(studentRate) - Number(compRate)).toFixed(2)}/hr
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save Rates"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Tab 1: Grade Bands & Grades
   ══════════════════════════════════════════════════════════ */

function GradeBandsTab({
  gradeBands,
  onRefresh,
}: {
  gradeBands: GradeBandItem[]
  onRefresh: () => void
}) {
  const [expandedBand, setExpandedBand] = useState<string | null>(gradeBands[0]?.id || null)
  const [showAddBandModal, setShowAddBandModal] = useState(false)
  const [showAddGradeModal, setShowAddGradeModal] = useState<string | null>(null)
  const [editBand, setEditBand] = useState<GradeBandItem | null>(null)
  const [editGrade, setEditGrade] = useState<GradeItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleToggleBand = async (band: GradeBandItem) => {
    setActionLoading(band.id)
    try {
      const res = await fetch("/api/grade-bands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "band", id: band.id, isActive: !band.isActive }),
      })
      if (res.ok) onRefresh()
      else {
        const data = await res.json()
        alert(data.error || "Failed to toggle grade band")
      }
    } catch {
      alert("Network error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleGrade = async (grade: GradeItem) => {
    setActionLoading(grade.id)
    try {
      const res = await fetch("/api/grade-bands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "grade", id: grade.id, isActive: !grade.isActive }),
      })
      if (res.ok) onRefresh()
      else {
        const data = await res.json()
        alert(data.error || "Failed to toggle grade")
      }
    } catch {
      alert("Network error")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Grade Bands & Grades</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure grade bands and assign individual grades to each band
          </p>
        </div>
        <button
          onClick={() => setShowAddBandModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Grade Band
        </button>
      </div>

      {gradeBands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No grade bands configured yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Create your first grade band to start configuring pricing tiers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gradeBands.map((band) => {
            const isExpanded = expandedBand === band.id
            return (
              <div
                key={band.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Band Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedBand(isExpanded ? null : band.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1E293B]">{band.displayName}</span>
                        <StatusBadge status={band.isActive ? "active" : "inactive"} size="sm" />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {band.grades.length} grade{band.grades.length !== 1 ? "s" : ""} ·{" "}
                        {band.rateCount} active rate{band.rateCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      title="Edit"
                      onClick={() => setEditBand(band)}
                      className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title={band.isActive ? "Deactivate" : "Activate"}
                      onClick={() => handleToggleBand(band)}
                      disabled={actionLoading === band.id}
                      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                        band.isActive
                          ? "text-[#0D9488] hover:bg-teal-50"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {actionLoading === band.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : band.isActive ? (
                        <ToggleRight className="w-3.5 h-3.5" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Grades List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {band.grades.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">
                        No grades in this band yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-3">
                        {band.grades.map((grade) => (
                          <div
                            key={grade.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                              grade.isActive
                                ? "bg-white border-gray-200 hover:border-gray-300"
                                : "bg-gray-50 border-gray-100 opacity-60"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1E293B] truncate">
                                {grade.name}
                              </p>
                              <p className="text-[10px] text-gray-400">{grade.shortName}</p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                              <button
                                title="Edit"
                                onClick={() => setEditGrade(grade)}
                                className="p-1 rounded text-gray-400 hover:text-[#F59E0B] hover:bg-amber-50 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                title={grade.isActive ? "Deactivate" : "Activate"}
                                onClick={() => handleToggleGrade(grade)}
                                disabled={actionLoading === grade.id}
                                className={`p-1 rounded transition-colors disabled:opacity-50 ${
                                  grade.isActive
                                    ? "text-[#0D9488] hover:bg-teal-50"
                                    : "text-gray-400 hover:bg-gray-50"
                                }`}
                              >
                                {actionLoading === grade.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : grade.isActive ? (
                                  <ToggleRight className="w-3 h-3" />
                                ) : (
                                  <ToggleLeft className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAddGradeModal(band.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-[#0D9488] font-medium hover:text-teal-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Grade to {band.displayName}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showAddBandModal && (
        <FormModal
          title="Add Grade Band"
          fields={[
            { key: "name", label: "Band Name (Internal)", placeholder: "e.g. ELEMENTARY" },
            { key: "displayName", label: "Display Name", placeholder: "e.g. Elementary (K-6)" },
            { key: "sortOrder", label: "Sort Order", type: "number", placeholder: "0" },
          ]}
          onSave={async (values) => {
            const res = await fetch("/api/grade-bands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "band",
                name: values.name,
                displayName: values.displayName,
                sortOrder: values.sortOrder ? Number(values.sortOrder) : undefined,
              }),
            })
            if (!res.ok) {
              const d = await res.json()
              throw new Error(d.error)
            }
            onRefresh()
          }}
          onClose={() => setShowAddBandModal(false)}
        />
      )}

      {showAddGradeModal && (
        <FormModal
          title={`Add Grade to ${gradeBands.find((b) => b.id === showAddGradeModal)?.displayName}`}
          fields={[
            { key: "name", label: "Grade Name", placeholder: "e.g. Grade 1, Kindergarten, AP Calculus" },
            { key: "shortName", label: "Short Name", placeholder: "e.g. 1, K, AP-Calc" },
            { key: "sortOrder", label: "Sort Order", type: "number", placeholder: "0" },
          ]}
          onSave={async (values) => {
            const res = await fetch("/api/grade-bands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "grade",
                gradeBandId: showAddGradeModal,
                name: values.name,
                shortName: values.shortName,
                sortOrder: values.sortOrder ? Number(values.sortOrder) : undefined,
              }),
            })
            if (!res.ok) {
              const d = await res.json()
              throw new Error(d.error)
            }
            onRefresh()
          }}
          onClose={() => setShowAddGradeModal(null)}
        />
      )}

      {editBand && (
        <FormModal
          title={`Edit ${editBand.displayName}`}
          fields={[
            { key: "displayName", label: "Display Name", defaultValue: editBand.displayName },
            {
              key: "sortOrder",
              label: "Sort Order",
              type: "number",
              defaultValue: String(editBand.sortOrder),
            },
          ]}
          onSave={async (values) => {
            const res = await fetch("/api/grade-bands", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "band",
                id: editBand.id,
                displayName: values.displayName,
                sortOrder: Number(values.sortOrder),
              }),
            })
            if (!res.ok) {
              const d = await res.json()
              throw new Error(d.error)
            }
            onRefresh()
          }}
          onClose={() => setEditBand(null)}
        />
      )}

      {editGrade && (
        <FormModal
          title={`Edit ${editGrade.name}`}
          fields={[
            { key: "name", label: "Grade Name", defaultValue: editGrade.name },
            { key: "shortName", label: "Short Name", defaultValue: editGrade.shortName },
            {
              key: "sortOrder",
              label: "Sort Order",
              type: "number",
              defaultValue: String(editGrade.sortOrder),
            },
          ]}
          onSave={async (values) => {
            const res = await fetch("/api/grade-bands", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "grade",
                id: editGrade.id,
                name: values.name,
                shortName: values.shortName,
                sortOrder: Number(values.sortOrder),
              }),
            })
            if (!res.ok) {
              const d = await res.json()
              throw new Error(d.error)
            }
            onRefresh()
          }}
          onClose={() => setEditGrade(null)}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Tab 2: Rate Matrix
   ══════════════════════════════════════════════════════════ */

function RateMatrixTab({
  rates,
  teachers,
  subjects,
  gradeBands,
  onRefresh,
}: {
  rates: RateItem[]
  teachers: TeacherOption[]
  subjects: SubjectOption[]
  gradeBands: GradeBandItem[]
  onRefresh: () => void
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRate, setEditRate] = useState<RateItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterTeacher, setFilterTeacher] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [filterBand, setFilterBand] = useState("")
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all")
  const [showCompRates, setShowCompRates] = useState(true)

  const filtered = useMemo(() => {
    return rates.filter((r) => {
      if (filterTeacher && r.teacherId !== filterTeacher) return false
      if (filterSubject && r.subjectId !== filterSubject) return false
      if (filterBand && r.gradeBandId !== filterBand) return false
      if (filterActive === "active" && !r.isActive) return false
      if (filterActive === "inactive" && r.isActive) return false
      return true
    })
  }, [rates, filterTeacher, filterSubject, filterBand, filterActive])

  const handleToggle = async (rate: RateItem) => {
    setActionLoading(rate.id)
    try {
      const res = await fetch("/api/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rate.id, isActive: !rate.isActive }),
      })
      if (res.ok) onRefresh()
      else {
        const d = await res.json()
        alert(d.error)
      }
    } catch {
      alert("Network error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (rate: RateItem) => {
    if (
      !confirm(
        `Deactivate rate for ${rate.teacherName} → ${rate.subjectName} → ${rate.gradeBandDisplayName}?`
      )
    )
      return
    setActionLoading(rate.id)
    try {
      const res = await fetch(`/api/pricing?id=${rate.id}`, { method: "DELETE" })
      if (res.ok) onRefresh()
      else {
        const d = await res.json()
        alert(d.error)
      }
    } catch {
      alert("Network error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportCSV = () => {
    const header =
      "Teacher,Email,Subject,Grade Band,Compensation Rate,Student Rate,Margin,Status"
    const rows = filtered.map(
      (r) =>
        `"${r.teacherName}","${r.teacherEmail}","${r.subjectName}","${r.gradeBandDisplayName}",${r.compensationRate},${r.studentFacingRate},${(r.studentFacingRate - r.compensationRate).toFixed(2)},${r.isActive ? "Active" : "Inactive"}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pricing-matrix-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: "teacherName",
      label: "Teacher",
      sortable: true,
      render: (row: RateItem) => (
        <div>
          <p className="font-medium text-[#1E293B] text-sm">{row.teacherName}</p>
          <p className="text-[10px] text-gray-400">{row.teacherEmail}</p>
        </div>
      ),
    },
    {
      key: "subjectName",
      label: "Subject",
      sortable: true,
      render: (row: RateItem) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20">
          {row.subjectName}
        </span>
      ),
    },
    {
      key: "gradeBandName",
      label: "Grade Band",
      sortable: true,
      render: (row: RateItem) => (
        <BandBadge name={row.gradeBandName} displayName={row.gradeBandDisplayName} />
      ),
    },
    ...(showCompRates
      ? [
          {
            key: "compensationRate",
            label: "Comp. Rate",
            sortable: true,
            render: (row: RateItem) => (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                🔒 ${row.compensationRate.toFixed(2)}/hr
              </span>
            ),
          },
        ]
      : []),
    {
      key: "studentFacingRate",
      label: "Student Rate",
      sortable: true,
      render: (row: RateItem) => (
        <span className="font-bold text-[#0D9488] text-sm">
          ${row.studentFacingRate.toFixed(2)}/hr
        </span>
      ),
    },
    {
      key: "margin",
      label: "Margin",
      render: (row: RateItem) => {
        const margin = row.studentFacingRate - row.compensationRate
        const pct =
          row.studentFacingRate > 0
            ? ((margin / row.studentFacingRate) * 100).toFixed(0)
            : "0"
        return (
          <span
            className={`text-xs font-medium ${
              margin > 0 ? "text-green-600" : margin < 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            ${margin.toFixed(2)} ({pct}%)
          </span>
        )
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: RateItem) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} size="sm" />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: RateItem) => {
        const isLoading = actionLoading === row.id
        return (
          <div className="flex items-center gap-0.5">
            <button
              title="Edit"
              onClick={() => setEditRate(row)}
              disabled={isLoading}
              className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              title={row.isActive ? "Deactivate" : "Activate"}
              onClick={() => handleToggle(row)}
              disabled={isLoading}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                row.isActive
                  ? "text-[#0D9488] hover:bg-teal-50"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : row.isActive ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              title="Deactivate"
              onClick={() => handleDelete(row)}
              disabled={isLoading}
              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">Rate Matrix</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Set pricing per teacher × subject × grade band combination
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompRates(!showCompRates)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              showCompRates
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {showCompRates ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Comp. Rates
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Rate
          </button>
        </div>
      </div>

      {/* Confidential Note */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-amber-600 text-lg leading-none mt-0.5">🔒</span>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Confidential:</span> Compensation rates are visible to
          Admins only. Student-facing rates determine what parents pay during booking.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        >
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterBand}
          onChange={(e) => setFilterBand(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        >
          <option value="">All Grade Bands</option>
          {gradeBands
            .filter((b) => b.isActive)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.displayName}
              </option>
            ))}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "active", "inactive"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setFilterActive(val)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterActive === val
                  ? "bg-white text-[#1E3A5F] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {val.charAt(0).toUpperCase() + val.slice(1)}
            </button>
          ))}
        </div>
        {(filterTeacher || filterSubject || filterBand || filterActive !== "all") && (
          <button
            onClick={() => {
              setFilterTeacher("")
              setFilterSubject("")
              setFilterBand("")
              setFilterActive("all")
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search by teacher, subject, or grade band..."
        pageSize={25}
      />

      {/* Add Rate Modal */}
      {showAddModal && (
        <AddRateModal
          teachers={teachers}
          subjects={subjects}
          gradeBands={gradeBands}
          existingRates={rates}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            onRefresh()
          }}
        />
      )}

      {/* Edit Rate Modal */}
      {editRate && (
        <EditRateModal
          rate={editRate}
          onClose={() => setEditRate(null)}
          onSuccess={() => {
            setEditRate(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Tab 3: Rate Overview
   ══════════════════════════════════════════════════════════ */

function RateOverviewTab({
  rates,
  gradeBands,
  teachers,
  subjects,
}: {
  rates: RateItem[]
  gradeBands: GradeBandItem[]
  teachers: TeacherOption[]
  subjects: SubjectOption[]
}) {
  const activeRates = rates.filter((r) => r.isActive)
  const activeBands = gradeBands.filter((b) => b.isActive)

  // Build lookup map
  const rateMap = new Map<string, RateItem>()
  activeRates.forEach((r) => {
    rateMap.set(`${r.teacherId}-${r.subjectId}-${r.gradeBandId}`, r)
  })

  // Teachers who have at least one active rate
  const teacherIds = [...new Set(activeRates.map((r) => r.teacherId))]
  const ratedTeachers = teachers.filter((t) => teacherIds.includes(t.id))

  // Subjects that have at least one rate
  const ratedSubjectIds = [...new Set(activeRates.map((r) => r.subjectId))]
  const ratedSubjects = subjects.filter((s) => ratedSubjectIds.includes(s.id))

  // Missing combos: teacher is assigned a subject but has no rate for at least one active band
  const missingCombos: { teacherName: string; subjectName: string; bandName: string }[] = []
  ratedTeachers.forEach((teacher) => {
    const teacherSubjectIds = teacher.subjects.map((s) => s.id)
    teacherSubjectIds.forEach((subId) => {
      // Only check subjects that have at least one rate already (i.e. the teacher actively teaches)
      const hasAnyRate = activeRates.some(
        (r) => r.teacherId === teacher.id && r.subjectId === subId
      )
      if (!hasAnyRate) return

      activeBands.forEach((band) => {
        const key = `${teacher.id}-${subId}-${band.id}`
        if (!rateMap.has(key)) {
          const subName = subjects.find((s) => s.id === subId)?.name || subId
          missingCombos.push({
            teacherName: teacher.name,
            subjectName: subName,
            bandName: band.displayName,
          })
        }
      })
    })
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1E293B]">Rate Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Visual summary of configured rates across teachers, subjects, and grade bands
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Teachers Configured
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">
            {ratedTeachers.length}
            <span className="text-sm font-normal text-gray-400"> / {teachers.length}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Subjects Covered
          </p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">
            {ratedSubjects.length}
            <span className="text-sm font-normal text-gray-400"> / {subjects.length}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Active Rates</p>
          <p className="text-2xl font-bold text-[#0D9488] mt-1">{activeRates.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Missing Combos
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              missingCombos.length > 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            {missingCombos.length}
          </p>
        </div>
      </div>

      {/* Rate Grid: Per-band breakdown */}
      {activeBands.map((band) => {
        const bandRates = activeRates.filter((r) => r.gradeBandId === band.id)
        if (bandRates.length === 0) return null

        const bandTeacherIds = [...new Set(bandRates.map((r) => r.teacherId))]
        const avgStudent =
          bandRates.reduce((s, r) => s + r.studentFacingRate, 0) / bandRates.length
        const avgComp = bandRates.reduce((s, r) => s + r.compensationRate, 0) / bandRates.length
        const minStudent = Math.min(...bandRates.map((r) => r.studentFacingRate))
        const maxStudent = Math.max(...bandRates.map((r) => r.studentFacingRate))

        return (
          <div
            key={band.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BandBadge name={band.name} displayName={band.displayName} />
                <span className="text-xs text-gray-400">
                  {bandRates.length} rate{bandRates.length !== 1 ? "s" : ""} ·{" "}
                  {bandTeacherIds.length} teacher{bandTeacherIds.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">
                  Student: ${minStudent.toFixed(2)}–${maxStudent.toFixed(2)}/hr
                </span>
                <span className="text-gray-500">Avg: ${avgStudent.toFixed(2)}/hr</span>
                <span className="text-amber-600">
                  🔒 Avg Comp: ${avgComp.toFixed(2)}/hr
                </span>
              </div>
            </div>

            <div className="px-5 py-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left py-2 font-medium">Teacher</th>
                    <th className="text-left py-2 font-medium">Subject</th>
                    <th className="text-right py-2 font-medium">🔒 Comp.</th>
                    <th className="text-right py-2 font-medium">Student</th>
                    <th className="text-right py-2 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {bandRates.map((r) => {
                    const margin = r.studentFacingRate - r.compensationRate
                    return (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="py-2 font-medium text-[#1E293B]">{r.teacherName}</td>
                        <td className="py-2 text-gray-600">{r.subjectName}</td>
                        <td className="py-2 text-right text-amber-700 font-medium">
                          ${r.compensationRate.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-[#0D9488] font-bold">
                          ${r.studentFacingRate.toFixed(2)}
                        </td>
                        <td
                          className={`py-2 text-right font-medium ${
                            margin > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${margin.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Missing Combos */}
      {missingCombos.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">
                Missing Rate Configurations ({missingCombos.length})
              </h3>
            </div>
            <p className="text-xs text-amber-600 mt-0.5">
              These teacher-subject combinations are missing rates for some grade bands. Add rates in
              the Rate Matrix tab.
            </p>
          </div>
          <div className="px-5 py-3 max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left py-2 font-medium">Teacher</th>
                  <th className="text-left py-2 font-medium">Subject</th>
                  <th className="text-left py-2 font-medium">Missing Band</th>
                </tr>
              </thead>
              <tbody>
                {missingCombos.slice(0, 20).map((m, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-1.5 text-[#1E293B]">{m.teacherName}</td>
                    <td className="py-1.5 text-gray-600">{m.subjectName}</td>
                    <td className="py-1.5 text-amber-600 font-medium">{m.bandName}</td>
                  </tr>
                ))}
                {missingCombos.length > 20 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-xs text-gray-400 text-center">
                      +{missingCombos.length - 20} more missing combinations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeRates.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No active rates configured yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Switch to the Rate Matrix tab to add teacher-subject-grade band rates.
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */

export function PricingClient({
  gradeBands,
  rates,
  teachers,
  subjects,
  kpis,
}: {
  gradeBands: GradeBandItem[]
  rates: RateItem[]
  teachers: TeacherOption[]
  subjects: SubjectOption[]
  kpis: KPIs
}) {
  const [activeTab, setActiveTab] = useState<"bands" | "matrix" | "overview">("matrix")

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Pricing Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure grade bands, set teacher rates, and review pricing across the platform
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <MiniKPI
          label="Total Rates"
          value={kpis.totalRates}
          subValue={`${kpis.activeRates} active`}
          icon={DollarSign}
          iconClass="text-teal-400"
        />
        <MiniKPI
          label="Teachers Configured"
          value={`${kpis.teachersConfigured} / ${kpis.totalTeachers}`}
          icon={Users}
          valueClass={kpis.teachersConfigured < kpis.totalTeachers ? "text-amber-600" : "text-[#22C55E]"}
          iconClass="text-blue-400"
        />
        <MiniKPI
          label="Subjects Covered"
          value={`${kpis.subjectsCovered} / ${kpis.totalSubjects}`}
          icon={BookOpen}
          valueClass={kpis.subjectsCovered < kpis.totalSubjects ? "text-amber-600" : "text-[#22C55E]"}
          iconClass="text-purple-400"
        />
        <MiniKPI
          label="Grade Bands"
          value={gradeBands.filter((b) => b.isActive).length}
          subValue={`${gradeBands.reduce((sum, b) => sum + b.grades.length, 0)} total grades`}
          icon={GraduationCap}
          iconClass="text-green-400"
        />
        <MiniKPI
          label="Avg. Margin"
          value={`$${kpis.avgMargin.toFixed(2)}/hr`}
          icon={TrendingUp}
          valueClass={kpis.avgMargin > 0 ? "text-[#22C55E]" : "text-red-500"}
          iconClass="text-green-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "bands" as const, label: "Grade Bands & Grades" },
          { key: "matrix" as const, label: `Rate Matrix (${kpis.activeRates})` },
          { key: "overview" as const, label: "Rate Overview" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-[#1E3A5F] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "bands" && (
        <GradeBandsTab gradeBands={gradeBands} onRefresh={handleRefresh} />
      )}

      {activeTab === "matrix" && (
        <RateMatrixTab
          rates={rates}
          teachers={teachers}
          subjects={subjects}
          gradeBands={gradeBands}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === "overview" && (
        <RateOverviewTab
          rates={rates}
          gradeBands={gradeBands}
          teachers={teachers}
          subjects={subjects}
        />
      )}
    </div>
  )
}
