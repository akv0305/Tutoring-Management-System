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
  