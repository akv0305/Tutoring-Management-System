"use client"

import React, { useState } from "react"
import { X, Package, Loader2 } from "lucide-react"

type SubjectOption = { id: string; name: string }

export function CreatePackageTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  subjects,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subjects: SubjectOption[]
}) {
  const [name, setName] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [classesIncluded, setClassesIncluded] = useState("")
  const [validityDays, setValidityDays] = useState("")
  const [suggestedPrice, setSuggestedPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isPopular, setIsPopular] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setSubjectId("")
      setClassesIncluded("")
      setValidityDays("")
      setSuggestedPrice("")
      setDescription("")
      setIsPopular(false)
      setError("")
      setSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    setError("")
    if (!name.trim() || !subjectId || !classesIncluded || !validityDays || !suggestedPrice) {
      setError("Name, subject, classes, validity, and suggested price are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/package-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subjectId,
          classesIncluded: parseInt(classesIncluded),
          validityDays: parseInt(validityDays),
          suggestedPrice: parseFloat(suggestedPrice),
          description: description.trim() || undefined,
          isPopular,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create template")
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0D9488]" />
            <h2 className="text-lg font-bold text-[#1E293B]">Create Package Template</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              placeholder="e.g. Math Pro — 20 Classes"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Classes + Validity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Classes Included *</label>
              <input
                type="number"
                min="1"
                value={classesIncluded}
                onChange={(e) => setClassesIncluded(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Validity (days) *</label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="e.g. 90"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Suggested Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={suggestedPrice}
              onChange={(e) => setSuggestedPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              placeholder="e.g. 800.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
              placeholder="Optional description…"
            />
          </div>

          {/* Popular toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-10 h-5 rounded-full flex items-center transition-colors ${
                isPopular ? "bg-[#0D9488]" : "bg-gray-200"
              }`}
              onClick={() => setIsPopular(!isPopular)}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                  isPopular ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm text-gray-700">Mark as Popular</span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Template created successfully!
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
            disabled={submitting || success}
            className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating…" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  )
}
