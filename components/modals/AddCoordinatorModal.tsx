"use client"

import React, { useState, useEffect } from "react"
import { X, UserPlus, Loader2 } from "lucide-react"

export function AddCoordinatorModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [bucketSize, setBucketSize] = useState("50")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFirstName("")
      setLastName("")
      setEmail("")
      setPassword("")
      setPhone("")
      setBucketSize("50")
      setError("")
      setSuccess(false)
    }
  }, [isOpen])

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

    setSubmitting(true)
    try {
      const res = await fetch("/api/coordinators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          bucketSize: parseInt(bucketSize) || 50,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create coordinator")
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
            <UserPlus className="w-5 h-5 text-[#0D9488]" />
            <h2 className="text-lg font-bold text-[#1E293B]">Add New Coordinator</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="e.g. Priya"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="e.g. Menon"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              placeholder="coordinator@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              placeholder="Min 8 characters"
            />
          </div>

          {/* Phone + Bucket Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bucket Size</label>
              <input
                type="number"
                min="1"
                max="200"
                value={bucketSize}
                onChange={(e) => setBucketSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="50"
              />
              <p className="text-[10px] text-gray-400 mt-1">Max students this coordinator can manage</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Coordinator created successfully!
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
            {submitting ? "Creating…" : "Add Coordinator"}
          </button>
        </div>
      </div>
    </div>
  )
}
