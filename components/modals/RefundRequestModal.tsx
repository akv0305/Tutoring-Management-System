"use client"

import React, { useState } from "react"
import { X, DollarSign, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface RefundRequestModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  paymentId: string
  studentId: string
  paymentAmount: number
  packageName: string
  paymentDate: string
}

export function RefundRequestModal({
  open,
  onClose,
  onSuccess,
  paymentId,
  studentId,
  paymentAmount,
  packageName,
  paymentDate,
}: RefundRequestModalProps) {
  const [refundType, setRefundType] = useState<"full" | "partial">("full")
  const [partialAmount, setPartialAmount] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const refundAmount =
    refundType === "full" ? paymentAmount : Number(partialAmount) || 0

  const handleSubmit = async () => {
    setError("")

    if (!reason.trim()) {
      setError("Please provide a reason for the refund request.")
      return
    }
    if (refundType === "partial") {
      if (!partialAmount || Number(partialAmount) <= 0) {
        setError("Please enter a valid partial refund amount.")
        return
      }
      if (Number(partialAmount) > paymentAmount) {
        setError(`Partial amount cannot exceed $${paymentAmount.toFixed(2)}.`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          studentId,
          refundAmount: refundAmount,
          reason: reason.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Refund request failed")
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (success) {
      onSuccess()
    }
    setRefundType("full")
    setPartialAmount("")
    setReason("")
    setError("")
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header — fixed */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-[#1E293B]">
            Request Refund
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#1E293B] mb-1">
                Refund Requested
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Amount:{" "}
                <span className="font-semibold">
                  ${refundAmount.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Your request is pending admin approval.
              </p>
            </div>
          ) : (
            <>
              {/* Payment info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Package</span>
                  <span className="font-medium text-[#1E293B]">
                    {packageName}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Payment Date</span>
                  <span className="text-gray-700">{paymentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-semibold text-[#1E293B]">
                    ${paymentAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Refund type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundType("full")
                      setPartialAmount("")
                    }}
                    className={[
                      "p-2.5 rounded-lg border text-sm font-medium transition-all",
                      refundType === "full"
                        ? "border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <DollarSign className="w-4 h-4 mx-auto mb-1" />
                    Full Refund
                    <div className="text-xs mt-0.5 opacity-75">
                      ${paymentAmount.toFixed(2)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType("partial")}
                    className={[
                      "p-2.5 rounded-lg border text-sm font-medium transition-all",
                      refundType === "partial"
                        ? "border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <DollarSign className="w-4 h-4 mx-auto mb-1" />
                    Partial Refund
                    <div className="text-xs mt-0.5 opacity-75">
                      Custom amount
                    </div>
                  </button>
                </div>
              </div>

              {/* Partial amount */}
              {refundType === "partial" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={paymentAmount}
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      placeholder={`Max ${paymentAmount.toFixed(2)}`}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Refund
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Please explain why you're requesting a refund..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] resize-none outline-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — fixed */}
        <div className="border-t p-4 shrink-0">
          {success ? (
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#1E3A5F]/90 transition-colors"
            >
              Done
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Request Refund
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
