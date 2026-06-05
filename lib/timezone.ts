/**
 * Format a Date to a human-readable string in a given IANA timezone.
 * Works consistently on server (Node.js) regardless of host TZ.
 */
export function formatDateTime(
    date: Date,
    timezone: string = "America/New_York",
    options?: {
      includeWeekday?: boolean
      includeYear?: boolean
      includeTime?: boolean
    }
  ): string {
    const {
      includeWeekday = true,
      includeYear = true,
      includeTime = true,
    } = options || {}
  
    const datePart = date.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: includeWeekday ? "long" : undefined,
      month: "long",
      day: "numeric",
      year: includeYear ? "numeric" : undefined,
    })
  
    if (!includeTime) return datePart
  
    const timePart = date.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    })
  
    return `${datePart} at ${timePart}`
  }
  
  /**
   * Format time range (e.g., "9:00 AM – 10:00 AM IST")
   */
  export function formatTimeRange(
    start: Date,
    durationMinutes: number,
    timezone: string = "America/New_York"
  ): string {
    const end = new Date(start.getTime() + durationMinutes * 60000)
  
    const startTime = start.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    })
  
    const endTime = end.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    })
  
    const tzAbbr = getTimezoneAbbr(timezone)
    return `${startTime} – ${endTime} ${tzAbbr}`
  }
  
  /**
   * Get a short abbreviation for common timezones.
   */
  function getTimezoneAbbr(tz: string): string {
    const map: Record<string, string> = {
      "America/New_York": "ET",
      "America/Chicago": "CT",
      "America/Denver": "MT",
      "America/Los_Angeles": "PT",
      "Asia/Kolkata": "IST",
      "Asia/Calcutta": "IST",
      "Europe/London": "GMT",
      "UTC": "UTC",
    }
    return map[tz] || tz.split("/").pop()?.replace(/_/g, " ") || tz
  }
  
  /**
   * Common timezone choices for dropdowns.
   */
  export const TIMEZONE_OPTIONS = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
    { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
    { value: "Australia/Sydney", label: "Australian Eastern (AEST)" },
  ]
  
// ─────────────────────────────────────────────────────
// TIMEZONE CONVERSION & COMPUTATION UTILITIES
// ─────────────────────────────────────────────────────

/**
 * Dynamic TZ abbreviation using Intl (DST-aware).
 * Returns "EST" / "EDT", "IST", etc.
 */
export function getTzAbbr(timezone: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(date)
    return parts.find((p) => p.type === "timeZoneName")?.value || timezone
  } catch {
    return timezone
  }
}

/**
 * Decompose a UTC Date into local components for a given timezone.
 */
export function utcToLocal(utcDate: Date, timezone: string) {
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

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const dayOfWeek = weekdayMap[get("weekday")] ?? 0

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

  return { year, month, day, hour, minute, dayOfWeek, dateStr, timeStr, formatted12h, dateFormatted }
}

/**
 * Convert a local date + time string into a UTC Date.
 */
export function localToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  const [hour, minute] = timeStr.split(":").map(Number)

  // Initial guess: treat the local time as if it were UTC
  const guessUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))

  // Check what the local time would be at that UTC instant
  const local = utcToLocal(guessUTC, timezone)

  // Compute the difference and adjust
  const desiredMin = hour * 60 + minute
  const actualMin = local.hour * 60 + local.minute
  const desiredDaySerial = year * 400 + month * 32 + day
  const actualDaySerial = local.year * 400 + local.month * 32 + local.day
  const dayDiffMin = (desiredDaySerial - actualDaySerial) * 1440

  const diffMin = dayDiffMin + (desiredMin - actualMin)
  return new Date(guessUTC.getTime() - diffMin * 60000)
}

/**
 * Get 7 calendar days (Mon–Sun) for a given week offset, as seen in a timezone.
 * Returns Date objects set to midnight UTC of each local date.
 */
export function getWeekDatesInTZ(weekOffset: number, timezone: string): Date[] {
  const now = new Date()
  const local = utcToLocal(now, timezone)

  const todayDate = new Date(Date.UTC(local.year, local.month - 1, local.day))
  const dow = todayDate.getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(todayDate.getTime() + (mondayOffset + weekOffset * 7) * 86400000)

  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(monday.getTime() + i * 86400000))
  }
  return dates
}

/**
 * Format a reference Date (midnight UTC) as "YYYY-MM-DD".
 */
export function refDateToLocalStr(refDate: Date): string {
  const y = refDate.getUTCFullYear()
  const m = String(refDate.getUTCMonth() + 1).padStart(2, "0")
  const d = String(refDate.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Convert 12-hour time string to 24-hour format.
 */
export function to24(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) {
    // Already 24h or plain HH:MM
    const [h, m] = time.trim().split(":").map(Number)
    return `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
  }
  let h = parseInt(match[1])
  const m = match[2]
  const period = match[3].toUpperCase()
  if (period === "AM" && h === 12) h = 0
  if (period === "PM" && h !== 12) h += 12
  return `${String(h).padStart(2, "0")}:${m}`
}

export const DAY_NAME_MAP: Record<number, string> = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
}

/**
 * Convert teacher availability slots into the viewer's timezone.
 *
 * Returns a Map<dateStr, timeStr[]> where both keys are in the viewer's TZ.
 * Also returns a parallel slotMap: Map<"dateStr_timeStr", utcISO> for booking submission.
 */
export function convertAvailabilitySlots(
  availability: { dayOfWeek: string; startTime: string; endTime: string }[],
  weekDates: Date[],
  teacherTimezone: string,
  viewerTimezone: string
): { availSlots: Map<string, string[]>; slotToUTC: Map<string, string> } {
  const availSlots = new Map<string, string[]>()
  const slotToUTC = new Map<string, string>()

  const dayNameToIdx: Record<string, number> = {
    MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3,
    FRIDAY: 4, SATURDAY: 5, SUNDAY: 6,
  }

  for (const avail of availability) {
    const dayIdx = dayNameToIdx[avail.dayOfWeek.toUpperCase()]
    if (dayIdx === undefined) continue

    const refDate = weekDates[dayIdx]
    if (!refDate) continue
    const refDateStr = refDateToLocalStr(refDate)

    const startH = parseInt(to24(avail.startTime).split(":")[0])
    const endH = parseInt(to24(avail.endTime).split(":")[0])

    for (let h = startH; h < endH; h++) {
      const teacherTimeStr = `${String(h).padStart(2, "0")}:00`

      // Teacher's local → UTC
      const utcDate = localToUTC(refDateStr, teacherTimeStr, teacherTimezone)

      // UTC → viewer's local
      const viewerLocal = utcToLocal(utcDate, viewerTimezone)

      const existing = availSlots.get(viewerLocal.dateStr) || []
      existing.push(viewerLocal.timeStr)
      availSlots.set(viewerLocal.dateStr, existing)

      slotToUTC.set(`${viewerLocal.dateStr}_${viewerLocal.timeStr}`, utcDate.toISOString())
    }
  }

  // Sort time slots within each date
  for (const [key, slots] of availSlots) {
    availSlots.set(key, slots.sort())
  }

  return { availSlots, slotToUTC }
}
