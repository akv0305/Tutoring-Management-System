"use client"

import React, { useState, useEffect } from "react"
import { X, UserPlus, Loader2 } from "lucide-react"

type DropdownData = {
  parents: { id: string; email: string; name: string }[]
  coordinators: { id: string; name: string }[]
  subjects: { id: string; name: string; category: string }[]
}

export function AddStudentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null)
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [grade, setGrade] = useState("")
  const [school, setSchool] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [coordinatorId, setCoordinatorId] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [timezone, setTimezone] = useState("America/New_York")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && !dropdownData) {
      setLoadingDropdowns(true)
      fetch("/api/admin/dropdown-data")
        .then((r) => r.json())
        .then((data) => setDropdownData(data))
        .catch(() => setError("Failed to load form data"))
        .finally(() => setLoadingDropdowns(false))
    }
  }, [isOpen, dropdownData])

  useEffect(() => {
    if (isOpen) {
      setFirstName("")
      setLastName("")
      setGrade("")
      setSchool("")
      setParentEmail("")
      setCoordinatorId("")
      setSelectedSubjects([])
      setTimezone("America/New_York")
      setError("")
      setSuccess(false)
    }
  }, [isOpen])

  const toggleSubject = (name: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    )
  }

  const handleSubmit = async () => {
    setError("")
    if (!firstName.trim() || !lastName.trim() || !grade.trim() || !parentEmail.trim()) {
      setError("First name, last name, grade, and parent email are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          grade: grade.trim(),
          school: school.trim() || undefined,
          parentEmail: parentEmail.trim(),
          coordinatorId: coordinatorId || undefined,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          timezone,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create student")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#0D9488]" />
            <h2 className="text-lg font-bold text-[#1E293B]">Add New Student</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loadingDropdowns ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#0D9488]" />
              <span className="ml-2 text-sm text-gray-500">Loading form data…</span>
            </div>
          ) : (
            <>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    placeholder="e.g. Aarav"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    placeholder="e.g. Patel"
                  />
                </div>
              </div>

              {/* Grade + School */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  >
                    <option value="">Select grade</option>
                    {["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
                      <option key={g} value={g}>
                        {g === "K" ? "Kindergarten" : `Grade ${g}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">School</label>
                  <input
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Parent email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Email *</label>
                <input
                  list="parentEmails"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  placeholder="Search or type parent email…"
                />
                <datalist id="parentEmails">
                  {dropdownData?.parents.map((p) => (
                    <option key={p.id} value={p.email}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Coordinator */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assign Coordinator</label>
                <select
                  value={coordinatorId}
                  onChange={(e) => setCoordinatorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                >
                  <option value="">Auto-assign (most available)</option>
                  {dropdownData?.coordinators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subjects</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {dropdownData?.subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedSubjects.includes(s.name)
                          ? "bg-[#0D9488] text-white border-[#0D9488]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#0D9488]/50"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Student created successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || success || loadingDropdowns}
            className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating…" : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  )
}
