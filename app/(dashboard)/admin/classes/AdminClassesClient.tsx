"use client"

import React, { useState, useMemo } from "react"
import {
  Download,
  Eye,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Wallet,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  BookOpen,
  Star,
  FileText,
  Package,
  CreditCard,
  MessageSquareText,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ──────────────────── Types ──────────────────── */

type ClassRow = {
  id: string
  studentName: string
  studentId: string
  studentGrade: string
  parentName: string
  parentProfileId: string
  teacherName: string
  teacherId: string
  subject: string
  packageName: string
  orderRef: string
  scheduledAt: string
  date: string
  time: string
  duration: number
  status: string
  statusLower: string
  meetingLink: string
  topicCovered: string
  sessionNotes: string
  parentRating: number | null
  parentFeedback: string
  isTrial: boolean
  completedAt: string | null
  cancelReason: string
  calculatedCreditAmount: number
  calculatedDeductionAmount: number
}

type KPIs = {
  total: number
  completed: number
  scheduled: number
  pendingPayment: number
  cancelled: number
  noShow: number
  credited: number
}

type TeacherOption = { id: string; name: string }

/* ──────────────────── Mini KPI ──────────────────── */

function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-0.5">
        {label}
      </p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ──────────────────── Class Detail Modal ──────────────────── */

function ClassDetailModal({
  cls,
  onClose,
  onCreditClick,
  onConfirmPaymentClick,
  onRejectPaymentClick,
}: {
  cls: ClassRow
  onClose: () => void
  onCreditClick: () => void
  onConfirmPaymentClick: () => void
  onRejectPaymentClick: () => void
}) {
  const isCredited = cls.cancelReason.startsWith("[ADMIN CREDIT]")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between pr-8">
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">
                Class Details
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {cls.subject} — {cls.date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={cls.statusLower} size="sm" />
              {cls.isTrial && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                  TRIAL
                </span>
              )}
              {isCredited && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
                  CREDITED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.date}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.time}
                </p>
              </div>
            </div>
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Student</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.studentName}
                </p>
                <p className="text-xs text-gray-400">
                  Grade {cls.studentGrade} · Parent: {cls.parentName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Teacher</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.teacherName}
                </p>
              </div>
            </div>
          </div>

          {/* Package & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Package</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.packageName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Order Ref</p>
                <p className="text-sm font-mono font-medium text-[#1E3A5F]">
                  {cls.orderRef}
                </p>
              </div>
            </div>
          </div>

          {/* Topic / Notes */}
          {(cls.topicCovered || cls.sessionNotes) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {cls.topicCovered && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Topic Covered
                  </p>
                  <p className="text-sm text-[#1E293B] mt-0.5">
                    {cls.topicCovered}
                  </p>
                </div>
              )}
              {cls.sessionNotes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Session Notes
                  </p>
                  <p className="text-sm text-[#1E293B] mt-0.5 whitespace-pre-line">
                    {cls.sessionNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          {cls.parentRating && (
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Parent Rating
                </span>
              </div>
              <RatingStars rating={cls.parentRating} size="sm" />
              {cls.parentFeedback && (
                <p className="text-sm text-gray-600 mt-1.5 italic">
                  "{cls.parentFeedback}"
                </p>
              )}
            </div>
          )}

          {/* Credit note (if already credited) */}
          {isCredited && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-700 uppercase">
                  Admin Credit Applied
                </span>
              </div>
              <p className="text-xs text-orange-700 leading-relaxed">
                {cls.cancelReason.replace("[ADMIN CREDIT] ", "")}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {/* Confirm / Reject Payment — for PENDING_PAYMENT classes */}
            {cls.status === "PENDING_PAYMENT" && (
              <>
                <button
                  onClick={onConfirmPaymentClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirm Payment
                </button>
                <button
                  onClick={onRejectPaymentClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Payment
                </button>
              </>
            )}

            {/* Credit to Parent Wallet — for COMPLETED, non-credited classes */}
            {cls.status === "COMPLETED" && !isCredited && (
              <button
                onClick={onCreditClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F59E0B] text-[#1E293B] text-sm font-semibold hover:bg-amber-400 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                Credit to Parent Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Credit Class Modal ──────────────────── */

function CreditClassModal({
  cls,
  onClose,
  onSuccess,
}: {
  cls: ClassRow
  onClose: () => void
  onSuccess: (classId: string) => void
}) {
  const [creditAmount, setCreditAmount] = useState(
    String(cls.calculatedCreditAmount)
  )
  const [deductionAmount, setDeductionAmount] = useState(
    String(cls.calculatedDeductionAmount)
  )
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resultDetails, setResultDetails] = useState<any>(null)

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Reason is required for the audit trail.")
      return
    }
    const credit = parseFloat(creditAmount)
    const deduction = parseFloat(deductionAmount)
    if (isNaN(credit) || credit <= 0) {
      setError("Credit amount must be a positive number.")
      return
    }
    if (isNaN(deduction) || deduction <= 0) {
      setError("Deduction amount must be a positive number.")
      return
    }

    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/class-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          reason: reason.trim(),
          creditAmount: credit,
          deductionAmount: deduction,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply credit")
      }
      setResultDetails(data.details)
      setSuccess(true)
      onSuccess(cls.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-[#1E293B] mb-2">
            Credit Applied Successfully
          </h3>
          {resultDetails && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Parent Wallet Credit</span>
                <span className="font-semibold text-green-600">
                  {resultDetails.parentWalletCredit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teacher Payout Deduction</span>
                <span className="font-semibold text-red-600">
                  {resultDetails.teacherPayoutDeduction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">New Wallet Balance</span>
                <span className="font-semibold text-[#1E293B]">
                  {resultDetails.newParentWalletBalance}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-800">
              Credit Parent Wallet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Class info summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Student</span>
              <span className="font-medium text-[#1E293B]">
                {cls.studentName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Parent</span>
              <span className="font-medium text-[#1E293B]">
                {cls.parentName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Teacher</span>
              <span className="font-medium text-[#1E293B]">
                {cls.teacherName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Class</span>
              <span className="font-medium text-[#1E293B]">
                {cls.subject} — {cls.date} {cls.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-[#1E293B]">
                {cls.duration} min
              </span>
            </div>
          </div>

          {/* Editable amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit to Parent ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-green-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Calculated: ${cls.calculatedCreditAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deduct from Teacher ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Calculated: ${cls.calculatedDeductionAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquareText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error && e.target.value.trim()) setError("")
              }}
              placeholder='e.g., "Teacher did not take the class", "Parent complaint — class not conducted"'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This will credit the parent's wallet, deduct from the teacher's
              payout for this period, restore the package class slot, and notify
              both parties. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#F59E0B] hover:bg-amber-500 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Apply Credit
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Payment Action Modal ──────────────────── */

function PaymentActionModal({
  cls,
  action,
  onClose,
  onSuccess,
}: {
  cls: ClassRow
  action: "confirm" | "reject"
  onClose: () => void
  onSuccess: (classId: string, newStatus: string) => void
}) {
  const [adminNotes, setAdminNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isConfirm = action === "confirm"

  async function handleSubmit() {
    if (!adminNotes.trim()) {
      setError("Notes are required.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          action: isConfirm ? "confirm_payment" : "reject_payment",
          reason: adminNotes.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} payment`)
      }
      onSuccess(
        cls.id,
        isConfirm ? "SCHEDULED" : "CANCELLED_STUDENT"
      )
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            isConfirm ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {isConfirm ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h2
              className={`text-lg font-bold ${
                isConfirm ? "text-green-800" : "text-red-800"
              }`}
            >
              {isConfirm ? "Confirm Payment" : "Reject Payment"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Student</span>
              <span className="font-semibold text-[#1E293B]">
                {cls.studentName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Class</span>
              <span className="font-semibold text-[#1E293B]">
                {cls.subject} — {cls.date}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order</span>
              <span className="font-mono font-semibold text-[#1E3A5F]">
                {cls.orderRef}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MessageSquareText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => {
                setAdminNotes(e.target.value)
                if (error && e.target.value.trim()) setError("")
              }}
              placeholder={
                isConfirm
                  ? 'e.g., "Bank ref: TXN-98765"'
                  : 'e.g., "Payment not received"'
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2 ${
              isConfirm
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isConfirm ? "Confirm Payment" : "Reject Payment"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Main Client Component ──────────────────── */

export function AdminClassesClient({
  classes: initialClasses,
  kpis: initialKpis,
  teachers,
  defaultMonth,
}: {
  classes: ClassRow[]
  kpis: KPIs
  teachers: TeacherOption[]
  defaultMonth: string
}) {
  const [classes, setClasses] = useState(initialClasses)
  const [kpis, setKpis] = useState(initialKpis)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [teacherFilter, setTeacherFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Modals
  const [detailClass, setDetailClass] = useState<ClassRow | null>(null)
  const [creditClass, setCreditClass] = useState<ClassRow | null>(null)
  const [paymentAction, setPaymentAction] = useState<{
    cls: ClassRow
    action: "confirm" | "reject"
  } | null>(null)

  // Loading state for date-range fetch
  const [loading, setLoading] = useState(false)

  const filteredClasses = useMemo(() => {
    let result = classes

    if (statusFilter !== "all") {
      if (statusFilter === "credited") {
        result = result.filter((c) =>
          c.cancelReason.startsWith("[ADMIN CREDIT]")
        )
      } else {
        result = result.filter((c) => c.status === statusFilter)
      }
    }

    if (teacherFilter !== "all") {
      result = result.filter((c) => c.teacherId === teacherFilter)
    }

    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00")
      result = result.filter((c) => new Date(c.scheduledAt) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59")
      result = result.filter((c) => new Date(c.scheduledAt) <= to)
    }

    return result
  }, [classes, statusFilter, teacherFilter, dateFrom, dateTo])

  // Fetch classes for a custom date range (via API)
  async function fetchClasses() {
    if (!dateFrom && !dateTo) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)

      const res = await fetch(`/api/classes?${params.toString()}`)
      if (res.ok) {
        // We'll use client-side filtering instead since server already loaded current month
        // This avoids needing a separate admin-specific classes API
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  function handleCreditSuccess(classId: string) {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              cancelReason: `[ADMIN CREDIT] Credited via Admin Classes page`,
            }
          : c
      )
    )
    setKpis((prev) => ({
      ...prev,
      credited: prev.credited + 1,
    }))
  }

  function handlePaymentSuccess(classId: string, newStatus: string) {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, status: newStatus, statusLower: newStatus.toLowerCase().replace(/_/g, " ") }
          : c
      )
    )
    setKpis((prev) => ({
      ...prev,
      pendingPayment: prev.pendingPayment - 1,
      scheduled:
        newStatus === "SCHEDULED" ? prev.scheduled + 1 : prev.scheduled,
      cancelled:
        newStatus.startsWith("CANCELLED") ? prev.cancelled + 1 : prev.cancelled,
    }))
  }

  // CSV export
  function exportCSV() {
    const headers = [
      "Date",
      "Time",
      "Student",
      "Teacher",
      "Subject",
      "Duration",
      "Status",
      "Package",
      "Order Ref",
      "Topic",
      "Rating",
      "Trial",
    ]
    const rows = filteredClasses.map((c) => [
      c.date,
      c.time,
      c.studentName,
      c.teacherName,
      c.subject,
      `${c.duration} min`,
      c.statusLower,
      c.packageName,
      c.orderRef,
      c.topicCovered,
      c.parentRating ?? "—",
      c.isTrial ? "Yes" : "No",
    ])
    const csv =
      [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `classes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusTabs = [
    { key: "all", label: "All", count: kpis.total },
    { key: "COMPLETED", label: "Completed", count: kpis.completed },
    { key: "SCHEDULED", label: "Scheduled", count: kpis.scheduled },
    {
      key: "PENDING_PAYMENT",
      label: "Pending Payment",
      count: kpis.pendingPayment,
    },
    { key: "credited", label: "Credited", count: kpis.credited },
    { key: "CANCELLED_STUDENT", label: "Cancelled", count: kpis.cancelled },
  ]

  const columns = [
    {
      key: "date",
      label: "Date & Time",
      sortable: true,
      render: (r: ClassRow) => (
        <div>
          <p className="text-sm font-medium text-[#1E293B]">{r.date}</p>
          <p className="text-xs text-gray-400">{r.time}</p>
        </div>
      ),
    },
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (r: ClassRow) => (
        <div>
          <p className="text-sm font-medium text-[#1E293B]">
            {r.studentName}
          </p>
          <p className="text-xs text-gray-400">Grade {r.studentGrade}</p>
        </div>
      ),
    },
    {
      key: "teacherName",
      label: "Teacher",
      sortable: true,
      render: (r: ClassRow) => (
        <span className="text-sm text-[#1E293B]">{r.teacherName}</span>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (r: ClassRow) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[#1E293B]">{r.subject}</span>
          {r.isTrial && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase">
              TRIAL
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r: ClassRow) => {
        const isCredited = r.cancelReason.startsWith("[ADMIN CREDIT]")
        return (
          <div className="flex flex-col gap-0.5">
            <StatusBadge status={r.statusLower} size="sm" />
            {isCredited && (
              <span className="text-[9px] font-bold text-orange-600 uppercase">
                Credited
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "orderRef",
      label: "Order",
      render: (r: ClassRow) => (
        <span className="font-mono text-xs text-[#1E3A5F]">{r.orderRef}</span>
      ),
    },
    {
      key: "parentRating",
      label: "Rating",
      render: (r: ClassRow) =>
        r.parentRating ? (
          <RatingStars rating={r.parentRating} size="sm" />
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: ClassRow) => {
        const isCredited = r.cancelReason.startsWith("[ADMIN CREDIT]")
        return (
          <div className="flex items-center gap-1">
            <button
              title="View Details"
              onClick={() => setDetailClass(r)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {r.status === "PENDING_PAYMENT" && (
              <>
                <button
                  title="Confirm Payment"
                  onClick={() =>
                    setPaymentAction({ cls: r, action: "confirm" })
                  }
                  className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  title="Reject Payment"
                  onClick={() =>
                    setPaymentAction({ cls: r, action: "reject" })
                  }
                  className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {r.status === "COMPLETED" && !isCredited && (
              <button
                title="Credit to Parent Wallet"
                onClick={() => setCreditClass(r)}
                className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Class Management
        </h1>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
        <MiniKPI label="Total" value={kpis.total} />
        <MiniKPI
          label="Completed"
          value={kpis.completed}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI
          label="Scheduled"
          value={kpis.scheduled}
          valueClass="text-[#0D9488]"
        />
        <MiniKPI
          label="Pending Pay"
          value={kpis.pendingPayment}
          valueClass="text-[#F59E0B]"
        />
        <MiniKPI
          label="Cancelled"
          value={kpis.cancelled}
          valueClass="text-[#EF4444]"
        />
        <MiniKPI
          label="No-Show"
          value={kpis.noShow}
          valueClass="text-[#EF4444]"
        />
        <MiniKPI
          label="Credited"
          value={kpis.credited}
          valueClass="text-[#F59E0B]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === tab.key
                  ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Teacher filter */}
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            Teacher
          </label>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="all">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("")
                setDateTo("")
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filteredClasses as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search by student, teacher, subject, order..."
        pageSize={10}
      />

      {/* ──── Modals ──── */}

      {/* Class Detail Modal */}
      {detailClass && (
        <ClassDetailModal
          cls={detailClass}
          onClose={() => setDetailClass(null)}
          onCreditClick={() => {
            setCreditClass(detailClass)
            setDetailClass(null)
          }}
          onConfirmPaymentClick={() => {
            setPaymentAction({ cls: detailClass, action: "confirm" })
            setDetailClass(null)
          }}
          onRejectPaymentClick={() => {
            setPaymentAction({ cls: detailClass, action: "reject" })
            setDetailClass(null)
          }}
        />
      )}

      {/* Credit Class Modal */}
      {creditClass && (
        <CreditClassModal
          cls={creditClass}
          onClose={() => setCreditClass(null)}
          onSuccess={handleCreditSuccess}
        />
      )}

      {/* Payment Action Modal */}
      {paymentAction && (
        <PaymentActionModal
          cls={paymentAction.cls}
          action={paymentAction.action}
          onClose={() => setPaymentAction(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
