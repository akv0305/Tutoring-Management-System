"use client"

import React, { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Loader2, Clock, AlertTriangle } from "lucide-react"

/* ─── Types ─── */
type AvailabilitySlot = { dayOfWeek: string; startTime: string; endTime: string }
type BookedSlotAPI = { start: string; duration: number; subject?: string; student?: string }

/* ─── Fixed dual timezones for Admin / Coordinator ─── */
const TZ_CST = "America/Chicago"
const TZ_IST = "Asia/Kolkata"

/* ─── Helpers ─── */

const DAY_ORDER: Record<string, number> = {
  MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3,
  FRIDAY: 4, SATURDAY: 5, SUNDAY: 6,
}

/** Get dynamic TZ abbreviation (CDT/CST, IST, etc.) */
function tzAbbr(tz: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(date)
    return parts.find((p) => p.type === "timeZoneName")?.value || tz
  } catch {
    return tz
  }
}

/** Decompose a UTC Date into local parts for a given timezone */
function utcToLocal(utcDate: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(utcDate)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || ""

  const year = parseInt(get("year"))
  const month = parseInt(get("month"))
  const day = parseInt(get("day"))
  let hour = parseInt(get("hour"))
  if (hour === 24) hour = 0
  const minute = parseInt(get("minute"))

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

  const formatted12h = utcDate.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const dateFormatted = utcDate.toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return { year, month, day, hour, minute, dateStr, timeStr, formatted12h, dateFormatted }
}

/** Convert local date+time → UTC */
function localToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  const [hour, minute] = timeStr.split(":").map(Number)
  const guessUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  const local = utcToLocal(guessUTC, timezone)
  const desiredMin = hour * 60 + minute
  const actualMin = local.hour * 60 + local.minute
  const desiredDaySerial = year * 400 + month * 32 + day
  const actualDaySerial = local.year * 400 + local.month * 32 + local.day
  const dayDiffMin = (desiredDaySerial - actualDaySerial) * 1440
  const diffMin = dayDiffMin + (desiredMin - actualMin)
  return new Date(guessUTC.getTime() - diffMin * 60000)
}

/** Format time for display: "9:00 AM" */
function fmt12(time24: string): string {
  const h = parseInt(time24.split(":")[0], 10)
  const m = time24.split(":")[1] || "00"
  if (h === 0) return `12:${m} AM`
  if (h < 12) return `${h}:${m} AM`
  if (h === 12) return `12:${m} PM`
  return `${h - 12}:${m} PM`
}

/** Get Monday–Sunday dates for a week offset from today */
function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today.getTime() + (mondayOffset + weekOffset * 7) * 86400000)
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86400000))
}

/** Format a Date as YYYY-MM-DD */
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/* ─── Dual-TZ time string ─── */
function dualTimeStr(utcDate: Date): string {
  const ist = utcToLocal(utcDate, TZ_IST)
  const cst = utcToLocal(utcDate, TZ_CST)
  const istLabel = tzAbbr(TZ_IST, utcDate)
  const cstLabel = tzAbbr(TZ_CST, utcDate)
  return `${ist.formatted12h} ${istLabel}  ·  ${cst.formatted12h} ${cstLabel}`
}

function dualTimeRange(utcStart: Date, durationMin: number): string {
  const utcEnd = new Date(utcStart.getTime() + durationMin * 60000)
  const istStart = utcToLocal(utcStart, TZ_IST)
  const istEnd = utcToLocal(utcEnd, TZ_IST)
  const cstStart = utcToLocal(utcStart, TZ_CST)
  const cstEnd = utcToLocal(utcEnd, TZ_CST)
  const istLabel = tzAbbr(TZ_IST, utcStart)
  const cstLabel = tzAbbr(TZ_CST, utcStart)

  const istRange = `${istStart.formatted12h} – ${istEnd.formatted12h} ${istLabel}`
  const cstRange = `${cstStart.formatted12h} – ${cstEnd.formatted12h} ${cstLabel}`

  // If the CST date differs from IST date, add the date
  const cstDateNote = cstStart.dateStr !== istStart.dateStr ? ` (${cstStart.dateFormatted})` : ""

  return `${istRange}  ·  ${cstRange}${cstDateNote}`
}

/* ─── Types for internal processing ─── */
type ProcessedSlot = {
  utcStart: Date
  utcEnd: Date
  durationMin: number
}

type DayData = {
  dateISO: string
  dateLabel: string       // "Mon, Jun 9"
  isBlocked: boolean
  isPast: boolean
  isToday: boolean
  availableRanges: ProcessedSlot[]
  bookedClasses: {
    utcStart: Date
    durationMin: number
    subject: string
    student: string
  }[]
}

/* ─── Main Component ─── */

