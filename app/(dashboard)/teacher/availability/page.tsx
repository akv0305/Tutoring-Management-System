"use client"

import React, { useState, useEffect, useCallback } from "react"
import { X, Plus, Info, Loader2, AlertTriangle, CheckCircle } from "lucide-react"

/* ─── Time slot options (6 AM – 10 PM, 30-min increments) ─── */
function buildTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 6; h <= 22; h++) {
    const ampm = h < 12 ? "AM" : "PM"
    const hour = h <= 12 ? h : h - 12
    times.push(`${hour}:00 ${ampm}`)
    if (h < 22) times.push(`${hour}:30 ${ampm}`)
  }
  return times
}
const TIME_OPTIONS = buildTimeOptions()

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAY_ENUM: Record<string, string> = {
  Monday: "MONDAY", Tuesday: "TUESDAY", Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY", Friday: "FRIDAY", Saturday: "SATURDAY", Sunday: "SUNDAY",
}

/* ─── Types ─── */
type TimeSlot = { start: string; end: string }
type DayConfig = { name: string; enabled: boolean; slots: TimeSlot[] }
type BlockedDate = { id: string; date: string; reason: string }

/* ─── Toggle switch ─── */
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-[#0D9488]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}

/* ─── Time dropdown ─── */
function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-2 py-1.5 rounded-md border border-gray-200 text-xs text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  )
}

