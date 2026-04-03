"use client"

import React, { useState } from "react"
import {
  Calendar,
  BookOpen,
  Star,
  Wallet,
  Video,
  Clock,
  CalendarPlus,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Link as LinkIcon,
  Loader2,
  Copy,
  ExternalLink,
  Save,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"
import { CompleteClassModal } from "@/components/modals/CompleteClassModal"

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

type TodayClass = {
  id: string
  time: string
  studentName: string
  initials: string
  subject: string
  topic: string
  status: string
  isTrial: boolean
  meetingLink: string | null
}

type UpcomingRow = {
  date: string
  time: string
  student: string
  subject: string
}

type FeedbackItem = {
  rating: number
  from: string
  text: string
  date: string
}

type DashboardData = {
  teacherFirstName: string
  teacherTitle: string
  todayClasses: TodayClass[]
  upcomingWeek: UpcomingRow[]
  todayCount: number
  thisWeekCount: number
  avgRating: string
  ratingCount: number
  monthEarnings: number
  monthCompleted: number
  feedback: FeedbackItem[]
  stats: {
    totalCompleted: number
    completionRate: string
    avgRating: string
    noShows: string
    cancellations: string
  }
}

/* ────────────────────────────────────────────────
   Meeting-Link Modal Component
   ──────────────────────────────────────────────── */

function MeetingLinkModal({
  open,
  onClose,
  cls,
  onLinkSaved,
}: {
  open: boolean
  onClose: () => void
  cls: TodayClass
  onLinkSaved: (classId: string, link: string) => void
}) {
  const [customLink, setCustomLink] = useState(cls.meetingLink || "")
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  if (!open) return null

  async function saveLink(link: string) {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          action: "update_meeting_link",
          meetingLink: link,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save meeting link")
      }
      onLinkSaved(cls.id, link)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function generateJitsi() {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          action: "update_meeting_link",
          generateJitsi: true,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to generate Jitsi link")
      }
      const data = await res.json()
      const link = data.class?.meetingLink || data.meetingLink || ""
      setCustomLink(link)
      onLinkSaved(cls.id, link)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  function copyLink() {
    if (customLink) {
      navigator.clipboard.writeText(customLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const busy = saving || generating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-[#1E293B] mb-1">Meeting Link</h3>
        <p className="text-sm text-gray-500 mb-5">
          {cls.subject} — {cls.studentName} — {cls.time}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {/* Option 1: Generate Jitsi */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Option 1 — Auto-generate (Jitsi Meet)
          </p>
          <button
            onClick={generateJitsi}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {generating ? "Generating…" : "Generate Jitsi Link"}
          </button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 uppercase">or</span></div>
        </div>

        {/* Option 2: Paste custom link */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Option 2 — Paste your own link
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                placeholder="https://zoom.us/j/... or any meeting URL"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
              />
            </div>
            {customLink && (
              <button onClick={copyLink} title="Copy link"
                className="px-2.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button
            onClick={() => saveLink(customLink)}
            disabled={!customLink.trim() || busy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Meeting Link"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   View-Notes Modal Component
   ──────────────────────────────────────────────── */

function ViewNotesModal({
  open,
  onClose,
  cls,
  onNotesSaved,
}: {
  open: boolean
  onClose: () => void
  cls: TodayClass
  onNotesSaved: (classId: string, topic: string, notes: string) => void
}) {
  const [topicCovered, setTopicCovered] = useState(cls.topic || "")
  const [sessionNotes, setSessionNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  async function save() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: cls.id,
          action: "update_notes",
          topicCovered: topicCovered.trim() || undefined,
          sessionNotes: sessionNotes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save notes")
      }
      onNotesSaved(cls.id, topicCovered, sessionNotes)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-[#1E293B] mb-1">Class Notes</h3>
        <p className="text-sm text-gray-500 mb-5">
          {cls.subject} — {cls.studentName} — {cls.time}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">Topic Covered</label>
            <input
              type="text"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              placeholder="e.g. Quadratic Equations, Chapter 5 Review"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">Session Notes</label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={5}
              placeholder="Summary of what was taught, homework assigned, areas to improve…"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving || (!topicCovered.trim() && !sessionNotes.trim())}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   Main Dashboard Component
   ──────────────────────────────────────────────── */

export function TeacherDashboardClient({ data }: { data: DashboardData }) {
  const [completeClass, setCompleteClass] = useState<TodayClass | null>(null)
  const [meetingLinkClass, setMeetingLinkClass] = useState<TodayClass | null>(null)
  const [notesClass, setNotesClass] = useState<TodayClass | null>(null)

  // Local copy of today's classes so we can update meeting links & topics in-place
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>(data.todayClasses)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  /* ---------- helpers ---------- */

  function handleJoinClass(cls: TodayClass) {
    if (cls.meetingLink) {
      window.open(cls.meetingLink, "_blank", "noopener,noreferrer")
    } else {
      // No link yet → open modal to add one
      setMeetingLinkClass(cls)
    }
  }

  function handleJoinNextClass() {
    // Find the first non-completed, non-cancelled class
    const next = todayClasses.find((c) =>
      ["scheduled", "confirmed"].includes(c.status)
    )
    if (!next) return
    handleJoinClass(next)
  }

  function handleLinkSaved(classId: string, link: string) {
    setTodayClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, meetingLink: link } : c))
    )
  }

  function handleNotesSaved(classId: string, topic: string, _notes: string) {
    setTodayClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, topic: topic || c.topic } : c))
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0D9488 0%, #1E3A5F 100%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {data.teacherTitle ? `${data.teacherTitle} ` : ""}
            {data.teacherFirstName}!
          </h2>
          <p className="text-white/80 text-sm mt-1">
            You have {data.todayCount} class{data.todayCount !== 1 ? "es" : ""}{" "}
            scheduled today.
          </p>
        </div>
        {todayClasses.length > 0 && (
          <button
            onClick={handleJoinNextClass}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] text-[#1E293B] font-semibold text-sm hover:bg-amber-400 transition-colors shadow-sm flex-shrink-0"
          >
            <Video className="w-4 h-4" />
            Join Next Class
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard title="Today's Classes" value={String(data.todayCount)} subtitle={today} change="" changeType="neutral" icon={Calendar} />
        <KPICard title="This Week" value={String(data.thisWeekCount)} subtitle={`${data.upcomingWeek.length} remaining after today`} change="" changeType="neutral" icon={BookOpen} />
        <KPICard title="My Rating" value={data.avgRating} subtitle={`Based on ${data.ratingCount} reviews`} change={data.avgRating !== "—" ? "★" : ""} changeType="positive" icon={Star} />
        <KPICard title="This Month Earnings" value={`$${data.monthEarnings.toLocaleString()}`} subtitle={`${data.monthCompleted} classes completed`} change="" changeType="neutral" icon={Wallet} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">{today}</h2>
              <a href="/teacher/schedule" className="text-sm text-[#0D9488] font-medium hover:underline">View Full Schedule →</a>
            </div>
            <div className="flex flex-col gap-4">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No classes scheduled for today.</p>
              ) : (
                todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className={`rounded-lg border border-gray-100 border-l-4 ${
                      cls.isTrial ? "border-l-blue-500" : cls.status === "confirmed" ? "border-l-green-500" : "border-l-amber-400"
                    } p-4 hover:bg-gray-50/50 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1E293B]">{cls.time}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">{cls.initials}</span>
                          </div>
                          <span className="text-sm font-medium text-[#1E293B]">{cls.studentName}</span>
                          {cls.isTrial && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">TRIAL</span>
                          )}
                        </div>
                        <p className="text-xs text-[#0D9488] font-medium mt-1">{cls.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cls.topic}</p>
                        {/* Meeting link indicator */}
                        {cls.meetingLink && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <LinkIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{cls.meetingLink}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <StatusBadge status={cls.status} size="sm" />
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Join Class — only for actionable statuses */}
                          {["scheduled", "confirmed"].includes(cls.status) && (
                            <>
                              <button
                                onClick={() => handleJoinClass(cls)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors"
                              >
                                {cls.meetingLink ? (
                                  <><ExternalLink className="w-3 h-3" />Join Class</>
                                ) : (
                                  <><Video className="w-3 h-3" />Add Link</>
                                )}
                              </button>
                              {/* Edit link — only shown when a link already exists */}
                              {cls.meetingLink && (
                                <button
                                  onClick={() => setMeetingLinkClass(cls)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                                  title="Change meeting link"
                                >
                                  <LinkIcon className="w-3 h-3" />Edit Link
                                </button>
                              )}
                            </>
                          )}

                          {/* Mark Complete */}
                          {["scheduled", "confirmed"].includes(cls.status) && (
                            <button
                              onClick={() => setCompleteClass(cls)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#22C55E] text-white text-xs font-medium hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />Mark Complete
                            </button>
                          )}
                          {cls.status === "completed" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />Completed
                            </span>
                          )}

                          {/* View / Add Notes */}
                          <button
                            onClick={() => setNotesClass(cls)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            {cls.topic ? "View Notes" : "Add Notes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming This Week */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Rest of the Week</h2>
            <div className="flex flex-col gap-2">
              {data.upcomingWeek.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No more classes this week.</p>
              ) : (
                data.upcomingWeek.map((row, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
                    <span className="w-24 flex-shrink-0 text-xs text-gray-400 font-medium">{row.date}</span>
                    <span className="w-20 flex-shrink-0 text-xs font-semibold text-[#1E293B]">{row.time}</span>
                    <span className="flex-1 text-sm text-[#1E293B]">{row.student}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">{row.subject}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: Clock, label: "Update Availability", href: "/teacher/availability" },
                { icon: CalendarPlus, label: "Open New Slots", href: "/teacher/availability" },
                { icon: FileText, label: "Add Class Notes", href: null },
                { icon: AlertCircle, label: "Report an Issue", href: null },
              ].map(({ icon: Icon, label, href }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (href) {
                      window.location.href = href
                    } else if (label === "Add Class Notes") {
                      // Open notes modal for the first upcoming class
                      const next = todayClasses.find((c) =>
                        ["scheduled", "confirmed", "completed"].includes(c.status)
                      )
                      if (next) setNotesClass(next)
                    }
                  }}
                  className="w-full inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#0D9488]" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Student Feedback</h2>
            <div className="flex flex-col gap-4">
              {data.feedback.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No feedback yet.</p>
              ) : (
                data.feedback.map((fb, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[#1E293B]">{fb.from}</span>
                      <span className="text-[10px] text-gray-400">{fb.date}</span>
                    </div>
                    <RatingStars rating={fb.rating} size="sm" />
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{fb.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Performance</h2>
            <div className="flex flex-col gap-3">
              {[
                { label: "Total Classes Taught", value: String(data.stats.totalCompleted), valueClass: "text-[#1E293B]" },
                { label: "Completion Rate", value: data.stats.completionRate, valueClass: "text-[#22C55E]" },
                { label: "Average Rating", value: data.stats.avgRating, valueClass: "text-[#F59E0B]" },
                { label: "No-Shows", value: data.stats.noShows, valueClass: "text-[#22C55E]" },
                { label: "Cancellations This Month", value: data.stats.cancellations, valueClass: "text-[#1E293B]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`text-sm font-bold ${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Teacher cancellation limit: 3 per month. No-shows result in −0.5 rating penalty.
            </p>
          </div>
        </div>
      </div>

      {/* ──── Modals ──── */}

      {/* Complete Class Modal */}
      {completeClass && (
        <CompleteClassModal
          open={!!completeClass}
          onClose={() => setCompleteClass(null)}
          onSuccess={() => window.location.reload()}
          classId={completeClass.id}
          subject={completeClass.subject}
          studentName={completeClass.studentName}
          scheduledTime={completeClass.time}
        />
      )}

      {/* Meeting Link Modal */}
      {meetingLinkClass && (
        <MeetingLinkModal
          open={!!meetingLinkClass}
          onClose={() => setMeetingLinkClass(null)}
          cls={meetingLinkClass}
          onLinkSaved={handleLinkSaved}
        />
      )}

      {/* View / Edit Notes Modal */}
      {notesClass && (
        <ViewNotesModal
          open={!!notesClass}
          onClose={() => setNotesClass(null)}
          cls={notesClass}
          onNotesSaved={handleNotesSaved}
        />
      )}
    </div>
  )
}