export function TeacherAvailabilityList({
  teacherId,
  teacherTimezone,
  availabilitySlots,
  blockedDates: preloadedBlockedDates,
}: {
  teacherId: string
  teacherTimezone: string
  availabilitySlots: AvailabilitySlot[]
  blockedDates: string[]
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [bookedSlots, setBookedSlots] = useState<BookedSlotAPI[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>(preloadedBlockedDates)
  const [loading, setLoading] = useState(true)

  // Fetch live data on mount
  useEffect(() => {
    setLoading(true)
    fetch(`/api/classes/teacher-slots?teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((d) => {
        setBookedSlots(d.bookedSlots || [])
        setBlockedDates(d.blockedDates || preloadedBlockedDates)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [teacherId])

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])
  const now = new Date()
  const todayISO = toISO(now)

  // Build availability by day-of-week index (0=Mon, 6=Sun)
  const availByDay = useMemo(() => {
    const map: Record<number, { startH: number; endH: number }[]> = {}
    availabilitySlots.forEach((a) => {
      const dayIdx = DAY_ORDER[a.dayOfWeek]
      if (dayIdx === undefined) return
      if (!map[dayIdx]) map[dayIdx] = []
      const startH = parseInt(a.startTime.split(":")[0], 10)
      const endH = parseInt(a.endTime.split(":")[0], 10)
      map[dayIdx].push({ startH, endH })
    })
    // Sort ranges within each day
    Object.values(map).forEach((ranges) => ranges.sort((a, b) => a.startH - b.startH))
    return map
  }, [availabilitySlots])

  // Map booked slots by date (in teacher's timezone)
  const bookedByDate = useMemo(() => {
    const map: Record<string, BookedSlotAPI[]> = {}
    bookedSlots.forEach((b) => {
      const utc = new Date(b.start)
      const local = utcToLocal(utc, teacherTimezone)
      if (!map[local.dateStr]) map[local.dateStr] = []
      map[local.dateStr].push(b)
    })
    return map
  }, [bookedSlots, teacherTimezone])

  // Process each day into DayData
  const days: DayData[] = useMemo(() => {
    return weekDates.map((d) => {
      const dateISO = toISO(d)
      const jsDay = d.getDay()
      const calDayIdx = jsDay === 0 ? 6 : jsDay - 1
      const isBlocked = blockedSet.has(dateISO)
      const isPast = d < new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const isToday = dateISO === todayISO

      const dateLabel = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })

      // Available ranges (converted to UTC for dual-TZ display)
      const availableRanges: ProcessedSlot[] = []
      if (!isBlocked && !isPast) {
        const dayRanges = availByDay[calDayIdx] || []
        dayRanges.forEach(({ startH, endH }) => {
          const durationMin = (endH - startH) * 60
          const teacherLocalTimeStr = `${String(startH).padStart(2, "0")}:00`
          const utcStart = localToUTC(dateISO, teacherLocalTimeStr, teacherTimezone)
          const utcEnd = new Date(utcStart.getTime() + durationMin * 60000)

          // If today, skip ranges that have fully passed
          if (isToday && utcEnd.getTime() < now.getTime()) return

          availableRanges.push({ utcStart, utcEnd, durationMin })
        })
      }

      // Booked classes for this date
      const dayBooked = (bookedByDate[dateISO] || []).map((b) => ({
        utcStart: new Date(b.start),
        durationMin: b.duration || 60,
        subject: b.subject || "Class",
        student: b.student || "—",
      }))

      return { dateISO, dateLabel, isBlocked, isPast, isToday, availableRanges, bookedClasses: dayBooked }
    })
  }, [weekDates, blockedSet, availByDay, bookedByDate, teacherTimezone, todayISO])

  const istLabel = tzAbbr(TZ_IST)
  const cstLabel = tzAbbr(TZ_CST)

  if (availabilitySlots.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        No availability set for this teacher.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header: week nav + TZ legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-[#1E293B] min-w-[180px] text-center">
            {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
            {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(3, o + 1))}
            disabled={weekOffset >= 3}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Times in <strong>{istLabel}</strong> &amp; <strong>{cstLabel}</strong></span>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-8 text-center">
          <Loader2 className="w-5 h-5 text-[#0D9488] animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-2">Loading schedule…</p>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => (
            <div
              key={day.dateISO}
              className={`rounded-lg border overflow-hidden ${
                day.isBlocked
                  ? "border-red-200 bg-red-50/50"
                  : day.isPast
                  ? "border-gray-100 bg-gray-50/50"
                  : day.isToday
                  ? "border-teal-200 bg-teal-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Day header */}
              <div
                className={`px-4 py-2.5 flex items-center justify-between ${
                  day.isToday ? "bg-teal-50" : day.isBlocked ? "bg-red-50" : day.isPast ? "bg-gray-50" : "bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      day.isToday ? "text-[#0D9488]" : day.isPast ? "text-gray-400" : "text-[#1E293B]"
                    }`}
                  >
                    {day.dateLabel}
                  </span>
                  {day.isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0D9488] text-white uppercase">
                      Today
                    </span>
                  )}
                </div>
                {day.isBlocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-600 border border-red-200">
                    <AlertTriangle className="w-3 h-3" /> Blocked
                  </span>
                )}
                {day.isPast && !day.isBlocked && (
                  <span className="text-[10px] text-gray-400 font-medium">Past</span>
                )}
              </div>

              {/* Day body */}
              {!day.isBlocked && !day.isPast && (
                <div className="px-4 py-3 space-y-3">
                  {/* Available */}
                  {day.availableRanges.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        Available
                      </p>
                      <div className="space-y-1">
                        {day.availableRanges.map((slot, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 border border-green-100"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-xs text-green-800 font-medium">
                              {dualTimeRange(slot.utcStart, slot.durationMin)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No availability</p>
                  )}

                  {/* Booked */}
                  {day.bookedClasses.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        Booked
                      </p>
                      <div className="space-y-1.5">
                        {day.bookedClasses.map((cls, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 rounded-md bg-red-50 border border-red-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-800 font-medium">
                                {dualTimeRange(cls.utcStart, cls.durationMin)}
                              </span>
                            </div>
                            <p className="text-[11px] text-red-600 mt-0.5 ml-3.5">
                              {cls.subject} — {cls.student}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Blocked body */}
              {day.isBlocked && (
                <div className="px-4 py-3">
                  <p className="text-xs text-red-500 italic">
                    Teacher has blocked this date. No classes can be scheduled.
                  </p>
                </div>
              )}

              {/* Past body (collapsed) */}
              {day.isPast && !day.isBlocked && (
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-400 italic">Past date</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Booked
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-200" /> Blocked
        </span>
      </div>
    </div>
  )
}
