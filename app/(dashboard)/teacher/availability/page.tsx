"use client"

import React, { useState } from "react"
import { X, Plus, Info } from "lucide-react"

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

/* ─── Types ─── */
type TimeSlot = { start: string; end: string }
type DayConfig = { name: string; enabled: boolean; slots: TimeSlot[] }
type BlockedDate = { id: string; date: string; reason: string }

/* ─── Initial state ─── */
const INITIAL_DAYS: DayConfig[] = [
  { name: "Monday",    enabled: true,  slots: [{ start: "8:00 AM", end: "2:00 PM" }, { start: "4:00 PM", end: "6:00 PM" }] },
  { name: "Tuesday",   enabled: true,  slots: [{ start: "8:00 AM", end: "12:00 PM" }] },
  { name: "Wednesday", enabled: true,  slots: [{ start: "8:00 AM", end: "2:00 PM" }, { start: "4:00 PM", end: "6:00 PM" }] },
  { name: "Thursday",  enabled: true,  slots: [{ start: "8:00 AM", end: "2:00 PM" }] },
  { name: "Friday",    enabled: true,  slots: [{ start: "8:00 AM", end: "12:00 PM" }] },
  { name: "Saturday",  enabled: false, slots: [] },
  { name: "Sunday",    enabled: false, slots: [] },
]

const INITIAL_BLOCKED: BlockedDate[] = [
  { id: "bd1", date: "Mar 15, 2026",   reason: "Personal day" },
  { id: "bd2", date: "Mar 22–23, 2026",reason: "Weekend workshop" },
  { id: "bd3", date: "Apr 5, 2026",    reason: "Festival holiday" },
]

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
  const [days, setDays] = useState<DayConfig[]>(INITIAL_DAYS)
  const [blocked, setBlocked] = useState<BlockedDate[]>(INITIAL_BLOCKED)
  const [newDate, setNewDate] = useState("")
  const [newReason, setNewReason] = useState("")
  const [saved, setSaved] = useState(false)

  /* Day helpers */
  function toggleDay(idx: number) {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, enabled: !d.enabled } : d))
    )
  }
  function updateSlot(dayIdx: number, slotIdx: number, field: "start" | "end", value: string) {
    setDays((prev) =>
      prev.map((d, i) =>
        i !== dayIdx
          ? d
          : {
              ...d,
              slots: d.slots.map((s, si) =>
                si !== slotIdx ? s : { ...s, [field]: value }
              ),
            }
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

  /* Blocked date helpers */
  function addBlockedDate() {
    if (!newDate.trim()) return
    setBlocked((prev) => [
      ...prev,
      { id: `bd${Date.now()}`, date: newDate.trim(), reason: newReason.trim() || "Unavailable" },
    ])
    setNewDate("")
    setNewReason("")
  }
  function removeBlockedDate(id: string) {
    setBlocked((prev) => prev.filter((b) => b.id !== id))
  }

  /* Save */
  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Availability</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set your weekly recurring availability</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
            saved
              ? "bg-[#22C55E] text-white"
              : "bg-[#0D9488] text-white hover:bg-teal-700"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {/* ── Section A: Weekly Schedule ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-5">Weekly Schedule</h2>
        <div className="flex flex-col gap-5">
          {days.map((day, dayIdx) => (
            <div key={day.name} className={`flex flex-col gap-3 pb-5 border-b border-gray-50 last:border-0 last:pb-0 ${!day.enabled ? "opacity-50" : ""}`}>
              {/* Day row header */}
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm font-semibold text-[#1E293B]">{day.name}</span>
                <Toggle enabled={day.enabled} onChange={() => toggleDay(dayIdx)} />
                <span className="text-xs text-gray-400">{day.enabled ? "Available" : "Unavailable"}</span>
              </div>

              {/* Time slots */}
              {day.enabled && (
                <div className="flex flex-col gap-2 pl-28">
                  {day.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="flex items-center gap-2 flex-wrap">
                      <TimeSelect
                        value={slot.start}
                        onChange={(v) => updateSlot(dayIdx, slotIdx, "start", v)}
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <TimeSelect
                        value={slot.end}
                        onChange={(v) => updateSlot(dayIdx, slotIdx, "end", v)}
                      />
                      {day.slots.length > 1 && (
                        <button
                          onClick={() => removeSlot(dayIdx, slotIdx)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove slot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Add slot */}
                  <button
                    onClick={() => addSlot(dayIdx)}
                    className="inline-flex items-center gap-1 text-xs text-[#0D9488] font-medium hover:underline mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Slot
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
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            type="text"
            placeholder="e.g., Apr 10, 2026"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] w-44"
          />
          <input
            type="text"
            placeholder="e.g., Family event"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
          <button
            onClick={addBlockedDate}
            className="px-4 py-2 rounded-lg border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Block Date
          </button>
        </div>

        {/* Existing blocked dates */}
        <div className="flex flex-col gap-2">
          {blocked.length === 0 && (
            <p className="text-sm text-gray-400 italic">No blocked dates.</p>
          )}
          {blocked.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#1E293B] w-36">{b.date}</span>
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
                <strong>Your timezone:</strong> IST (Indian Standard Time, UTC+5:30). Students see your availability
                converted to their local timezone (EST/CST/MST/PST). All class times are stored in UTC and displayed
                in each user&apos;s timezone.
              </p>
              <div className="flex flex-wrap gap-6 mt-3 pt-3 border-t border-blue-200">
                <div>
                  <p className="text-xs text-blue-500 uppercase font-semibold tracking-wide">Current time for you</p>
                  <p className="text-base font-bold text-blue-900 mt-0.5">7:30 PM IST</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500 uppercase font-semibold tracking-wide">US East Coast</p>
                  <p className="text-base font-bold text-blue-900 mt-0.5">9:00 AM EST</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500 uppercase font-semibold tracking-wide">UTC</p>
                  <p className="text-base font-bold text-blue-900 mt-0.5">2:00 PM UTC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
