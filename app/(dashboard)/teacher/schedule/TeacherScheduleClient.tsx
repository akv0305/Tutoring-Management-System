"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Video,
  CheckCircle,
  FileText,
  CalendarClock,
  XCircle,
  X,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Copy,
  Save,
} from "lucide-react"
import { CompleteClassModal } from "@/components/modals/CompleteClassModal"
import { CancelClassModal } from "@/components/modals/CancelClassModal"
import { RescheduleModal } from "@/components/modals/RescheduleModal"

/* ────── Types ────── */

type Block = {
  id: string
  label: string
  sublabel: string
  subject: string
  studentName: string
  startSlot: number
  duration: number
  dayIndex: number
  colorClass: string
  isTrial: boolean
  status: string
  meetingLink: string | null
  scheduledAt: string
  time: string
  topicCovered: string
}

type LegendItem = { label: string; cls: string }
type Availability = { dayOfWeek: string; startTime: string; endTime: string }
type BookedSlot = { start: string; duration: number }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM",
]
const SLOT_H = 56

/* ────── Meeting Link Modal (inline) ────── */

function MeetingLinkModal({
  open,
  onClose,
  classId,
  subject,
  studentName,
  time,
  existingLink,
  onLinkSaved,
}: {
  open: boolean
  onClose: () => void
  classId: string
  subject: string
  studentName: string
  time: string
  existingLink: string | null
  onLinkSaved: (classId: string, link: string) => void
}) {
  const [customLink, setCustomLink] = useState(existingLink || "")
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
        body: JSON.stringify({ classId, action: "update_meeting_link", meetingLink: link }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save meeting link")
      }
      onLinkSaved(classId, link)
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
        body: JSON.stringify({ classId, action: "update_meeting_link", generateJitsi: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to generate link")
      }
      const data = await res.json()
      const link = data.class?.meetingLink || data.meetingLink || ""
      onLinkSaved(classId, link)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
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
        <p className="text-sm text-gray-500 mb-5">{subject} — {studentName} — {time}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">{error}</div>
        )}

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Option 1 — Auto-generate (Jitsi Meet)</p>
          <button onClick={generateJitsi} disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {generating ? "Generating…" : "Generate Jitsi Link"}
          </button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 uppercase">or</span></div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Option 2 — Paste your own link</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={customLink} onChange={(e) => setCustomLink(e.target.value)}
                placeholder="https://zoom.us/j/... or any URL"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent" />
            </div>
            {customLink && (
              <button onClick={() => { navigator.clipboard.writeText(customLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="px-2.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button onClick={() => saveLink(customLink)} disabled={!customLink.trim() || busy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Meeting Link"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────── Notes Modal (inline) ────── */

function NotesModal({
  open,
  onClose,
  classId,
  subject,
  studentName,
  time,
  existingTopic,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  classId: string
  subject: string
  studentName: string
  time: string
  existingTopic: string
  onSaved: (classId: string, topic: string) => void
}) {
  const [topicCovered, setTopicCovered] = useState(existingTopic || "")
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
          classId,
          action: "update_notes",
          topicCovered: topicCovered.trim() || undefined,
          sessionNotes: sessionNotes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save notes")
      }
      onSaved(classId, topicCovered)
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
        <p className="text-sm text-gray-500 mb-5">{subject} — {studentName} — {time}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600 border border-red-200">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">Topic Covered</label>
            <input type="text" value={topicCovered} onChange={(e) => setTopicCovered(e.target.value)}
              placeholder="e.g. Quadratic Equations, Chapter 5 Review"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">Session Notes</label>
            <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} rows={4}
              placeholder="Summary of what was taught, homework assigned…"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
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

/* ────── Class Block with click ────── */

function ClassBlock({
  block,
  isSelected,
  onClick,
}: {
  block: Block
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 shadow-sm cursor-pointer transition-all ${block.colorClass} ${
        isSelected ? "ring-2 ring-[#1E3A5F] ring-offset-1 scale-[1.02] z-10" : "hover:opacity-90"
      }`}
      style={{
        top: `${block.startSlot * SLOT_H + 2}px`,
        height: `${block.duration * SLOT_H - 4}px`,
      }}
    >
      <p className="text-[10px] font-bold leading-tight truncate">{block.label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <p className="text-[9px] opacity-80 truncate">{block.sublabel}</p>
        {block.isTrial && (
          <span className="flex-shrink-0 px-1 py-0.5 rounded bg-white/30 text-[8px] font-bold uppercase">TRIAL</span>
        )}
      </div>
    </div>
  )
}

/* ────── Selected Class Detail Panel ────── */

function SelectedClassPanel({
  block,
  onJoin,
  onAddLink,
  onEditLink,
  onComplete,
  onNotes,
  onReschedule,
  onCancel,
  onDeselect,
}: {
  block: Block
  onJoin: () => void
  onAddLink: () => void
  onEditLink: () => void
  onComplete: () => void
  onNotes: () => void
  onReschedule: () => void
  onCancel: () => void
  onDeselect: () => void
}) {
  const isActionable = ["scheduled", "confirmed"].includes(block.status)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#1E3A5F]/20 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1E293B]">{block.studentName}</h3>
          <p className="text-xs text-[#0D9488] font-medium mt-0.5">{block.subject}</p>
          <p className="text-xs text-gray-500 mt-0.5">{DAYS[block.dayIndex]} — {block.time}</p>
          {block.topicCovered && (
            <p className="text-xs text-gray-400 mt-1">Topic: {block.topicCovered}</p>
          )}
          {block.meetingLink && (
            <div className="flex items-center gap-1 mt-1">
              <LinkIcon className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{block.meetingLink}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {block.isTrial && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase">TRIAL</span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
            block.status === "completed" ? "bg-green-100 text-green-700" :
            block.status === "confirmed" ? "bg-teal-100 text-teal-700" :
            block.status === "scheduled" ? "bg-amber-100 text-amber-700" :
            "bg-gray-100 text-gray-600"
          }`}>{block.status}</span>
          <button onClick={onDeselect} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {isActionable && (
          <>
            {block.meetingLink ? (
              <>
                <button onClick={onJoin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors">
                  <ExternalLink className="w-3 h-3" />Join Class
                </button>
                <button onClick={onEditLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <LinkIcon className="w-3 h-3" />Edit Link
                </button>
              </>
            ) : (
              <button onClick={onAddLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors">
                <Video className="w-3 h-3" />Add Link
              </button>
            )}
            <button onClick={onComplete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#22C55E] text-white text-xs font-medium hover:bg-green-600 transition-colors">
              <CheckCircle className="w-3 h-3" />Mark Complete
            </button>
            <button onClick={onReschedule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
              <CalendarClock className="w-3 h-3" />Reschedule
            </button>
            <button onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#EF4444] text-[#EF4444] text-xs font-medium hover:bg-red-50 transition-colors">
              <XCircle className="w-3 h-3" />Cancel
            </button>
          </>
        )}
        {block.status === "completed" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />Completed
          </span>
        )}
        <button onClick={onNotes}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
          <FileText className="w-3 h-3" />{block.topicCovered ? "View Notes" : "Add Notes"}
        </button>
      </div>
    </div>
  )
}

/* ────── Main Component ────── */

export function TeacherScheduleClient({
  blocks: initialBlocks,
  dates,
  monthYear,
  todayIdx,
  legend,
  hasTrial,
  teacherTimezone,
  weekOffset,
  teacherAvailability,
  teacherBookedSlots,
  teacherBlockedDates,
  teacherName,
}: {
  blocks: Block[]
  dates: string[]
  monthYear: string
  todayIdx: number
  legend: LegendItem[]
  hasTrial: boolean
  teacherTimezone: string
  weekOffset: number
  teacherAvailability: Availability[]
  teacherBookedSlots: BookedSlot[]
  teacherBlockedDates: string[]
  teacherName: string
}) {
  const router = useRouter()
  const [view, setView] = useState<"day" | "week">("week")
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx >= 0 ? todayIdx : 0)

  // Local copy for in-place updates (re-sync when server sends new data on week change)
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)

  // When navigating weeks, initialBlocks changes from the server but useState
  // only uses its initializer on first mount. This keeps them in sync.
  React.useEffect(() => {
    setBlocks(initialBlocks)
    setSelectedBlockId(null) // deselect when changing week
  }, [initialBlocks])

  // Modal state
  const [completeBlock, setCompleteBlock] = useState<Block | null>(null)
  const [cancelBlock, setCancelBlock] = useState<Block | null>(null)
  const [rescheduleBlock, setRescheduleBlock] = useState<Block | null>(null)
  const [meetingLinkBlock, setMeetingLinkBlock] = useState<Block | null>(null)
  const [notesBlock, setNotesBlock] = useState<Block | null>(null)

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null

  /* ---- Navigation ---- */
  function goToWeek(offset: number) {
    router.push(`/teacher/schedule?week=${offset}`)
  }

  function goToToday() {
    router.push("/teacher/schedule")
  }

  /* ---- Handlers ---- */
  function handleBlockClick(block: Block) {
    setSelectedBlockId(block.id === selectedBlockId ? null : block.id)
  }

  function handleJoin(block: Block) {
    if (block.meetingLink) {
      window.open(block.meetingLink, "_blank", "noopener,noreferrer")
    }
  }

  function handleLinkSaved(classId: string, link: string) {
    setBlocks((prev) => prev.map((b) => (b.id === classId ? { ...b, meetingLink: link } : b)))
  }

  function handleNotesSaved(classId: string, topic: string) {
    setBlocks((prev) => prev.map((b) => (b.id === classId ? { ...b, topicCovered: topic } : b)))
  }

  /* ---- Formatted date for cancel/reschedule modals ---- */
  function formatScheduledDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  }

  /* ---- Day view blocks ---- */
  const dayBlocks = blocks.filter((b) => b.dayIndex === selectedDayIdx)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">My Schedule</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 capitalize transition-colors ${
                  view === v
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ WEEK VIEW ════════ */}
      {view === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => goToWeek(weekOffset - 1)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <h2 className="text-sm font-semibold text-[#1E293B]">Week of {monthYear}</h2>
              <button onClick={() => goToWeek(weekOffset + 1)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button onClick={goToToday}
              className={`text-xs font-medium hover:underline ${weekOffset === 0 ? "text-gray-300 cursor-default" : "text-[#0D9488]"}`}
              disabled={weekOffset === 0}>
              Today
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Day headers */}
              <div className="flex border-b border-gray-100">
                <div className="w-16 flex-shrink-0" />
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`flex-1 py-2 text-center border-l border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      i === todayIdx ? "bg-[#0D9488]/5" : ""
                    }`}
                    onClick={() => { setSelectedDayIdx(i); setView("day") }}
                  >
                    <p className={`text-[11px] font-medium ${i === todayIdx ? "text-[#0D9488]" : "text-gray-400"}`}>{day}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <p className={`text-base font-bold ${i === todayIdx ? "text-[#0D9488]" : "text-[#1E293B]"}`}>{dates[i]}</p>
                      {i === todayIdx && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#0D9488] text-white uppercase">Today</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time slots + blocks */}
              <div className="flex">
                <div className="w-16 flex-shrink-0">
                  {TIME_SLOTS.map((t) => (
                    <div key={t} className="flex items-start justify-end pr-2 pt-1" style={{ height: SLOT_H }}>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{t}</span>
                    </div>
                  ))}
                </div>

                {DAYS.map((day, dayIdx) => {
                  const dayBlocksCol = blocks.filter((b) => b.dayIndex === dayIdx)
                  return (
                    <div
                      key={day}
                      className={`flex-1 relative border-l border-gray-100 ${dayIdx === todayIdx ? "bg-[#0D9488]/[0.03]" : ""}`}
                      style={{ height: TIME_SLOTS.length * SLOT_H }}
                    >
                      {TIME_SLOTS.map((_, i) => (
                        <div key={i} className="absolute left-0 right-0 border-t border-gray-50" style={{ top: i * SLOT_H }} />
                      ))}
                      {dayBlocksCol.map((block) => (
                        <ClassBlock
                          key={block.id}
                          block={block}
                          isSelected={block.id === selectedBlockId}
                          onClick={() => handleBlockClick(block)}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ DAY VIEW ════════ */}
      {view === "day" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Day nav */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedDayIdx((d) => Math.max(0, d - 1))} disabled={selectedDayIdx === 0}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <h2 className="text-sm font-semibold text-[#1E293B]">
                {DAYS[selectedDayIdx]}, {dates[selectedDayIdx]} — {monthYear.split(",")[1]?.trim() || ""}
              </h2>
              <button onClick={() => setSelectedDayIdx((d) => Math.min(6, d + 1))} disabled={selectedDayIdx === 6}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{dayBlocks.length} class{dayBlocks.length !== 1 ? "es" : ""}</span>
              <button onClick={() => setView("week")} className="text-xs text-[#0D9488] font-medium hover:underline">
                Back to Week
              </button>
            </div>
          </div>

          {/* Single-day grid */}
          <div className="flex">
            <div className="w-20 flex-shrink-0">
              {TIME_SLOTS.map((t) => (
                <div key={t} className="flex items-start justify-end pr-3 pt-1" style={{ height: SLOT_H }}>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{t}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative border-l border-gray-100" style={{ height: TIME_SLOTS.length * SLOT_H }}>
              {TIME_SLOTS.map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-gray-50" style={{ top: i * SLOT_H }} />
              ))}
              {dayBlocks.map((block) => (
                <ClassBlock
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedBlockId}
                  onClick={() => handleBlockClick(block)}
                />
              ))}
              {dayBlocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-gray-300">No classes on this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ Selected Class Detail Panel ════════ */}
      {selectedBlock && (
        <SelectedClassPanel
          block={selectedBlock}
          onJoin={() => handleJoin(selectedBlock)}
          onAddLink={() => setMeetingLinkBlock(selectedBlock)}
          onEditLink={() => setMeetingLinkBlock(selectedBlock)}
          onComplete={() => setCompleteBlock(selectedBlock)}
          onNotes={() => setNotesBlock(selectedBlock)}
          onReschedule={() => setRescheduleBlock(selectedBlock)}
          onCancel={() => setCancelBlock(selectedBlock)}
          onDeselect={() => setSelectedBlockId(null)}
        />
      )}

      {/* Bottom action row (only when no block selected — hint to select) */}
      {!selectedBlock && blocks.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-400">
          <Info className="w-4 h-4 flex-shrink-0" />
          Click a class block above to see details and take actions (Join, Mark Complete, Reschedule, Cancel, Notes).
        </div>
      )}

      {/* Timezone info */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-4">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          All times shown in <strong>UTC</strong> (your configured timezone:{" "}
          <strong>{teacherTimezone}</strong>). Students see your availability
          converted to their local timezone. All class times are stored in UTC.{" "}
          <strong>Cancellation limit: 3/month.</strong>
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-xs text-gray-500 font-medium">Legend:</span>
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-l-2 ${l.cls}`} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
        {hasTrial && (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-[#F59E0B] text-[#1E293B] text-[8px] font-bold">TRIAL</span>
            <span className="text-xs text-gray-600">Trial class</span>
          </div>
        )}
      </div>

      {/* ════════ MODALS ════════ */}

      {completeBlock && (
        <CompleteClassModal
          open={!!completeBlock}
          onClose={() => setCompleteBlock(null)}
          onSuccess={() => window.location.reload()}
          classId={completeBlock.id}
          subject={completeBlock.subject}
          studentName={completeBlock.studentName}
          scheduledTime={completeBlock.time}
        />
      )}

      {cancelBlock && (
        <CancelClassModal
          open={!!cancelBlock}
          onClose={() => setCancelBlock(null)}
          onSuccess={() => window.location.reload()}
          classId={cancelBlock.id}
          subject={cancelBlock.subject}
          teacherName={teacherName}
          scheduledDate={formatScheduledDate(cancelBlock.scheduledAt)}
          scheduledTime={cancelBlock.time}
          cancelledBy="teacher"
        />
      )}

      {rescheduleBlock && (
        <RescheduleModal
          open={!!rescheduleBlock}
          onClose={() => setRescheduleBlock(null)}
          onSuccess={() => window.location.reload()}
          classId={rescheduleBlock.id}
          currentDate={formatScheduledDate(rescheduleBlock.scheduledAt)}
          currentTime={rescheduleBlock.time}
          teacherName={teacherName}
          subject={rescheduleBlock.subject}
          teacherAvailability={teacherAvailability}
          teacherBookedSlots={teacherBookedSlots}
          teacherBlockedDates={teacherBlockedDates}
        />
      )}

      {meetingLinkBlock && (
        <MeetingLinkModal
          open={!!meetingLinkBlock}
          onClose={() => setMeetingLinkBlock(null)}
          classId={meetingLinkBlock.id}
          subject={meetingLinkBlock.subject}
          studentName={meetingLinkBlock.studentName}
          time={meetingLinkBlock.time}
          existingLink={meetingLinkBlock.meetingLink}
          onLinkSaved={handleLinkSaved}
        />
      )}

      {notesBlock && (
        <NotesModal
          open={!!notesBlock}
          onClose={() => setNotesBlock(null)}
          classId={notesBlock.id}
          subject={notesBlock.subject}
          studentName={notesBlock.studentName}
          time={notesBlock.time}
          existingTopic={notesBlock.topicCovered}
          onSaved={handleNotesSaved}
        />
      )}
    </div>
  )
}
