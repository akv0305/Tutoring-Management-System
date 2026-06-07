"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Pencil,
  ToggleRight,
  ToggleLeft,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ══════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════ */

const CATEGORY_OPTIONS = [
  "MATH",
  "SCIENCE",
  "ENGLISH",
  "TEST_PREP",
  "COMPUTER_SCIENCE",
  "LANGUAGES",
  "OTHER",
]

const CATEGORY_LABELS: Record<string, string> = {
  MATH: "Math",
  SCIENCE: "Science",
  ENGLISH: "English",
  TEST_PREP: "Test Prep",
  COMPUTER_SCIENCE: "Computer Science",
  LANGUAGES: "Languages",
  OTHER: "Other",
}

const CATEGORY_STYLES: Record<string, string> = {
  "MATH":             "bg-blue-100 text-blue-700 border-blue-200",
  "SCIENCE":          "bg-purple-100 text-purple-700 border-purple-200",
  "ENGLISH":          "bg-indigo-100 text-indigo-700 border-indigo-200",
  "TEST PREP":        "bg-orange-100 text-orange-700 border-orange-200",
  "COMPUTER SCIENCE": "bg-teal-100 text-teal-700 border-teal-200",
  "LANGUAGES":        "bg-pink-100 text-pink-700 border-pink-200",
  "OTHER":            "bg-gray-100 text-gray-600 border-gray-200",
}

/* ══════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════ */

type Subject = Record<string, unknown> & {
  id: string
  subjectName: string
  category: string
  activeTeachers: number
  activeStudents: number
  basePrice: string
  status: string
}

type GradeItem = {
  id: string
  name: string
  shortName: string
  sortOrder: number
  isActive: boolean
  gradeBandId: string
  studentCount: number
}

type GradeBandItem = {
  id: string
  name: string
  displayName: string
  description: string
  sortOrder: number
  isActive: boolean
  rateCount: number
  grades: GradeItem[]
}

/* ══════════════════════════════════════════════════════════
   Add Subject Modal
   ══════════════════════════════════════════════════════════ */

function AddSubjectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("MATH")
  const [basePrice, setBasePrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (!name.trim()) { setError("Subject name is required."); return }
    if (!basePrice || Number(basePrice) < 0) { setError("Valid base price is required."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          basePriceHour: Number(basePrice),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Creation failed"); return }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">Add Subject</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Biology"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base Price ($/hr)</label>
          <input type="number" step="0.01" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="e.g. 30"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating…" : "Create Subject"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Edit Subject Modal
   ══════════════════════════════════════════════════════════ */

function EditSubjectModal({
  subject,
  onClose,
  onSuccess,
}: {
  subject: Subject
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(subject.subjectName)
  const rawCat = subject.category.toUpperCase().replace(/ /g, "_")
  const [category, setCategory] = useState(CATEGORY_OPTIONS.includes(rawCat) ? rawCat : "OTHER")
  const [basePrice, setBasePrice] = useState(subject.basePrice.replace("$", "").replace("/hr", ""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (!name.trim()) { setError("Subject name is required."); return }
    if (!basePrice || Number(basePrice) < 0) { setError("Valid base price is required."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subject.id,
          name: name.trim(),
          category,
          basePriceHour: Number(basePrice),
        }),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">Edit Subject</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base Price ($/hr)</label>
          <input type="number" step="0.01" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Active Teachers</span>
            <span className="font-medium text-[#1E293B]">{subject.activeTeachers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Active Students</span>
            <span className="font-medium text-[#1E293B]">{subject.activeStudents}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Add Grade Band Modal
   ══════════════════════════════════════════════════════════ */

function AddGradeBandModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (!name.trim()) { setError("Band name is required."); return }
    if (!displayName.trim()) { setError("Display name is required."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/grade-bands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "band",
          name: name.trim(),
          displayName: displayName.trim(),
          description: description.trim() || undefined,
          sortOrder: sortOrder ? Number(sortOrder) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Creation failed"); return }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">Add Grade Band</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Band Name (Internal)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ELEMENTARY"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
          <p className="text-[10px] text-gray-400 mt-0.5">Used internally. Uppercase recommended.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Elementary (K-6)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Covers grades K through 6"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating…" : "Create Grade Band"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Edit Grade Band Modal
   ══════════════════════════════════════════════════════════ */

function EditGradeBandModal({
  band,
  onClose,
  onSuccess,
}: {
  band: GradeBandItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [displayName, setDisplayName] = useState(band.displayName)
  const [description, setDescription] = useState(band.description)
  const [sortOrder, setSortOrder] = useState(String(band.sortOrder))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (!displayName.trim()) { setError("Display name is required."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/grade-bands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "band",
          id: band.id,
          displayName: displayName.trim(),
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder),
        }),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">Edit {band.displayName}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Internal Name</span>
            <span className="font-medium text-[#1E293B] font-mono text-xs">{band.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Grades</span>
            <span className="font-medium text-[#1E293B]">{band.grades.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Active Rates</span>
            <span className="font-medium text-[#1E293B]">{band.rateCount}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Grade Band Card (with inline grade add/edit)
   ══════════════════════════════════════════════════════════ */

function GradeBandCard({
  band,
  isExpanded,
  onToggleExpand,
  onEditBand,
  onRefresh,
}: {
  band: GradeBandItem
  isExpanded: boolean
  onToggleExpand: () => void
  onEditBand: () => void
  onRefresh: () => void
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddGrade, setShowAddGrade] = useState(false)
  const [editGradeId, setEditGradeId] = useState<string | null>(null)

  // ── Add grade inline state ──
  const [newGradeName, setNewGradeName] = useState("")
  const [newGradeShortName, setNewGradeShortName] = useState("")
  const [newGradeSortOrder, setNewGradeSortOrder] = useState("")
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")

  // ── Edit grade inline state ──
  const [editGradeName, setEditGradeName] = useState("")
  const [editGradeShortName, setEditGradeShortName] = useState("")
  const [editGradeSortOrder, setEditGradeSortOrder] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")

  const handleToggleBand = async () => {
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

  const handleAddGrade = async () => {
    setAddError("")
    if (!newGradeName.trim()) { setAddError("Grade name is required."); return }
    if (!newGradeShortName.trim()) { setAddError("Short name is required."); return }
    setAddLoading(true)
    try {
      const res = await fetch("/api/grade-bands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "grade",
          gradeBandId: band.id,
          name: newGradeName.trim(),
          shortName: newGradeShortName.trim(),
          sortOrder: newGradeSortOrder ? Number(newGradeSortOrder) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error || "Creation failed"); return }
      setNewGradeName("")
      setNewGradeShortName("")
      setNewGradeSortOrder("")
      setShowAddGrade(false)
      onRefresh()
    } catch {
      setAddError("Network error")
    } finally {
      setAddLoading(false)
    }
  }

  const startEditGrade = (grade: GradeItem) => {
    setEditGradeId(grade.id)
    setEditGradeName(grade.name)
    setEditGradeShortName(grade.shortName)
    setEditGradeSortOrder(String(grade.sortOrder))
    setEditError("")
  }

  const handleEditGrade = async () => {
    setEditError("")
    if (!editGradeName.trim()) { setEditError("Grade name is required."); return }
    if (!editGradeShortName.trim()) { setEditError("Short name is required."); return }
    setEditLoading(true)
    try {
      const res = await fetch("/api/grade-bands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "grade",
          id: editGradeId,
          name: editGradeName.trim(),
          shortName: editGradeShortName.trim(),
          sortOrder: Number(editGradeSortOrder),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error || "Update failed"); return }
      setEditGradeId(null)
      onRefresh()
    } catch {
      setEditError("Network error")
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Band Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpand}
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
              <span className="text-[10px] text-gray-400 font-mono">({band.name})</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {band.grades.length} grade{band.grades.length !== 1 ? "s" : ""} · {band.rateCount} active rate{band.rateCount !== 1 ? "s" : ""}
              {band.description && <span> · {band.description}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button title="Edit" onClick={onEditBand}
            className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            title={band.isActive ? "Deactivate" : "Activate"}
            onClick={handleToggleBand}
            disabled={actionLoading === band.id}
            className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
              band.isActive ? "text-[#0D9488] hover:bg-teal-50" : "text-gray-400 hover:bg-gray-50"
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

      {/* Expanded Grades */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {band.grades.length === 0 && !showAddGrade ? (
            <p className="text-sm text-gray-400 text-center py-3">
              No grades in this band yet. Click the button below to add one.
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {/* Column Header */}
              <div className="grid grid-cols-[1fr_80px_80px_100px] gap-3 px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                <span>Grade Name</span>
                <span>Short Name</span>
                <span>Sort Order</span>
                <span className="text-right">Actions</span>
              </div>

              {band.grades.map((grade) => (
                <div key={grade.id}>
                  {editGradeId === grade.id ? (
                    /* ── Inline Edit Form ── */
                    <div className="border border-[#0D9488]/30 bg-teal-50/30 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-[1fr_80px_80px] gap-3">
                        <input value={editGradeName} onChange={(e) => setEditGradeName(e.target.value)} placeholder="Grade Name"
                          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                        <input value={editGradeShortName} onChange={(e) => setEditGradeShortName(e.target.value)} placeholder="Short"
                          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                        <input type="number" value={editGradeSortOrder} onChange={(e) => setEditGradeSortOrder(e.target.value)} placeholder="0"
                          className="px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                      </div>
                      {editError && (
                        <p className="text-xs text-red-600">{editError}</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={handleEditGrade} disabled={editLoading}
                          className="px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
                          {editLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save
                        </button>
                        <button onClick={() => setEditGradeId(null)} disabled={editLoading}
                          className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Grade Row ── */
                    <div className={`grid grid-cols-[1fr_80px_80px_100px] gap-3 items-center px-3 py-2 rounded-lg border transition-colors ${
                      grade.isActive
                        ? "bg-white border-gray-200 hover:border-gray-300"
                        : "bg-gray-50 border-gray-100 opacity-60"
                    }`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1E293B] truncate">{grade.name}</p>
                        {grade.studentCount > 0 && (
                          <p className="text-[10px] text-gray-400">{grade.studentCount} student{grade.studentCount !== 1 ? "s" : ""}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{grade.shortName}</span>
                      <span className="text-xs text-gray-400">{grade.sortOrder}</span>
                      <div className="flex items-center justify-end gap-0.5">
                        <button title="Edit" onClick={() => startEditGrade(grade)}
                          className="p-1 rounded text-gray-400 hover:text-[#F59E0B] hover:bg-amber-50 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          title={grade.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleGrade(grade)}
                          disabled={actionLoading === grade.id}
                          className={`p-1 rounded transition-colors disabled:opacity-50 ${
                            grade.isActive ? "text-[#0D9488] hover:bg-teal-50" : "text-gray-400 hover:bg-gray-50"
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
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline Add Grade Form */}
          {showAddGrade ? (
            <div className="border border-[#0D9488]/30 bg-teal-50/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-[#0D9488]">Add Grade to {band.displayName}</p>
              <div className="grid grid-cols-[1fr_80px_80px] gap-3">
                <input value={newGradeName} onChange={(e) => setNewGradeName(e.target.value)} placeholder="Grade Name (e.g. Grade 1)"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input value={newGradeShortName} onChange={(e) => setNewGradeShortName(e.target.value)} placeholder="Short (e.g. 1)"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="number" value={newGradeSortOrder} onChange={(e) => setNewGradeSortOrder(e.target.value)} placeholder="Sort"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
              </div>
              {addError && (
                <p className="text-xs text-red-600">{addError}</p>
              )}
              <div className="flex gap-2">
                <button onClick={handleAddGrade} disabled={addLoading}
                  className="px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
                  {addLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Add Grade
                </button>
                <button onClick={() => { setShowAddGrade(false); setAddError("") }} disabled={addLoading}
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddGrade(true)}
              className="inline-flex items-center gap-1.5 text-sm text-[#0D9488] font-medium hover:text-teal-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Grade to {band.displayName}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */

export function SubjectsClient({
  subjects,
  gradeBands,
}: {
  subjects: Subject[]
  gradeBands: GradeBandItem[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"subjects" | "grades">("subjects")
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  // Grade bands tab state
  const [showAddBandModal, setShowAddBandModal] = useState(false)
  const [editBand, setEditBand] = useState<GradeBandItem | null>(null)
  const [expandedBand, setExpandedBand] = useState<string | null>(gradeBands[0]?.id || null)

  const handleRefresh = () => {
    router.refresh()
  }

  const handleSubjectCreated = () => { setShowAddSubjectModal(false); router.refresh() }
  const handleSubjectEdited = () => { setEditSubject(null); router.refresh() }
  const handleBandCreated = () => { setShowAddBandModal(false); router.refresh() }
  const handleBandEdited = () => { setEditBand(null); router.refresh() }

  const handleToggleSubject = async (subject: Subject) => {
    setToggling(subject.id)
    try {
      const newStatus = subject.status === "active" ? "INACTIVE" : "ACTIVE"
      const res = await fetch("/api/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subject.id, status: newStatus }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || "Toggle failed")
      }
    } catch {
      alert("Network error")
    } finally {
      setToggling(null)
    }
  }

  // ── Subject table columns ──
  const subjectColumns = [
    {
      key: "subjectName",
      label: "Subject Name",
      sortable: true,
      render: (row: Subject) => <span className="font-medium text-[#1E293B]">{row.subjectName}</span>,
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
      render: (row: Subject) => <span className="font-semibold text-[#1E293B]">{row.activeTeachers}</span>,
    },
    {
      key: "activeStudents",
      label: "Active Students",
      sortable: true,
      render: (row: Subject) => <span className="font-semibold text-[#1E293B]">{row.activeStudents}</span>,
    },
    {
      key: "basePrice",
      label: "Base Price/Hr",
      sortable: true,
      render: (row: Subject) => <span className="font-semibold text-[#0D9488]">{row.basePrice}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: Subject) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Subject) => {
        const isToggling = toggling === row.id
        return (
          <div className="flex items-center gap-1">
            <button title="Edit" onClick={() => setEditSubject(row)}
              className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              title={row.status === "active" ? "Deactivate" : "Activate"}
              onClick={() => handleToggleSubject(row)}
              disabled={isToggling}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                row.status === "active" ? "text-[#0D9488] hover:bg-teal-50" : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : row.status === "active" ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )
      },
    },
  ]

  // ── KPIs for Grades tab ──
  const totalGrades = gradeBands.reduce((sum, b) => sum + b.grades.length, 0)
  const totalStudentsInGrades = gradeBands.reduce(
    (sum, b) => sum + b.grades.reduce((gs, g) => gs + g.studentCount, 0), 0
  )

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Subjects & Grades</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage subjects, grade bands, and individual grades
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "subjects"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab("grades")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "grades"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Grade Bands & Grades ({gradeBands.length})
        </button>
      </div>

      {/* ═══════════ Subjects Tab ═══════════ */}
      {activeTab === "subjects" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          <DataTable
            columns={subjectColumns as Parameters<typeof DataTable>[0]["columns"]}
            data={subjects as unknown as Record<string, unknown>[]}
            searchable
            searchPlaceholder="Search subjects..."
            pageSize={10}
          />
        </div>
      )}

      {/* ═══════════ Grade Bands & Grades Tab ═══════════ */}
      {activeTab === "grades" && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Grade Bands</p>
                <Layers className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-[#1E293B]">
                {gradeBands.filter((b) => b.isActive).length}
                <span className="text-sm font-normal text-gray-400"> / {gradeBands.length}</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Grades</p>
                <GraduationCap className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-[#1E293B]">{totalGrades}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Students Linked</p>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-[#1E293B]">{totalStudentsInGrades}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Layers className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Grade Bands</span> group individual grades for pricing tiers.
              For example, &quot;Elementary (K-6)&quot; contains grades Kindergarten through Grade 6.
              Pricing rates are set per grade band in{" "}
              <span className="font-medium">Admin &gt; Pricing</span>.
            </p>
          </div>

          {/* Add Band Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddBandModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Grade Band
            </button>
          </div>

          {/* Grade Band Cards */}
          {gradeBands.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No grade bands configured yet.</p>
              <p className="text-gray-400 text-xs mt-1">
                Create your first grade band to start organizing grades.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {gradeBands.map((band) => (
                <GradeBandCard
                  key={band.id}
                  band={band}
                  isExpanded={expandedBand === band.id}
                  onToggleExpand={() => setExpandedBand(expandedBand === band.id ? null : band.id)}
                  onEditBand={() => setEditBand(band)}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ Modals ═══════════ */}
      {showAddSubjectModal && (
        <AddSubjectModal
          onClose={() => setShowAddSubjectModal(false)}
          onSuccess={handleSubjectCreated}
        />
      )}

      {editSubject && (
        <EditSubjectModal
          subject={editSubject}
          onClose={() => setEditSubject(null)}
          onSuccess={handleSubjectEdited}
        />
      )}

      {showAddBandModal && (
        <AddGradeBandModal
          onClose={() => setShowAddBandModal(false)}
          onSuccess={handleBandCreated}
        />
      )}

      {editBand && (
        <EditGradeBandModal
          band={editBand}
          onClose={() => setEditBand(null)}
          onSuccess={handleBandEdited}
        />
      )}
    </div>
  )
}
