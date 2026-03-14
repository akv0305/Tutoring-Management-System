"use client"

import React, { useState } from "react"
import { X, CheckCircle, Loader2, AlertTriangle, BookOpen } from "lucide-react"

export function CompleteClassModal({
  open,
  onClose,
  onSuccess,
  classId,
  subject,
  studentName,
  scheduledTime,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  classId: string
  subject: string
  studentName: string
  scheduledTime: string
}) {
  const [topicCovered, setTopicCovered] = useState("")
  const [sessionNotes, setSessionNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleComplete() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: classId,
          action: "complete",
          topicCovered: topicCovered || null,
          sessionNotes: sessionNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to complete class")
        return
      }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Complete Class</h2>
              <p className="text-xs text-gray-500">{subject} — {studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto" />
            <p className="text-lg font-semibold text-[#1E293B] mt-3">Class Completed!</p>
            <p className="text-sm text-gray-500 mt-1">Session has been marked as complete.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              Marking class at <strong>{scheduledTime}</strong> as completed.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic Covered</label>
              <input
                type="text"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
                placeholder="e.g. Quadratic equations, Chapter 5…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
                placeholder="How did the session go? Any homework assigned?"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
          </div>
        )}

        {!success && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleComplete} disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><CheckCircle className="w-4 h-4" />Mark Complete</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
