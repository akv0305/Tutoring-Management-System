"use client"

import React, { useState } from "react"
import {
  UserPlus, Eye, DollarSign, UserX, UserCheck, X, Loader2,
  AlertCircle, BookOpen, Check, MapPin, BarChart3, ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"
import { AddTeacherModal } from "@/components/modals/AddTeacherModal"
import { TeacherAvailabilityList } from "@/components/teachers/TeacherAvailabilityList"

/* ──────────────────── Types ──────────────────── */

type AvailabilitySlot = { dayOfWeek: string; startTime: string; endTime: string }
type UpcomingClass = { scheduledAt: string; duration: number; subject: string; student: string }

type Teacher = Record<string, unknown> & {
  id: string
  teacherName: string
  initials: string
  email: string
  phone: string | null
  qualification: string
  bio: string | null
  subjects: string[]
  subjectIds: string[]
  hourlyRate: string
  studentFacingRate: string
  rating: number
  totalReviews: number
  activeStudents: number
  experience: number
  status: string
  timezone: string
  availabilitySlots: AvailabilitySlot[]
  blockedDates: string[]
  upcomingClasses: UpcomingClass[]
  weeklyHours: number
  upcomingClassCount: number
  hasGradeRates: boolean
  rateRange: string | null
  gradeRateCount: number
}

type KPIs = { total: number; active: number; onLeave: number; avgRating: string }
type SubjectOption = { id: string; name: string; category: string }

/* ─── Fixed dual timezones ─── */
const TZ_CST = "America/Chicago"
const TZ_IST = "Asia/Kolkata"

const DAY_ORDER: Record<string, number> = { MONDAY:0,TUESDAY:1,WEDNESDAY:2,THURSDAY:3,FRIDAY:4,SATURDAY:5,SUNDAY:6 }
const DAY_LABELS: Record<string, string> = { MONDAY:"Monday",TUESDAY:"Tuesday",WEDNESDAY:"Wednesday",THURSDAY:"Thursday",FRIDAY:"Friday",SATURDAY:"Saturday",SUNDAY:"Sunday" }

function tzAbbr(tz: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(date)
    return parts.find((p) => p.type === "timeZoneName")?.value || tz
  } catch { return tz }
}

function utcToLocal12h(utcDate: Date, timezone: string): string {
  return utcDate.toLocaleTimeString("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit", hour12: true })
}

function utcToLocalDate(utcDate: Date, timezone: string): string {
  return utcDate.toLocaleDateString("en-US", { timeZone: timezone, weekday: "short", month: "short", day: "numeric" })
}

function formatTime12(time24: string) {
  const h = parseInt(time24.split(":")[0], 10)
  if (h === 0) return "12 AM"; if (h < 12) return `${h} AM`; if (h === 12) return "12 PM"; return `${h - 12} PM`
}

/* ──────────────────── Teacher Detail Modal (Tabbed) ──────────────────── */

function TeacherDetailModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [tab, setTab] = useState<"profile" | "availability" | "classes">("profile")

  const availByDay = (() => {
    const map: Record<string, { start: string; end: string }[]> = {}
    teacher.availabilitySlots
      .sort((a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99))
      .forEach((a) => {
        const day = a.dayOfWeek
        if (!map[day]) map[day] = []
        map[day].push({ start: a.startTime, end: a.endTime })
      })
    return map
  })()

  const istLabel = tzAbbr(TZ_IST)
  const cstLabel = tzAbbr(TZ_CST)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-[#1E293B]">Teacher Details</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Teacher header info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {teacher.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E293B] text-lg">{teacher.teacherName}</p>
              <p className="text-xs text-gray-400">{teacher.qualification}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={teacher.status} size="sm" />
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                  <MapPin className="w-3 h-3" /> {teacher.timezone}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { key: "profile" as const, label: "Profile" },
              { key: "availability" as const, label: "Availability" },
              { key: "classes" as const, label: `Upcoming (${teacher.upcomingClassCount})` },
            ]).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${tab === t.key ? "border-[#0D9488] text-[#0D9488]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Profile Tab ─── */}
          {tab === "profile" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-[#1E293B]">{teacher.email}</span></div>
                {teacher.phone && <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-[#1E293B]">{teacher.phone}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-medium text-[#1E293B]">{teacher.experience} year{teacher.experience !== 1 ? "s" : ""}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Active Students</span><span className="font-medium text-[#1E293B]">{teacher.activeStudents}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Weekly Hours</span><span className="font-medium text-[#1E293B]">{teacher.weeklyHours}h</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Rating</span><div className="flex items-center gap-1.5"><RatingStars rating={teacher.rating} size="sm" /><span className="text-xs text-gray-400">({teacher.totalReviews})</span></div></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1"><span>🔒</span> Confidential Rates</p>
                <div className="flex justify-between"><span className="text-amber-800">Compensation Rate</span><span className="font-bold text-amber-900">{teacher.hourlyRate}</span></div>
                <div className="flex justify-between"><span className="text-amber-800">Student-Facing Rate</span><span className="font-bold text-amber-900">{teacher.studentFacingRate}</span></div>
                <p className="text-[10px] text-amber-600 pt-1">These are default rates. Grade-based rates (if configured) take priority during booking.</p>
              </div>

              {/* Grade-Based Rate Info */}
              {teacher.hasGradeRates ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" /> Grade-Based Rates
                    </p>
                    <span className="text-[10px] text-indigo-500 font-medium">{teacher.gradeRateCount} rate{teacher.gradeRateCount !== 1 ? "s" : ""} configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-800">Rate Range</span>
                    <span className="font-bold text-indigo-900">{teacher.rateRange}</span>
                  </div>
                  <Link
                    href="/admin/pricing"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors pt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Manage Grade Rates in Pricing Matrix
                  </Link>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">No grade-based rates configured. Using default rates for all bookings.</p>
                  <Link
                    href="/admin/pricing"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0D9488] hover:underline whitespace-nowrap ml-3"
                  >
                    Configure <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects.length > 0 ? teacher.subjects.map((s) => (
                    <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20">{s}</span>
                  )) : <span className="text-sm text-gray-400">No subjects assigned</span>}
                </div>
              </div>
              {teacher.bio && <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bio</p><p className="text-sm text-gray-700 leading-relaxed">{teacher.bio}</p></div>}
            </div>
          )}

          {/* ─── Availability Tab ─── */}
          {tab === "availability" && (
            <div className="space-y-4">
              <TeacherAvailabilityList
                teacherId={teacher.id}
                teacherTimezone={teacher.timezone}
                availabilitySlots={teacher.availabilitySlots}
                blockedDates={teacher.blockedDates}
              />

              {/* Recurring Slot Details */}
              {Object.keys(availByDay).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Recurring Slot Details (Teacher Local Time)</p>
                  {Object.entries(availByDay).map(([day, slots]) => (
                    <div key={day} className="flex items-center gap-2 text-sm">
                      <span className="w-20 text-xs font-medium text-[#1E293B]">{DAY_LABELS[day] || day}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-green-50 border border-green-200 text-[10px] font-medium text-green-700">{formatTime12(s.start)} – {formatTime12(s.end)}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Blocked Dates */}
              {teacher.blockedDates.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Blocked Dates</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.blockedDates.slice(0, 10).map((d) => <span key={d} className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-medium text-red-600">{d}</span>)}
                    {teacher.blockedDates.length > 10 && <span className="text-[10px] text-gray-400">+{teacher.blockedDates.length - 10} more</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Upcoming Classes Tab ─── */}
          {tab === "classes" && (
            <div className="space-y-2">
              {teacher.upcomingClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming classes in the next 4 weeks.</p>
              ) : (
                teacher.upcomingClasses.map((c, i) => {
                  const utc = new Date(c.scheduledAt)
                  const utcEnd = new Date(utc.getTime() + (c.duration || 60) * 60000)
                  const istStart = utcToLocal12h(utc, TZ_IST)
                  const istEnd = utcToLocal12h(utcEnd, TZ_IST)
                  const cstStart = utcToLocal12h(utc, TZ_CST)
                  const cstEnd = utcToLocal12h(utcEnd, TZ_CST)
                  const istDate = utcToLocalDate(utc, TZ_IST)
                  const cstDate = utcToLocalDate(utc, TZ_CST)
                  const il = tzAbbr(TZ_IST, utc)
                  const cl = tzAbbr(TZ_CST, utc)

                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="w-11 h-11 rounded-lg bg-[#0D9488]/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-[#0D9488] uppercase">
                          {utc.toLocaleDateString("en-US", { month: "short", timeZone: TZ_IST })}
                        </span>
                        <span className="text-sm font-bold text-[#1E293B] -mt-0.5">
                          {utc.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ_IST })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1E293B] truncate">{c.subject} — {c.student}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {istStart} – {istEnd} {il}  ·  {cstStart} – {cstEnd} {cl}
                          {istDate !== cstDate && <span className="text-gray-400"> ({cstDate})</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{c.duration} min</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Set Rate Modal ──────────────────── */

function SetRateModal({ teacher, onClose, onSuccess }: { teacher: Teacher; onClose: () => void; onSuccess: () => void }) {
  const currentCompRate = teacher.hourlyRate.replace("$", "").replace("/hr", "")
  const currentStudentRate = teacher.studentFacingRate.replace("$", "").replace("/hr", "")
  const [compRate, setCompRate] = useState(currentCompRate)
  const [studentRate, setStudentRate] = useState(currentStudentRate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    const numCompRate = Number(compRate)
    const numStudentRate = Number(studentRate)
    if (isNaN(numCompRate) || numCompRate < 0) { setError("Please enter a valid compensation rate."); return }
    if (isNaN(numStudentRate) || numStudentRate < 0) { setError("Please enter a valid student-facing rate."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/teachers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: teacher.id, compensationRate: numCompRate, studentFacingRate: numStudentRate }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); return }
      onSuccess()
    } catch { setError("Network error") } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E293B]">Update Rates</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Update rates for <strong>{teacher.teacherName}</strong>.</p>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Current Compensation</span><span className="font-semibold text-[#1E293B]">{teacher.hourlyRate}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Current Student-Facing</span><span className="font-semibold text-[#1E293B]">{teacher.studentFacingRate}</span></div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Compensation Rate ($/hr) <span className="text-amber-600">🔒</span></label>
            <input type="number" step="0.01" min="0" value={compRate} onChange={(e) => setCompRate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Student-Facing Rate ($/hr)</label>
            <input type="number" step="0.01" min="0" value={studentRate} onChange={(e) => setStudentRate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
            <p className="text-[11px] text-gray-400 mt-1">This is the rate parents see when browsing teachers.</p>
          </div>
        </div>
        {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}{loading ? "Saving…" : "Save Rates"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Toggle Status Modal ──────────────────── */

function ToggleStatusModal({ teacher, onClose, onSuccess }: { teacher: Teacher; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const isActive = teacher.status === "active"
  const actionLabel = isActive ? "Deactivate" : "Activate"

  const handleConfirm = async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/teachers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: teacher.id, action: "toggle_status" }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Action failed"); return }
      onSuccess()
    } catch { setError("Network error") } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1E293B] mb-2">{actionLabel} Teacher</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to {actionLabel.toLowerCase()} <strong>{teacher.teacherName}</strong>?
          {isActive && <span className="block mt-1 text-xs text-gray-400">This teacher will not appear in active lists and new classes won&apos;t be assigned.</span>}
        </p>
        {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${isActive ? "bg-[#EF4444] hover:bg-red-600" : "bg-[#22C55E] hover:bg-green-600"}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}{actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Manage Subjects Modal ──────────────────── */

function ManageSubjectsModal({
  teacher,
  allSubjects,
  onClose,
  onSuccess,
}: {
  teacher: Teacher
  allSubjects: SubjectOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(teacher.subjectIds))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: teacher.id,
          action: "update_subjects",
          subjectIds: Array.from(selected),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to update subjects")
        return
      }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const grouped = allSubjects.reduce<Record<string, SubjectOption[]>>((acc, s) => {
    const cat = s.category || "OTHER"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    MATH: "Mathematics",
    SCIENCE: "Science",
    ENGLISH: "English & Language Arts",
    TEST_PREP: "Test Preparation",
    COMPUTER_SCIENCE: "Computer Science",
    LANGUAGES: "Languages",
    OTHER: "Other",
  }

  const hasChanges =
    selected.size !== teacher.subjectIds.length ||
    !teacher.subjectIds.every((id) => selected.has(id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">Manage Subjects</h3>
            <p className="text-xs text-gray-500">{teacher.teacherName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">Select the subjects this teacher can teach. Changes take effect immediately for new bookings.</p>
          {Object.entries(grouped).map(([cat, subjects]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{categoryLabels[cat] || cat}</p>
              <div className="space-y-1.5">
                {subjects.map((s) => {
                  const isChecked = selected.has(s.id)
                  return (
                    <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${isChecked ? "border-[#0D9488] bg-[#0D9488]/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${isChecked ? "bg-[#0D9488] border-[#0D9488]" : "border-gray-300"}`}>
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${isChecked ? "text-[#0D9488]" : "text-[#1E293B]"}`}>{s.name}</span>
                      <input type="checkbox" checked={isChecked} onChange={() => toggle(s.id)} className="sr-only" />
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <strong>{selected.size}</strong> subject{selected.size !== 1 ? "s" : ""} selected
            {hasChanges && <span className="ml-2 text-[#0D9488] font-medium">· Unsaved changes</span>}
          </div>
          {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 shrink-0 flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || !hasChanges} className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving…</>) : (<><BookOpen className="w-4 h-4" />Save Subjects</>)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── MiniKPI ──────────────────── */

function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ──────────────────── Main Component ──────────────────── */

export function TeachersClient({
  teachers,
  kpis,
  subjects,
}: {
  teachers: Teacher[]
  kpis: KPIs
  subjects: SubjectOption[]
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)
  const [rateTeacher, setRateTeacher] = useState<Teacher | null>(null)
  const [toggleTeacher, setToggleTeacher] = useState<Teacher | null>(null)
  const [subjectsTeacher, setSubjectsTeacher] = useState<Teacher | null>(null)

  const handleTeacherAdded = () => { window.location.reload() }
  const handleRateUpdated = () => { setRateTeacher(null); window.location.reload() }
  const handleStatusToggled = () => { setToggleTeacher(null); window.location.reload() }
  const handleSubjectsUpdated = () => { setSubjectsTeacher(null); window.location.reload() }

  const columns = [
    {
      key: "teacherName", label: "Teacher Name", sortable: true,
      render: (row: Teacher) => (<div><p className="font-medium text-[#1E293B]">{row.teacherName}</p><p className="text-xs text-gray-400">{row.qualification}</p></div>),
    },
    {
      key: "email", label: "Email",
      render: (row: Teacher) => <span className="text-sm text-gray-500">{row.email}</span>,
    },
    {
      key: "subjects", label: "Subjects",
      render: (row: Teacher) => (
        <div className="flex flex-wrap gap-1">
          {row.subjects.map((s) => (
            <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20">{s}</span>
          ))}
        </div>
      ),
    },
    {
      key: "hourlyRate", label: "Comp. Rate (Confidential)",
      render: (row: Teacher) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">🔒 {row.hourlyRate}</span>
          {row.hasGradeRates && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-medium">
              <BarChart3 className="w-3 h-3" /> Grade rates
            </span>
          )}
        </div>
      ),
    },
    {
      key: "rating", label: "Rating", sortable: true,
      render: (row: Teacher) => (<div className="flex items-center gap-1.5"><RatingStars rating={row.rating} size="sm" /><span className="text-xs text-gray-400">({row.totalReviews})</span></div>),
    },
    {
      key: "activeStudents", label: "Active Students", sortable: true,
      render: (row: Teacher) => <span className="font-semibold text-[#1E293B]">{row.activeStudents}</span>,
    },
    {
      key: "status", label: "Status", sortable: true,
      render: (row: Teacher) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions", label: "Actions",
      render: (row: Teacher) => (
        <div className="flex items-center gap-1">
          <button title="View" onClick={() => setViewTeacher(row)} className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
          <button title="Manage Subjects" onClick={() => setSubjectsTeacher(row)} className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"><BookOpen className="w-3.5 h-3.5" /></button>
          <button title="Set Rate" onClick={() => setRateTeacher(row)} className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"><DollarSign className="w-3.5 h-3.5" /></button>
          <button title={row.status === "active" ? "Deactivate" : "Activate"} onClick={() => setToggleTeacher(row)} className={`p-1.5 rounded-md transition-colors ${row.status === "active" ? "text-[#EF4444] hover:bg-red-50" : "text-[#22C55E] hover:bg-green-50"}`}>
            {row.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Management</h1>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Teachers" value={kpis.total} />
        <MiniKPI label="Active" value={kpis.active} valueClass="text-[#22C55E]" />
        <MiniKPI label="On Leave" value={kpis.onLeave} valueClass="text-[#F59E0B]" />
        <MiniKPI label="Average Rating" value={kpis.avgRating} valueClass="text-[#F59E0B]" />
      </div>

      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-amber-600 text-lg leading-none mt-0.5">🔒</span>
        <p className="text-sm text-amber-800"><span className="font-semibold">Confidential:</span> Compensation rates (Comp. Rate) are visible to Admins only. This column is hidden from Coordinators, Teachers, and Parents.</p>
      </div>

      <DataTable columns={columns as Parameters<typeof DataTable>[0]["columns"]} data={teachers as unknown as Record<string, unknown>[]} searchable searchPlaceholder="Search teachers..." pageSize={10} />

      <AddTeacherModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleTeacherAdded} subjects={subjects} />
      {viewTeacher && <TeacherDetailModal teacher={viewTeacher} onClose={() => setViewTeacher(null)} />}
      {rateTeacher && <SetRateModal teacher={rateTeacher} onClose={() => setRateTeacher(null)} onSuccess={handleRateUpdated} />}
      {toggleTeacher && <ToggleStatusModal teacher={toggleTeacher} onClose={() => setToggleTeacher(null)} onSuccess={handleStatusToggled} />}
      {subjectsTeacher && <ManageSubjectsModal teacher={subjectsTeacher} allSubjects={subjects} onClose={() => setSubjectsTeacher(null)} onSuccess={handleSubjectsUpdated} />}
    </div>
  )
}
