"use client"

import React, { useState, useMemo } from "react"
import {
  Filter, Star, X, Calendar, MapPin, Mail, Phone,
} from "lucide-react"
import { TeacherAvailabilityList } from "@/components/teachers/TeacherAvailabilityList"

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

/* ─── Fixed dual timezones ─── */
const TZ_CST = "America/Chicago"
const TZ_IST = "Asia/Kolkata"

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

/* ─── Teacher Detail Modal ─── */
function TeacherDetailModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [tab, setTab] = useState<"profile" | "availability" | "classes">("profile")
  const avail = getAvailability(teacher.status)

  const availByDay = useMemo(() => {
    const map: Record<string, { start: string; end: string }[]> = {}
    teacher.availabilitySlots
      .sort((a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99))
      .forEach((a) => { const day = a.dayOfWeek; if (!map[day]) map[day] = []; map[day].push({ start: a.startTime, end: a.endTime }) })
    return map
  }, [teacher.availabilitySlots])

  const istLabel = tzAbbr(TZ_IST)
  const cstLabel = tzAbbr(TZ_CST)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-[#1E293B]">Teacher Profile</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Header info */}
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

          {/* Profile tab */}
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

          {/* Availability tab */}
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

          {/* Upcoming Classes tab */}
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
