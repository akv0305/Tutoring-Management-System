"use client"

import React, { useState } from "react"
import { Plus, Pencil, ToggleRight, ToggleLeft, X, Loader2, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

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

type Subject = Record<string, unknown> & {
  id: string
  subjectName: string
  category: string
  activeTeachers: number
  activeStudents: number
  basePrice: string
  status: string
}

/* ─── Add Subject Modal ─── */

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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Biology"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base Price ($/hr)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="e.g. 30"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
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

/* ─── Edit Subject Modal ─── */

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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base Price ($/hr)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
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

/* ─── Main Component ─── */

export function SubjectsClient({ subjects }: { subjects: Subject[] }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const handleCreated = () => { setShowAddModal(false); window.location.reload() }
  const handleEdited = () => { setEditSubject(null); window.location.reload() }

  const handleToggle = async (subject: Subject) => {
    setToggling(subject.id)
    try {
      const newStatus = subject.status === "active" ? "INACTIVE" : "ACTIVE"
      const res = await fetch("/api/subjects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subject.id, status: newStatus }),
      })
      if (res.ok) {
        window.location.reload()
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
      render: (row: Subject) => {
        const isToggling = toggling === row.id
        return (
          <div className="flex items-center gap-1">
            <button
              title="Edit"
              onClick={() => setEditSubject(row)}
              className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              title={row.status === "active" ? "Deactivate" : "Activate"}
              onClick={() => handleToggle(row)}
              disabled={isToggling}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                row.status === "active"
                  ? "text-[#0D9488] hover:bg-teal-50"
                  : "text-gray-400 hover:bg-gray-50"
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Subject Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={subjects as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search subjects..."
        pageSize={10}
      />

      {/* Modals */}
      {showAddModal && (
        <AddSubjectModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCreated}
        />
      )}

      {editSubject && (
        <EditSubjectModal
          subject={editSubject}
          onClose={() => setEditSubject(null)}
          onSuccess={handleEdited}
        />
      )}
    </div>
  )
}
