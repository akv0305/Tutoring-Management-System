"use client"

import React, { useState, useEffect } from "react"
import { X, XCircle, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react"

export function CancelClassModal({
  open,
  onClose,
  onSuccess,
  classId,
  subject,
  teacherName,
  scheduledDate,
  scheduledTime,
  cancelledBy,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  classId: string
  subject: string
  teacherName: string
  scheduledDate: string
  scheduledTime: string
  cancelledBy: "student" | "teacher"
}) {
  const [policy, setPolicy] = useState<any>(null)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setReason("")
      setError("")
      setSuccess(false)
      setPolicy(null)
      setPolicyLoading(true)
      fetch(`/api/classes/policy?classId=${classId}&action=cancel`)
        .then((r) => r.json())
        .then((d) => setPolicy(d))
        .catch(() => {})
        .finally(() => setPolicyLoading(false))
    }
  }, [open, classId])

  async function handleCancel() {
    setError("")
    if (!reason.trim()) return setError("Please provide a reason for cancellation.")
    setLoading(true)
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: classId,
          action: cancelledBy === "student" ? "cancel_student" : "cancel_teacher",
          cancelReason: reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to cancel class")
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
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Cancel Class</h2>
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
            <p className="text-lg font-semibold text-[#1E293B] mt-3">Class Cancelled</p>
            <p className="text-sm text-gray-500 mt-1">The class has been cancelled successfully.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Class info */}
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                <strong>{scheduledDate}</strong> at <strong>{scheduledTime}</strong>
              </p>
            </div>

            {/* Policy */}
            {policyLoading && <p className="text-sm text-gray-400">Checking cancellation policy…</p>}

            {policy && policy.tier === "free" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {policy.message}
              </div>
            )}

            {policy && policy.tier === "late_fee" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Late Cancellation — {policy.feePercent}% fee</p>
                  <p className="mt-0.5">{policy.message}</p>
                  {policy.feeAmount > 0 && <p className="mt-1 font-semibold">Fee: ${policy.feeAmount}</p>}
                </div>
              </div>
            )}

            {policy && policy.tier === "hard_cutoff" && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Last-minute Cancellation — {policy.feePercent}% fee</p>
                  <p className="mt-0.5">{policy.message}</p>
                  {policy.feeAmount > 0 && <p className="mt-1 font-semibold">Fee: ${policy.feeAmount}</p>}
                </div>
              </div>
            )}

            {policy && !policy.allowed && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{policy.reason || policy.message}</p>
              </div>
            )}

            {policy && (
              <p className="text-xs text-gray-400">
                Class in {policy.hoursUntilClass?.toFixed(1)} hours
              </p>
            )}

            {/* Reason */}
            {policy && policy.allowed !== false && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for cancellation *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Please provide a reason…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {!success && policy && policy.allowed !== false && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Keep Class
            </button>
            <button onClick={handleCancel} disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Cancelling…</> : "Cancel Class"}
            </button>
          </div>
        )}
        {!success && policy && policy.allowed === false && (
          <div className="flex items-center justify-end p-5 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
