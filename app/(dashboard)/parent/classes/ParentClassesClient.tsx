"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  Video,
  RotateCcw,
  CheckCircle,
  Eye,
  Star,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle,
  ExternalLink,
  FileText,
  Save,
  Loader2,
  Filter,
  AlertTriangle,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"
import { RescheduleModal } from "@/components/modals/RescheduleModal"
import { CancelClassModal } from "@/components/modals/CancelClassModal"
import { RateClassModal } from "@/components/modals/RateClassModal"
import { ClassDetailsModal } from "@/components/modals/ClassDetailsModal"

/* ──────────────────── Types ──────────────────── */

type ClassRow = {
  id: string
  scheduledAt: string
  dayLabel: string
  dateNum: number
  month: string
  dateFormatted: string
  time: string
  duration: string
  teacher: string
  teacherInitials: string
  teacherId: string
  subject: string
  topic: string
  status: string
  statusLower: string
  canJoin: boolean
  isTrial: boolean
  meetingLink: string | null
  studentNotes: string
  cancelReason: string
  rated: boolean
  rating: number | null
  hasNotes: boolean
  isPast: boolean
  isUpcoming: boolean
  isCompleted: boolean
  isCancelled: boolean
}

type KPIs = {
  total: number
  upcoming: number
  completed: number
  cancelled: number
  pendingPayment: number
}

type CalendarData = {
  year: number
  month: string
  startDay: number
  days: number
  classDates: number[]
  today: number
}

type StatusFilter = "all" | "upcoming" | "completed" | "cancelled"