/* ─── Page ─── */
export default function AvailabilityPage() {
  const [days, setDays] = useState<DayConfig[]>(
    DAY_NAMES.map((name) => ({ name, enabled: false, slots: [] }))
  )
  const [blocked, setBlocked] = useState<BlockedDate[]>([])
  const [newDate, setNewDate] = useState("")
  const [newReason, setNewReason] = useState("")
  const [teacherTimezone, setTeacherTimezone] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [blockError, setBlockError] = useState<{ message: string; classes?: string[] } | null>(null)
  const [blockLoading, setBlockLoading] = useState(false)

  /* ─── Fetch data on mount ─── */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/availability")
      if (!res.ok) return
      const data = await res.json()

      setTeacherTimezone(data.timezone || "")

      // Build day configs from availabilities
      const dayMap = new Map<string, TimeSlot[]>()
      for (const a of data.availabilities) {
        const dayName = a.dayOfWeek.charAt(0) + a.dayOfWeek.slice(1).toLowerCase()
        if (!dayMap.has(dayName)) dayMap.set(dayName, [])
        dayMap.get(dayName)!.push({ start: a.startTime, end: a.endTime })
      }

      setDays(
        DAY_NAMES.map((name) => {
          const slots = dayMap.get(name) || []
          return { name, enabled: slots.length > 0, slots }
        })
      )

      setBlocked(
        data.blockedDates.map((b: any) => ({
          id: b.id,
          date: b.date,
          reason: b.reason,
        }))
      )
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ─── Day helpers ─── */
  function toggleDay(idx: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === idx
          ? {
              ...d,
              enabled: !d.enabled,
              slots: !d.enabled && d.slots.length === 0 ? [{ start: "8:00 AM", end: "2:00 PM" }] : d.slots,
            }
          : d
      )
    )
  }
  function updateSlot(dayIdx: number, slotIdx: number, field: "start" | "end", value: string) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx ? d : { ...d, slots: d.slots.map((s, si) => (si !== slotIdx ? s : { ...s, [field]: value })) }
      )
    )
  }
  function addSlot(dayIdx: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx ? d : { ...d, slots: [...d.slots, { start: "8:00 AM", end: "10:00 AM" }] }
      )
    )
  }
  function removeSlot(dayIdx: number, slotIdx: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx ? d : { ...d, slots: d.slots.filter((_, si) => si !== slotIdx) }
      )
    )
  }

  /* ─── Save weekly schedule ─── */
  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save")
      }
      setSaveMsg({ type: "success", text: "Schedule saved!" })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (e: any) {
      setSaveMsg({ type: "error", text: e.message })
    } finally {
      setSaving(false)
    }
  }

  /* ─── Block date (with conflict check) ─── */
  async function addBlockedDate() {
    if (!newDate.trim()) return
    setBlockError(null)
    setBlockLoading(true)
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, reason: newReason.trim() || "Unavailable" }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "conflict") {
          setBlockError({ message: data.message, classes: data.classes })
        } else {
          setBlockError({ message: data.error || data.message || "Failed to block date" })
        }
        return
      }

      setBlocked((prev) => [...prev, data.blockedDate])
      setNewDate("")
      setNewReason("")
    } catch {
      setBlockError({ message: "Network error. Please try again." })
    } finally {
      setBlockLoading(false)
    }
  }

  /* ─── Remove blocked date ─── */
  async function removeBlockedDate(id: string) {
    try {
      const res = await fetch("/api/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setBlocked((prev) => prev.filter((b) => b.id !== id))
      }
    } catch {}
  }

  /* ─── Format date for display ─── */
  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Availability</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set your weekly recurring availability</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.type === "success" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {saveMsg.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Section A: Weekly Schedule ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-5">Weekly Schedule</h2>
        <div className="flex flex-col gap-5">
          {days.map((day, dayIdx) => (
            <div key={day.name} className={`flex flex-col gap-3 pb-5 border-b border-gray-50 last:border-0 last:pb-0 ${!day.enabled ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm font-semibold text-[#1E293B]">{day.name}</span>
                <Toggle enabled={day.enabled} onChange={() => toggleDay(dayIdx)} />
                <span className="text-xs text-gray-400">{day.enabled ? "Available" : "Unavailable"}</span>
              </div>
              {day.enabled && (
                <div className="flex flex-col gap-2 pl-28">
                  {day.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="flex items-center gap-2 flex-wrap">
                      <TimeSelect value={slot.start} onChange={(v) => updateSlot(dayIdx, slotIdx, "start", v)} />
                      <span className="text-xs text-gray-400">to</span>
                      <TimeSelect value={slot.end} onChange={(v) => updateSlot(dayIdx, slotIdx, "end", v)} />
                      {day.slots.length > 1 && (
                        <button onClick={() => removeSlot(dayIdx, slotIdx)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove slot">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addSlot(dayIdx)} className="inline-flex items-center gap-1 text-xs text-[#0D9488] font-medium hover:underline mt-1">
                    <Plus className="w-3 h-3" />Add Slot
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section B: Blocked Dates ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#1E293B]">Block Specific Dates</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Mark dates when you are unavailable (vacation, personal days).
          </p>
        </div>

        {/* Add new blocked date */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="date"
            value={newDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => { setNewDate(e.target.value); setBlockError(null) }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] w-48"
          />
          <input
            type="text"
            placeholder="Reason (e.g., Family event)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
          <button
            onClick={addBlockedDate}
            disabled={!newDate || blockLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {blockLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Block Date
          </button>
        </div>

        {/* Conflict error */}
        {blockError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">{blockError.message}</p>
                {blockError.classes && blockError.classes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {blockError.classes.map((c, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing blocked dates */}
        <div className="flex flex-col gap-2">
          {blocked.length === 0 && (
            <p className="text-sm text-gray-400 italic">No blocked dates.</p>
          )}
          {blocked.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#1E293B] w-44">{formatDate(b.date)}</span>
                <span className="text-sm text-gray-600">{b.reason}</span>
              </div>
              <button
                onClick={() => removeBlockedDate(b.id)}
                className="p-1.5 rounded-md text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section C: Timezone Info ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">Timezone Information</h2>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Your timezone:</strong> {teacherTimezone || "Not set"}. Students see your availability
                converted to their local timezone. All class times are stored in UTC and displayed
                in each user&apos;s timezone.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* ── Bottom Save Button ── */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm text-gray-500">
          Remember to save your weekly schedule after making changes.
          <span className="text-xs text-gray-400 ml-1">(Blocked dates are saved automatically)</span>
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.type === "success" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {saveMsg.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
