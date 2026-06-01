"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Filter, Star, X, Calendar, Clock, MapPin, Mail, Phone,
  ChevronLeft, ChevronRight, Check, Loader2
} from "lucide-react"

/* ─── Types ─── */
type AvailabilitySlot = { dayOfWeek: string; startTime: string; endTime: string }
type UpcomingClass = { scheduledAt: string; duration: number; subject: string; student: string }

type Teacher = {
  id: string; name: string; initials: string; email: string; phone: string | null
  qualification: string; bio: string | null; subjects: string[]
  rating: number; reviews: number; experience: string; activeStudents: number
  status: string; timezone: string; availabilitySlots: AvailabilitySlot[]
  blockedDates: string[]; upcomingClasses: UpcomingClass[]
  weeklyHours: number; upcomingClassCount: number
}

type BookedSlot = { start: string; duration: number }

/* ─── Constants ─── */
const AVATAR_COLORS = ["bg-[#1E3A5F]","bg-[#0D9488]","bg-purple-700","bg-emerald-700","bg-rose-700","bg-indigo-700","bg-amber-700","bg-cyan-700"]
const SUBJECT_COLOR_MAP: Record<string, string> = {
  Mathematics: "bg-teal-50 text-teal-700 border-teal-200",
  Physics: "bg-blue-50 text-blue-700 border-blue-200",
  Chemistry: "bg-emerald-50 text-emerald-700 border-emerald-200",
  English: "bg-amber-50 text-amber-700 border-amber-200",
  Science: "bg-teal-50 text-teal-700 border-teal-200",
  "SAT Prep": "bg-purple-50 text-purple-700 border-purple-200",
  "ACT Prep": "bg-orange-50 text-orange-700 border-orange-200",
  "Computer Science": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Test Prep": "bg-orange-50 text-orange-700 border-orange-200",
  Languages: "bg-rose-50 text-rose-700 border-rose-200",
}
const DEFAULT_SUBJECT_COLOR = "bg-gray-100 text-gray-600 border-gray-200"
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const DAY_ORDER: Record<string, number> = { MONDAY:0,TUESDAY:1,WEDNESDAY:2,THURSDAY:3,FRIDAY:4,SATURDAY:5,SUNDAY:6 }
const DAY_LABELS: Record<string, string> = { MONDAY:"Monday",TUESDAY:"Tuesday",WEDNESDAY:"Wednesday",THURSDAY:"Thursday",FRIDAY:"Friday",SATURDAY:"Saturday",SUNDAY:"Sunday" }

function getAvatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }
function getSubjectColor(s: string) { return SUBJECT_COLOR_MAP[s] ?? DEFAULT_SUBJECT_COLOR }
function getAvailability(status: string) {
  switch (status) {
    case "active": return { label: "Available", cls: "text-green-600 bg-green-50 border-green-200" }
    case "on_leave": return { label: "On Leave", cls: "text-red-600 bg-red-50 border-red-200" }
    case "inactive": return { label: "Inactive", cls: "text-gray-500 bg-gray-50 border-gray-200" }
    default: return { label: "Unknown", cls: "text-gray-500 bg-gray-50 border-gray-200" }
  }
}
function formatTime12(time24: string) {
  const h = parseInt(time24.split(":")[0], 10)
  if (h === 0) return "12 AM"; if (h < 12) return `${h} AM`; if (h === 12) return "12 PM"; return `${h - 12} PM`
}

/* ─── Star Rating ─── */
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} className="w-3.5 h-3.5" fill={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"} stroke={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"} />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#1E293B]">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

