"use client"

import React, { useState, useEffect } from "react"
import { X, UserPlus, Loader2 } from "lucide-react"

type SubjectOption = { id: string; name: string; category: string }

export function AddTeacherModal({
  isOpen,
  onClose,
  onSuccess,
  subjects: subjectsProp,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subjects?: SubjectOption[]
}) {
  const [subjects, setSubjects] = useState<SubjectOption[]>(subjectsProp ?? [])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [qualification, setQualification] = useState("")
  const [bio, setBio] = useState("")
  const [experience, setExperience] = useState("")
  const [compensationRate, setCompensationRate] = useState("")
  const [studentFacingRate, setStudentFacingRate] = useState("")
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [timezone, setTimezone] = useState("America/New_York")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && !subjectsProp && subjects.length === 0) {
      setLoadingSubjects(true)
      fetch("/api/admin/dropdown-data")
        .then((r) => r.json())
        .then((data) => setSubjects(data.subjects ?? []))
        .catch(() => setError("Failed to load subjects"))
        .finally(() => setLoadingSubjects(false))
    }
    if (subjectsProp) setSubjects(subjectsProp)
  }, [isOpen, subjectsProp])

  useEffect(() => {
    if (isOpen) {
      setFirstName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setPhone("")
      setQualification("")
      setBio("")
      setExperience("")
      setCompensationRate("")
      setStudentFacingRate("")
      setSelectedSubjectIds([])
      setTimezone("America/New_York")
      setError("")
      setSuccess(false)
    }
  }, [isOpen])

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    setError("")
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("First name, last name, email, and password are required.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (!compensationRate || !studentFacingRate) {
      setError("Both compensation rate and student-facing rate are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          qualification: qualification.trim() || undefined,
          bio: bio.trim() || undefined,
          experience: experience ? parseInt(experience) : 0,
          compensationRate: parseFloat(compensationRate),
          studentFacingRate: parseFloat(studentFacingRate),
          subjectIds: selectedSubjectIds.length > 0 ? selectedSubjectIds : undefined,
          timezone,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create teacher")
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
            <UserPlus className="w-5 h-5 text-[#1E3A5F]" />
            <h2 className="text-lg font-bold text-[#1E293B]">Add New Teacher</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loadingSubjects ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#1E3A5F]" />
              <span className="ml-2 text-sm text-gray-500">Loading…</span>
            </div>
          ) : (
            <>
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="e.g. Sarah"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="e.g. Johnson"
                  />
                </div>
              </div>

              {/* Email + Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="teacher@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              {/* Phone + Qualification */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qualification</label>
                  <input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="e.g. M.Sc Mathematics"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] resize-none"
                  placeholder="Short professional bio…"
                />
              </div>

              {/* Experience + Rates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Experience (yrs)</label>
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Comp. Rate $/hr *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={compensationRate}
                    onChange={(e) => setCompensationRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Student Rate $/hr *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={studentFacingRate}
                    onChange={(e) => setStudentFacingRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
                    placeholder="40.00"
                  />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subjects</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedSubjectIds.includes(s.id)
                          ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#1E3A5F]/50"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
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
              Teacher created successfully!
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
            disabled={submitting || success || loadingSubjects}
            className="px-5 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating…" : "Add Teacher"}
          </button>
        </div>
      </div>
    </div>
  )
}
