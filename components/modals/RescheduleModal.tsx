"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, CalendarClock, Loader2, AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight } from "lucide-react"

type BookedSlot = { start: string; duration: number }
type Availability = { dayOfWeek: string; startTime: string; endTime: string }

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  classId: string
  currentDate: string
  currentTime: string
  teacherName: string
  subject: string
  teacherAvailability: Availability[]
  teacherBookedSlots: BookedSlot[]
  teacherBlockedDates: string[]
}

const DAY_JS_MAP: Record<number, string> = {
  1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY",
  5: "FRIDAY", 6: "SATURDAY", 0: "SUNDAY",
}

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + mondayOffset + weekOffset * 7
  ))
  return Array.from({ length: 7 }, (_, i) => {
    return new Date(Date.UTC(
      monday.getUTCFullYear(),
      monday.getUTCMonth(),
      monday.getUTCDate() + i
    ))
  })
}

function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [sh] = startTime.split(":").map(Number)
  const [eh] = endTime.split(":").map(Number)
  for (let h = sh; h < eh; h++) slots.push(`${String(h).padStart(2, "0")}:00`)
  return slots
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

export function RescheduleModal({
  open, onClose, onSuccess, classId, currentDate, currentTime,
  teacherName, subject, teacherAvailability, teacherBookedSlots, teacherBlockedDates,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [policy, setPolicy] = useState<any>(null)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedDate("")
      setSelectedTime("")
      setError("")
      setSuccess(false)
      setPolicy(null)
      setWeekOffset(0)
      // Fetch policy
      setPolicyLoading(true)
      fetch(`/api/classes/policy?classId=${classId}&action=reschedule`)
        .then((r) => r.json())
        .then((d) => setPolicy(d))
        .catch(() => {})
        .finally(() => setPolicyLoading(false))
    }
  }, [open, classId])

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const now = new Date()

  const availMap = useMemo(() => {
    const m = new Map<string, Availability>()
    teacherAvailability.forEach((a) => m.set(a.dayOfWeek, a))
    return m
  }, [teacherAvailability])

  const bookedSet = useMemo(() => {
    const s = new Set<string>()
    teacherBookedSlots.forEach((b) => {
      const d = new Date(b.start)
      const key = `${d.toISOString().split("T")[0]}_${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
      s.add(key)
    })
    return s
  }, [teacherBookedSlots])

  const blockedSet = useMemo(() => new Set(teacherBlockedDates), [teacherBlockedDates])

  async function handleReschedule() {
    if (!selectedDate || !selectedTime) return setError("Please select a new date and time.")
    setError("")
    setLoading(true)
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00Z`).toISOString()
      const res = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: classId, action: "reschedule", scheduledAt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to reschedule")
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
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Reschedule Class</h2>
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
            <p className="text-lg font-semibold text-[#1E293B] mt-3">Class Rescheduled!</p>
            <p className="text-sm text-gray-500 mt-1">
              Moved to {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedTime && formatTime(selectedTime)}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Current schedule */}
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Currently scheduled: <strong>{currentDate}</strong> at <strong>{currentTime}</strong>
              </p>
            </div>

            {/* Policy info */}
            {policyLoading && <p className="text-sm text-gray-400">Checking reschedule policy…</p>}
            {policy && !policy.allowed && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Reschedule not allowed</p>
                  <p className="mt-0.5">{policy.reason || policy.message}</p>
                </div>
              </div>
            )}
            {policy && policy.allowed && policy.tier === "late_fee" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Late Reschedule — {policy.feePercent}% fee applies</p>
                  <p className="mt-0.5">{policy.message}</p>
                  {policy.feeAmount > 0 && <p className="mt-1 font-semibold">Fee: ${policy.feeAmount}</p>}
                </div>
              </div>
            )}
            {policy && policy.allowed && policy.tier === "free" && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {policy.message}
              </div>
            )}
            {policy && (
              <p className="text-xs text-gray-400">
                Reschedule {policy.rescheduleCount}/{policy.maxReschedules} used • Class in {policy.hoursUntilClass?.toFixed(1)} hours
              </p>
            )}

            {/* Calendar picker */}
            {policy?.allowed && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1E293B]">Pick a new slot</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs text-gray-500">
                      {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                    </span>
                    <button onClick={() => setWeekOffset((w) => Math.min(3, w + 1))} disabled={weekOffset >= 3}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="grid grid-cols-8 gap-1 mb-1">
                      <div className="text-xs text-gray-400 text-center py-1">UTC</div>
                      {weekDates.map((d, i) => {
                        const isToday = d.toISOString().split("T")[0] === now.toISOString().split("T")[0]
                        return (
                          <div key={i} className={`text-center py-1 rounded ${isToday ? "bg-[#1E3A5F] text-white" : ""}`}>
                            <p className={`text-[10px] ${isToday ? "text-white/80" : "text-gray-500"}`}>
                            {d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                            </p>
                            <p className={`text-xs font-bold ${isToday ? "text-white" : "text-[#1E293B]"}`}>{d.getUTCDate()}</p>
                          </div>
                        )
                      })}
                    </div>
                    {(() => {
                      const allSlots = new Set<string>()
                      teacherAvailability.forEach((a) => generateSlots(a.startTime, a.endTime).forEach((s) => allSlots.add(s)))
                      return Array.from(allSlots).sort().map((timeSlot) => (
                        <div key={timeSlot} className="grid grid-cols-8 gap-1 mb-0.5">
                          <div className="text-[10px] text-gray-400 py-1.5 text-center">{formatTime(timeSlot)}</div>
                          {weekDates.map((dateObj, dayIdx) => {
                            const dayName = DAY_JS_MAP[dateObj.getUTCDay()]
                            const avail = availMap.get(dayName)
                            const dateStr = dateObj.toISOString().split("T")[0]
                            const todayStr = now.toISOString().split("T")[0]
                            const isPast = dateStr < todayStr
                            const isPastToday = dateStr === todayStr && Number(timeSlot.split(":")[0]) <= now.getUTCHours()
                            const isBlocked = blockedSet.has(dateStr)
                            const isBooked = bookedSet.has(`${dateStr}_${timeSlot}`)
                            const inWindow = avail && timeSlot >= avail.startTime && timeSlot < avail.endTime
                            const unavailable = !inWindow || isPast || isPastToday || isBlocked || isBooked
                            const isSelected = selectedDate === dateStr && selectedTime === timeSlot

                            if (unavailable) {
                              return <div key={dayIdx} className={`py-1.5 rounded text-center text-[10px] ${isBooked ? "bg-red-50 text-red-300" : "bg-gray-50 text-gray-300"}`}>
                                {isBooked ? "Booked" : "—"}
                              </div>
                            }
                            return (
                              <button key={dayIdx}
                                onClick={() => { setSelectedDate(dateStr); setSelectedTime(timeSlot) }}
                                className={`py-1.5 rounded text-center text-[10px] font-medium transition-all ${
                                  isSelected
                                    ? "bg-[#0D9488] text-white shadow-sm ring-2 ring-[#0D9488]/30"
                                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                }`}>
                                {isSelected ? "✓ New" : "Open"}
                              </button>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
                    New time: <strong>
                      {new Date(selectedDate + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })}
                    </strong> at <strong>{formatTime(selectedTime)} UTC</strong>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!success && policy?.allowed && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleReschedule} disabled={loading || !selectedDate || !selectedTime}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Rescheduling…</> : "Confirm Reschedule"}
            </button>
          </div>
        )}
        {!success && policy && !policy.allowed && (
          <div className="flex items-center justify-end p-5 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
