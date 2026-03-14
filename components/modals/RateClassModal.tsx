"use client"

import React, { useState } from "react"
import { X, Star, Loader2, AlertTriangle, CheckCircle } from "lucide-react"

export function RateClassModal({
  open,
  onClose,
  onSuccess,
  classId,
  subject,
  teacherName,
  classDate,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  classId: string
  subject: string
  teacherName: string
  classDate: string
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleRate() {
    setError("")
    if (rating === 0) return setError("Please select a rating.")
    setLoading(true)
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: classId,
          action: "rate",
          parentRating: rating,
          parentFeedback: feedback || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to submit rating")
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

  const displayRating = hoverRating || rating

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Rate Class</h2>
              <p className="text-xs text-gray-500">{subject} with {teacherName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto" />
            <p className="text-lg font-semibold text-[#1E293B] mt-3">Thank you!</p>
            <p className="text-sm text-gray-500 mt-1">Your rating has been submitted.</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 text-center">
              {classDate}
            </div>

            {/* Star rating */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-3">How was the session?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= displayRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {displayRating === 1 && "Poor"}
                {displayRating === 2 && "Below Average"}
                {displayRating === 3 && "Average"}
                {displayRating === 4 && "Good"}
                {displayRating === 5 && "Excellent"}
              </p>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Share your thoughts about the session…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
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
              Skip
            </button>
            <button onClick={handleRate} disabled={loading || rating === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Rating"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