/* ─── Weekly Schedule Grid with Navigation & Booked Slots ─── */
function WeeklyScheduleGrid({ teacherId, availability }: { teacherId: string; availability: AvailabilitySlot[] }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  // Fetch booked slots from API
  useEffect(() => {
    setLoadingSchedule(true)
    fetch(`/api/classes/teacher-slots?teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((d) => {
        setBookedSlots(d.bookedSlots || [])
        setBlockedDates(d.blockedDates || [])
      })
      .catch(() => {})
      .finally(() => setLoadingSchedule(false))
  }, [teacherId])

  const hours = Array.from({ length: 12 }, (_, i) => i + 8)
  const now = new Date()

  const weekDates = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = today.getDay()
    const startMonday = new Date(today)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) startMonday.setDate(today.getDate() - (dayOfWeek - 1))
    else if (dayOfWeek === 6) startMonday.setDate(today.getDate() + 2)
    else startMonday.setDate(today.getDate() + 1)
    startMonday.setDate(startMonday.getDate() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(startMonday); d.setDate(startMonday.getDate() + i); return d })
  }, [weekOffset])

  const availByDay = useMemo(() => {
    const map: Record<number, { start: number; end: number }[]> = {}
    availability.forEach((a) => {
      const dayIdx = DAY_ORDER[a.dayOfWeek]; if (dayIdx === undefined) return
      if (!map[dayIdx]) map[dayIdx] = []
      map[dayIdx].push({ start: parseInt(a.startTime.split(":")[0], 10), end: parseInt(a.endTime.split(":")[0], 10) })
    })
    return map
  }, [availability])

  const bookedSet = useMemo(() => {
    const set = new Set<string>()
    bookedSlots.forEach((b) => {
      const d = new Date(b.start)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      set.add(`${iso}_${String(d.getHours()).padStart(2, "0")}:00`)
    })
    return set
  }, [bookedSlots])

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])

  if (availability.length === 0) {
    return <div className="text-center py-4 text-sm text-gray-400">No availability set for this teacher.</div>
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button onClick={() => setWeekOffset((o) => Math.max(0, o - 1))} disabled={weekOffset === 0}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-[#1E293B]">
          {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <button onClick={() => setWeekOffset((o) => Math.min(3, o + 1))} disabled={weekOffset >= 3}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loadingSchedule ? (
        <div className="py-6 text-center"><Loader2 className="w-5 h-5 text-[#0D9488] animate-spin mx-auto" /><p className="text-xs text-gray-400 mt-1">Loading schedule…</p></div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[490px]">
            <div className="flex border-b border-gray-100">
              <div className="w-14 flex-shrink-0" />
              {weekDates.map((d, i) => {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                const isBlocked = blockedSet.has(iso)
                const isToday = d.toDateString() === now.toDateString()
                return (
                  <div key={i} className={`flex-1 text-center py-1.5 border-l border-gray-100 ${isBlocked ? "bg-red-50" : isToday ? "bg-teal-50/50" : ""}`}>
                    <p className="text-[9px] font-semibold text-gray-500">{DAYS_SHORT[i]}</p>
                    <p className={`text-xs font-bold ${isToday ? "text-[#0D9488]" : "text-[#1E293B]"}`}>{d.getDate()}</p>
                    {isBlocked && <p className="text-[7px] text-red-500 font-medium">Blocked</p>}
                  </div>
                )
              })}
            </div>

            <div className="flex">
              <div className="w-14 flex-shrink-0">
                {hours.map((h) => (
                  <div key={h} className="h-[26px] flex items-center justify-end pr-1.5">
                    <span className="text-[9px] text-gray-400">{formatTime12(`${h}:00`)}</span>
                  </div>
                ))}
              </div>
              {weekDates.map((d, dayIdx) => {
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                const jsDay = d.getDay()
                const calDayIdx = jsDay === 0 ? 6 : jsDay - 1
                const daySlots = availByDay[calDayIdx] || []
                const isBlocked = blockedSet.has(iso)
                const isPastDay = d < new Date(now.getFullYear(), now.getMonth(), now.getDate())

                return (
                  <div key={dayIdx} className="flex-1 border-l border-gray-100">
                    {hours.map((h) => {
                      const timeStr = `${String(h).padStart(2, "0")}:00`
                      const slotKey = `${iso}_${timeStr}`
                      const isAvailable = !isBlocked && !isPastDay && daySlots.some((s) => h >= s.start && h < s.end)
                      const isBooked = bookedSet.has(slotKey)
                      const isPastHour = isPastDay || (d.toDateString() === now.toDateString() && h <= now.getHours())

                      let cellCls = "bg-white"
                      let content: React.ReactNode = null

                      if (isBooked) {
                        cellCls = "bg-red-50"
                        content = <span className="text-[7px] text-red-500 font-semibold">Booked</span>
                      } else if (isAvailable && !isPastHour) {
                        cellCls = "bg-green-50"
                        content = <span className="text-[7px] text-green-600 font-semibold">Available</span>
                      }

                      return (
                        <div key={h} className={`h-[26px] border-t border-gray-50 flex items-center justify-center ${cellCls}`}>
                          {content}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 border-t border-gray-100">
        <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-50 border border-green-300" /> Available</span>
        <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-300" /> Booked</span>
        <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-white border border-gray-200" /> Unavailable</span>
      </div>
    </div>
  )
}

/* ─── Teacher Detail Modal ─── */
function TeacherDetailModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [tab, setTab] = useState<"profile" | "schedule" | "classes">("profile")
  const avail = getAvailability(teacher.status)

  const availByDay = useMemo(() => {
    const map: Record<string, { start: string; end: string }[]> = {}
    teacher.availabilitySlots
      .sort((a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99))
      .forEach((a) => { const day = a.dayOfWeek; if (!map[day]) map[day] = []; map[day].push({ start: a.startTime, end: a.endTime }) })
    return map
  }, [teacher.availabilitySlots])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-[#1E293B]">Teacher Profile</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${getAvatarBg(teacher.name)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="text-white text-lg font-bold">{teacher.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-[#1E293B]">{teacher.name}</p>
              <p className="text-xs text-gray-500">{teacher.qualification}</p>
              <div className="mt-1"><StarRating rating={teacher.rating} count={teacher.reviews} /></div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${avail.cls}`}>{avail.label}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${teacher.email}`} className="hover:text-[#0D9488] hover:underline">{teacher.email}</a></span>
            {teacher.phone && <span className="inline-flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" /><a href={`tel:${teacher.phone}`} className="hover:text-[#0D9488] hover:underline">{teacher.phone}</a></span>}
            <span className="inline-flex items-center gap-1.5 text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {teacher.timezone}</span>
          </div>

          <div className="flex border-b border-gray-100">
            {([
              { key: "profile" as const, label: "Profile" },
              { key: "schedule" as const, label: "Weekly Schedule" },
              { key: "classes" as const, label: `Upcoming (${teacher.upcomingClassCount})` },
            ]).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${tab === t.key ? "border-[#0D9488] text-[#0D9488]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects.map((s) => <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getSubjectColor(s)}`}>{s}</span>)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center"><p className="text-[10px] text-gray-400">Experience</p><p className="font-semibold text-[#1E293B] mt-0.5 text-xs">{teacher.experience}</p></div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center"><p className="text-[10px] text-gray-400">Active Students</p><p className="font-semibold text-[#1E293B] mt-0.5 text-xs">{teacher.activeStudents}</p></div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center"><p className="text-[10px] text-gray-400">Weekly Hours</p><p className="font-semibold text-[#1E293B] mt-0.5 text-xs">{teacher.weeklyHours}h</p></div>
              </div>
              {teacher.bio && <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bio</p><p className="text-sm text-gray-700 leading-relaxed">{teacher.bio}</p></div>}
            </div>
          )}

          {tab === "schedule" && (
            <div className="space-y-3">
              <WeeklyScheduleGrid teacherId={teacher.id} availability={teacher.availabilitySlots} />

              {Object.keys(availByDay).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Recurring Slot Details</p>
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

          {tab === "classes" && (
            <div className="space-y-2">
              {teacher.upcomingClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No upcoming classes in the next 4 weeks.</p>
              ) : (
                teacher.upcomingClasses.map((c, i) => {
                  const d = new Date(c.scheduledAt)
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-lg bg-[#0D9488]/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-[#0D9488] uppercase">{d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</span>
                        <span className="text-sm font-bold text-[#1E293B] -mt-0.5">{d.getUTCDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1E293B] truncate">{c.subject} — {c.student}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}, {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })} · {c.duration} min</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Teacher Card ─── */
function TeacherCardCoord({ teacher, onView }: { teacher: Teacher; onView: () => void }) {
  const avail = getAvailability(teacher.status)
  const availDays = useMemo(() => {
    const days = new Set<number>()
    teacher.availabilitySlots.forEach((a) => { const idx = DAY_ORDER[a.dayOfWeek]; if (idx !== undefined) days.add(idx) })
    return days
  }, [teacher.availabilitySlots])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full ${getAvatarBg(teacher.name)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white text-lg font-bold">{teacher.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#1E293B] truncate">{teacher.name}</h3>
            {teacher.status === "active" && <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E3A5F]/10 text-[#1E3A5F] uppercase">✓ Active</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{teacher.qualification}</p>
          <div className="mt-1"><StarRating rating={teacher.rating} count={teacher.reviews} /></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((sub) => <span key={sub} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getSubjectColor(sub)}`}>{sub}</span>)}
      </div>

      <div>
        <p className="text-[10px] text-gray-400 mb-1">Weekly Availability</p>
        <div className="flex gap-1">
          {DAYS_SHORT.map((day, i) => (
            <div key={day} className="flex-1 text-center">
              <div className={`h-5 rounded-sm text-[8px] font-bold flex items-center justify-center ${availDays.has(i) ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-50 text-gray-300 border border-gray-100"}`}>{day}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{teacher.weeklyHours}h/week · {teacher.upcomingClassCount} upcoming class{teacher.upcomingClassCount !== 1 ? "es" : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2"><p className="text-gray-400">Experience</p><p className="font-semibold text-[#1E293B] mt-0.5">{teacher.experience}</p></div>
        <div className="bg-gray-50 rounded-lg px-3 py-2"><p className="text-gray-400">Active Students</p><p className="font-semibold text-[#1E293B] mt-0.5">{teacher.activeStudents}</p></div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status:</span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${avail.cls}`}>{avail.label}</span>
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={onView} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Calendar className="w-3.5 h-3.5" /> View Profile & Schedule
        </button>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export function CoordinatorTeachersClient({ teachers }: { teachers: Teacher[] }) {
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [availFilter, setAvailFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)

  const allSubjects = useMemo(() => Array.from(new Set(teachers.flatMap((t) => t.subjects))).sort(), [teachers])

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const avail = getAvailability(t.status)
      const matchSub = subjectFilter === "all" || t.subjects.includes(subjectFilter)
      const matchAvail = availFilter === "all" || avail.label.toLowerCase().replace(" ", "_") === availFilter
      const q = search.toLowerCase()
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.subjects.some((s) => s.toLowerCase().includes(q))
      return matchSub && matchAvail && matchSearch
    })
  }, [subjectFilter, availFilter, search, teachers])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Directory</h1>
        <p className="text-sm text-gray-500 mt-0.5">Browse teachers, view their schedules, and suggest options to parents</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-600 font-medium">Filters:</span></div>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30">
          <option value="all">All Subjects</option>{allSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30">
          <option value="all">All Availability</option><option value="available">Available</option><option value="on_leave">On Leave</option><option value="inactive">Inactive</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <input type="text" placeholder="Search by name or subject…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        </div>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} teacher{filtered.length !== 1 ? "s" : ""} found</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No teachers match the selected filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.map((t) => <TeacherCardCoord key={t.id} teacher={t} onView={() => setViewTeacher(t)} />)}</div>
      )}

      {viewTeacher && <TeacherDetailModal teacher={viewTeacher} onClose={() => setViewTeacher(null)} />}
    </div>
  )
}