/* ──────────────────── Mini Calendar ──────────────────── */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function MiniCalendar({ data }: { data: CalendarData }) {
  const cells: (number | null)[] = Array(data.startDay).fill(null)
  for (let d = 1; d <= data.days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-[#1E293B]">
          {data.month} {data.year}
        </h3>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const isToday = d === data.today
          const isClass = data.classDates.includes(d)
          return (
            <div
              key={d}
              className={[
                "flex items-center justify-center w-8 h-8 rounded-full mx-auto text-xs font-medium cursor-default",
                isToday
                  ? "bg-[#0D9488] text-white"
                  : isClass
                  ? "bg-[#F59E0B]/20 text-[#B45309] font-semibold"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {d}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40" />
          <span className="text-xs text-gray-500">Scheduled</span>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Student Notes Modal ──────────────────── */

function StudentNotesModal({
  open,
  onClose,
  cls,
}: {
  open: boolean
  onClose: () => void
  cls: ClassRow
}) {
  const [notes, setNotes] = useState(cls.studentNotes || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  if (!open) return null

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          action: "update_student_notes",
          studentNotes: notes.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save notes")
      }
      setSaved(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XCircle className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-[#1E293B] mb-1">
          {cls.studentNotes ? "Edit" : "Add"} Notes for Tutor
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {cls.subject} · {cls.time}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Share your syllabus, topics to cover, or any preparation notes. Your tutor will see these before the class.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {saved && (
          <div className="mb-3 p-3 rounded-lg bg-green-50 text-sm text-green-700 border border-green-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />Notes saved! Your tutor has been notified.
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="e.g., Please focus on Chapter 5 — Quadratic Equations. Student is struggling with word problems."
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-none"
          disabled={saving || saved}
        />

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved || !notes.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Notes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Status Icon Helper ──────────────────── */

function ClassStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
    case "SCHEDULED":
    case "CONFIRMED":
      return <Clock className="w-5 h-5 text-[#0D9488] flex-shrink-0" />
    case "PENDING_PAYMENT":
      return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
    case "CANCELLED_STUDENT":
    case "CANCELLED_TEACHER":
      return <XCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
    case "NO_SHOW_STUDENT":
    case "NO_SHOW_TEACHER":
      return <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
    default:
      return <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
  }
}

/* ──────────────────── Status Label Helper ──────────────────── */

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: "completed",
    SCHEDULED: "scheduled",
    CONFIRMED: "confirmed",
    PENDING_PAYMENT: "pending payment",
    CANCELLED_STUDENT: "cancelled",
    CANCELLED_TEACHER: "cancelled by teacher",
    NO_SHOW_STUDENT: "no show",
    NO_SHOW_TEACHER: "teacher no show",
  }
  return map[status] || status.toLowerCase()
}

/* ──────────────────── Left Border Color ──────────────────── */

function borderColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "border-l-[#22C55E]"
    case "SCHEDULED":
    case "CONFIRMED":
      return "border-l-[#0D9488]"
    case "PENDING_PAYMENT":
      return "border-l-amber-400"
    case "CANCELLED_STUDENT":
    case "CANCELLED_TEACHER":
      return "border-l-[#EF4444]"
    case "NO_SHOW_STUDENT":
    case "NO_SHOW_TEACHER":
      return "border-l-orange-400"
    default:
      return "border-l-gray-300"
  }
}

/* ──────────────────── Main Component ──────────────────── */

export function ParentClassesClient({
  childName,
  classes,
  kpis,
  calendarData,
}: {
  childName: string
  classes: ClassRow[]
  kpis: KPIs
  calendarData: CalendarData
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<StatusFilter>("all")

  // Modals
  const [rescheduleClass, setRescheduleClass] = useState<ClassRow | null>(null)
  const [teacherSlots, setTeacherSlots] = useState<any>(null)
  const [cancelClass, setCancelClass] = useState<ClassRow | null>(null)
  const [rateClass, setRateClass] = useState<ClassRow | null>(null)
  const [detailsClass, setDetailsClass] = useState<ClassRow | null>(null)
  const [notesClass, setNotesClass] = useState<ClassRow | null>(null)

  useEffect(() => {
    if (rescheduleClass) {
      fetch(`/api/classes/teacher-slots?teacherId=${rescheduleClass.teacherId}`)
        .then((r) => r.json())
        .then((d) => setTeacherSlots(d))
        .catch(() => {})
    } else {
      setTeacherSlots(null)
    }
  }, [rescheduleClass])

  const filtered = useMemo(() => {
    if (filter === "all") return classes
    if (filter === "upcoming") return classes.filter((c) => c.isUpcoming)
    if (filter === "completed") return classes.filter((c) => c.isCompleted)
    if (filter === "cancelled") return classes.filter((c) => c.isCancelled)
    return classes
  }, [classes, filter])

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All Classes", count: kpis.total },
    { key: "upcoming", label: "Upcoming", count: kpis.upcoming },
    { key: "completed", label: "Completed", count: kpis.completed },
    { key: "cancelled", label: "Cancelled", count: kpis.cancelled },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track {childName}&apos;s learning sessions
          </p>
        </div>
        <button
          onClick={() => router.push("/parent/teachers")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />Book a Class
        </button>
      </div>

      {/* Layout: List + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 w-fit">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={[
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  filter === f.key
                    ? "bg-[#1E3A5F] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {f.label}
                <span
                  className={[
                    "inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-xs font-bold",
                    filter === f.key
                      ? "bg-white/20 text-white"
                      : "bg-[#0D9488]/10 text-[#0D9488]",
                  ].join(" ")}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-[#1E293B]">
                {filter === "all" ? "All Classes" : filters.find((f) => f.key === filter)?.label}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {filtered.length} session{filtered.length !== 1 ? "s" : ""} · sorted by date (newest first)
              </p>
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">
                  No classes found.
                </p>
              ) : (
                filtered.map((cls) => (
                  <div
                    key={cls.id}
                    className={`flex gap-4 px-5 py-4 border-l-4 hover:bg-gray-50/50 transition-colors ${borderColor(cls.status)}`}
                  >
                    {/* Date block */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="bg-[#1E3A5F] text-white rounded-lg py-1.5 px-2">
                        <p className="text-xs font-medium uppercase">{cls.month}</p>
                        <p className="text-2xl font-bold leading-tight">{cls.dateNum}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{cls.dayLabel}</p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Subject + Status */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <ClassStatusIcon status={cls.status} />
                            <h3 className="text-sm font-semibold text-[#1E293B]">
                              {cls.subject}
                              {cls.topic && (
                                <span className="text-gray-500 font-normal"> · {cls.topic}</span>
                              )}
                            </h3>
                            {cls.isTrial && (
                              <span className="px-2 py-0.5 bg-[#F59E0B]/10 text-[#B45309] text-xs font-semibold rounded-full border border-[#F59E0B]/30">
                                TRIAL
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{cls.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{cls.duration}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={statusLabel(cls.status)} />
                      </div>

                      {/* Row 2: Teacher */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-xs font-bold">
                          {cls.teacherInitials}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{cls.teacher}</span>
                      </div>

                      {/* Student notes (if any, for upcoming classes) */}
                      {cls.studentNotes && cls.isUpcoming && (
                        <div className="mt-2 flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                          <FileText className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700 line-clamp-2">{cls.studentNotes}</p>
                        </div>
                      )}

                      {/* Cancel reason (for cancelled/no-show) */}
                      {cls.isCancelled && cls.cancelReason && (
                        <p className="text-xs text-[#F97316] mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{cls.cancelReason}
                        </p>
                      )}

                      {/* Pending payment message */}
                      {cls.status === "PENDING_PAYMENT" && (
                        <p className="text-xs text-amber-600 mt-2">
                          Your coordinator will contact you with a payment link. Class will be confirmed once payment is verified.
                        </p>
                      )}

                      {/* Actions row */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {/* Upcoming actions */}
                        {cls.isUpcoming && cls.status !== "PENDING_PAYMENT" && (
                          <>
                            {cls.canJoin && cls.meetingLink && (
                              <button
                                onClick={() => window.open(cls.meetingLink!, "_blank", "noopener,noreferrer")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-[#0D9488]/90 transition-colors"
                              >
                                <Video className="w-3 h-3" />Join Class
                              </button>
                            )}
                            <button
                              onClick={() => setDetailsClass(cls)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F]/90 transition-colors"
                            >
                              <Eye className="w-3 h-3" />View Details
                            </button>
                            <button
                              onClick={() => setRescheduleClass(cls)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />Reschedule
                            </button>
                            <button
                              onClick={() => setCancelClass(cls)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />Cancel
                            </button>
                            <button
                              onClick={() => setNotesClass(cls)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-teal-200 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-50 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              {cls.studentNotes ? "Edit Notes" : "Add Notes"}
                            </button>
                          </>
                        )}

                        {/* Completed actions */}
                        {cls.isCompleted && (
                          <>
                            {cls.rated && cls.rating ? (
                              <div className="flex items-center gap-1.5">
                                <RatingStars rating={cls.rating} size="sm" />
                              </div>
                            ) : (
                              <button
                                onClick={() => setRateClass(cls)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0D9488] text-[#0D9488] rounded-lg text-xs font-medium hover:bg-[#0D9488]/5 transition-colors"
                              >
                                <Star className="w-3 h-3" />Rate Class
                              </button>
                            )}
                            {cls.hasNotes && (
                              <button
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-[#1E3A5F] rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                title="View session notes"
                              >
                                <Eye className="w-3 h-3" />Session Notes
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <MiniCalendar data={calendarData} />

          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total", val: String(kpis.total), color: "text-[#1E293B]" },
                { label: "Upcoming", val: String(kpis.upcoming), color: "text-[#0D9488]" },
                { label: "Completed", val: String(kpis.completed), color: "text-[#22C55E]" },
                { label: "Cancelled", val: String(kpis.cancelled), color: "text-[#EF4444]" },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Reschedule */}
      {rescheduleClass && teacherSlots && (
        <RescheduleModal
          open={!!rescheduleClass}
          onClose={() => setRescheduleClass(null)}
          onSuccess={() => window.location.reload()}
          classId={rescheduleClass.id}
          currentDate={`${rescheduleClass.month} ${rescheduleClass.dateNum}`}
          currentTime={rescheduleClass.time}
          teacherName={rescheduleClass.teacher}
          subject={rescheduleClass.subject}
          teacherAvailability={teacherSlots.availability}
          teacherBookedSlots={teacherSlots.bookedSlots}
          teacherBlockedDates={teacherSlots.blockedDates}
        />
      )}

      {/* Cancel */}
      {cancelClass && (
        <CancelClassModal
          open={!!cancelClass}
          onClose={() => setCancelClass(null)}
          onSuccess={() => window.location.reload()}
          classId={cancelClass.id}
          subject={cancelClass.subject}
          teacherName={cancelClass.teacher}
          scheduledDate={`${cancelClass.month} ${cancelClass.dateNum}`}
          scheduledTime={cancelClass.time}
          cancelledBy="student"
        />
      )}

      {/* Details */}
      {detailsClass && (
        <ClassDetailsModal
          open={!!detailsClass}
          onClose={() => setDetailsClass(null)}
          cls={{
            id: detailsClass.id,
            subject: detailsClass.subject,
            teacher: detailsClass.teacher,
            teacherInitials: detailsClass.teacherInitials,
            date: `${detailsClass.dayLabel}, ${detailsClass.month} ${detailsClass.dateNum}`,
            time: detailsClass.time,
            duration: detailsClass.duration,
            status: detailsClass.statusLower,
            isTrial: detailsClass.isTrial,
            meetingLink: detailsClass.meetingLink,
          }}
        />
      )}

      {/* Rate */}
      {rateClass && (
        <RateClassModal
          open={!!rateClass}
          onClose={() => setRateClass(null)}
          onSuccess={() => window.location.reload()}
          classId={rateClass.id}
          subject={rateClass.subject}
          teacherName={rateClass.teacher}
          classDate={rateClass.dateFormatted}
        />
      )}

      {/* Student Notes */}
      {notesClass && (
        <StudentNotesModal
          open={!!notesClass}
          onClose={() => setNotesClass(null)}
          cls={notesClass}
        />
      )}
    </div>
  )
}
