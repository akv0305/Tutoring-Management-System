"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Star, Clock, BookOpen, MapPin, Calendar, ChevronLeft,
  ChevronRight, CheckCircle, Loader2, AlertTriangle, X, Package,
} from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"

type Subject = { id: string; name: string }
type Availability = { dayOfWeek: string; startTime: string; endTime: string }
type BookedSlot = { start: string; duration: number }
type PackageOpt = { id: string; label: string; remaining: number; subjectId: string; subjectName: string; studentId: string }
type Student = { id: string; name: string }

type TeacherData = {
  id: string; name: string; initials: string; qualification: string; bio: string
  experience: number; rate: string; rating: number; reviews: number; totalClasses: number
  timezone: string; subjects: Subject[]; availability: Availability[]
  blockedDates: string[]; bookedSlots: BookedSlot[]
}

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
const DAY_LABELS: Record<string,string> = {
  MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat",SUNDAY:"Sun"
}
const DAY_JS_MAP: Record<number,string> = { 1:"MONDAY",2:"TUESDAY",3:"WEDNESDAY",4:"THURSDAY",5:"FRIDAY",6:"SATURDAY",0:"SUNDAY" }

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
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh] = endTime.split(":").map(Number)
  let hour = sh
  let min = sm
  while (hour < eh) {
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`)
    hour++
  }
  return slots
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
}

type SelectedSlot = { date: string; time: string; dateObj: Date }

export function TeacherProfileClient({
  teacher,
  students,
  packages,
}: {
  teacher: TeacherData
  students: Student[]
  packages: PackageOpt[]
}) {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [step, setStep] = useState<"browse" | "confirm">("browse")
  const [studentId, setStudentId] = useState(students.length === 1 ? students[0].id : "")
  const [packageId, setPackageId] = useState("")
  const [subjectId, setSubjectId] = useState(teacher.subjects.length === 1 ? teacher.subjects[0].id : "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  // Build availability map: DAY_NAME -> startTime, endTime
  const availMap = useMemo(() => {
    const m = new Map<string, Availability>()
    teacher.availability.forEach((a) => m.set(a.dayOfWeek, a))
    return m
  }, [teacher.availability])

  // Build set of booked ISO strings for quick lookup
  const bookedSet = useMemo(() => {
    const s = new Set<string>()
    teacher.bookedSlots.forEach((b) => {
      const d = new Date(b.start)
      const key = `${d.toISOString().split("T")[0]}_${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
      s.add(key)
    })
    return s
  }, [teacher.bookedSlots])

  const blockedSet = useMemo(() => new Set(teacher.blockedDates), [teacher.blockedDates])

  const now = new Date()

  // Filter packages by selected student and subject
  const filteredPackages = packages.filter(
    (p) => (!studentId || p.studentId === studentId) && (!subjectId || p.subjectId === subjectId)
  )

  const selectedPackage = packages.find((p) => p.id === packageId)
  const totalRemaining = selectedPackage ? selectedPackage.remaining : 0

  function toggleSlot(dateObj: Date, time: string) {
    const dateStr = dateObj.toISOString().split("T")[0]
    const key = `${dateStr}_${time}`
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => `${s.date}_${s.time}` === key)
      if (exists) return prev.filter((s) => `${s.date}_${s.time}` !== key)
      return [...prev, { date: dateStr, time, dateObj }]
    })
  }

  function isSelected(dateObj: Date, time: string) {
    const dateStr = dateObj.toISOString().split("T")[0]
    return selectedSlots.some((s) => s.date === dateStr && s.time === time)
  }

  async function handleBook() {
    setError("")
    if (!studentId) return setError("Please select a student.")
    if (!subjectId) return setError("Please select a subject.")
    if (selectedSlots.length === 0) return setError("Please select at least one time slot.")

    if (packageId && selectedSlots.length > totalRemaining) {
      return setError(`Package has only ${totalRemaining} classes remaining but you selected ${selectedSlots.length} slots.`)
    }

    setLoading(true)
    const results: { ok: boolean; msg: string }[] = []

    for (const slot of selectedSlots) {
      const scheduledAt = new Date(`${slot.date}T${slot.time}:00Z`).toISOString()
      try {
        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            teacherId: teacher.id,
            subjectId,
            packageId: packageId || null,
            scheduledAt,
            duration: 60,
            isTrial: false,
          }),
        })
        const data = await res.json()
        results.push({ ok: res.ok, msg: data.error || "OK" })
      } catch {
        results.push({ ok: false, msg: "Network error" })
      }
    }

    setLoading(false)
    const failures = results.filter((r) => !r.ok)
    if (failures.length > 0 && failures.length === results.length) {
      setError(`Booking failed: ${failures[0].msg}`)
    } else if (failures.length > 0) {
      setError(`${results.length - failures.length} of ${results.length} classes booked. Some failed: ${failures[0].msg}`)
      setSuccess(true)
    } else {
      setSuccess(true)
    }
  }

  // ── SUCCESS SCREEN ──
  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-[#22C55E] mx-auto" />
        <h2 className="text-2xl font-bold text-[#1E293B]">Classes Booked!</h2>
        <p className="text-gray-500">
          {selectedSlots.length} class{selectedSlots.length > 1 ? "es" : ""} scheduled with {teacher.name}.
        </p>
        {error && <p className="text-sm text-amber-600">{error}</p>}
        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => router.push("/parent/classes")}
            className="px-5 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            View My Classes
          </button>
          <button
            onClick={() => router.push("/parent/teachers")}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to Teachers
          </button>
        </div>
      </div>
    )
  }

  // ── CONFIRMATION STEP ──
  if (step === "confirm") {
    const noPackage = !packageId
    const needsMore = packageId && selectedSlots.length > totalRemaining

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setStep("browse")} className="flex items-center gap-1 text-sm text-[#0D9488] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to calendar
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-bold text-[#1E293B]">Confirm Booking</h2>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Teacher: <span className="text-[#1E293B] font-bold">{teacher.name}</span></p>
            <p className="text-sm text-gray-600">{selectedSlots.length} class{selectedSlots.length > 1 ? "es" : ""} selected:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSlots
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((s) => (
                  <span key={`${s.date}_${s.time}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                    {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {formatTime(s.time)}
                    <button onClick={() => { setSelectedSlots((prev) => prev.filter((x) => x.date !== s.date || x.time !== s.time)); }} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>

          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setPackageId(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
              <option value="">Select student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPackageId(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
              <option value="">Select subject…</option>
              {teacher.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Package (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                <Package className="w-4 h-4 inline mr-1" />
                Link to Package <span className="text-gray-400 font-normal">(optional — saves from your class balance)</span>
            </label>
            {filteredPackages.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                No active package found for this teacher/subject. This will be booked as a standalone class.
                <button onClick={() => router.push("/parent/packages")} className="block mt-1 text-[#0D9488] font-medium hover:underline text-xs">
                    Want to save? Buy a package →
                </button>
                </div>
            ) : (
                <>
                <select value={packageId} onChange={(e) => setPackageId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                    <option value="">No package (standalone class)</option>
                    {filteredPackages.map((p) => (
                    <option key={p.id} value={p.id}>{p.label} — {p.remaining} classes left</option>
                    ))}
                </select>
                {!packageId && (
                    <p className="text-xs text-gray-400 mt-1">Booking without a package — class will not deduct from any balance.</p>
                )}
                </>
            )}
          </div>

          {/* Balance check */}
          {packageId && selectedSlots.length > totalRemaining && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                You selected <strong>{selectedSlots.length}</strong> slots but your package only has <strong>{totalRemaining}</strong> classes remaining.
                Remove {selectedSlots.length - totalRemaining} slot(s), or deselect the package to book as standalone.
                </div>
            </div>
          )}

          {packageId && selectedSlots.length <= totalRemaining && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {selectedSlots.length} of {totalRemaining} package classes will be used. {totalRemaining - selectedSlots.length} will remain.
            </div>
          )}

          {!packageId && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                Booking {selectedSlots.length} standalone class{selectedSlots.length > 1 ? "es" : ""} — not linked to any package.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStep("browse")}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Back
            </button>
            <button
              onClick={handleBook}
              disabled={loading || !studentId || !subjectId || (!!packageId && selectedSlots.length > totalRemaining)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Booking…</> : <>Book {selectedSlots.length} Class{selectedSlots.length > 1 ? "es" : ""}</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── BROWSE / CALENDAR STEP ──
  return (
    <div className="space-y-6">
      {/* Back link */}
      <button onClick={() => router.push("/parent/teachers")} className="flex items-center gap-1 text-sm text-[#0D9488] hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Teachers
      </button>

      {/* Teacher profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#0D9488] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{teacher.initials}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#1E293B]">{teacher.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{teacher.qualification}</p>
            {teacher.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{teacher.bio}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-[#0D9488]" />{teacher.experience} yrs exp</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#0D9488]" />{teacher.rate}/hr</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#0D9488]" />{teacher.timezone}</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" />{teacher.totalClasses} classes taught</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {teacher.subjects.map((s) => (
                <span key={s.id} className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">{s.name}</span>
              ))}
            </div>
            <div className="mt-2">
              {teacher.rating > 0 ? <RatingStars rating={teacher.rating} count={teacher.reviews} size="sm" /> : <span className="text-xs text-gray-400">No ratings yet</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Availability Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1E293B]">Select Time Slots</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
            </span>
            <button onClick={() => setWeekOffset((w) => Math.min(3, w + 1))} disabled={weekOffset >= 3}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-[#0D9488] font-medium hover:underline ml-1">This week</button>
            )}
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-gray-400 font-medium py-2 text-center">Time (UTC)</div>
              {weekDates.map((d, i) => {
                const isToday = d.toISOString().split("T")[0] === now.toISOString().split("T")[0]
                return (
                  <div key={i} className={`text-center py-2 rounded-lg ${isToday ? "bg-[#1E3A5F] text-white" : ""}`}>
                    <p className={`text-xs font-medium ${isToday ? "text-white/80" : "text-gray-500"}`}>
                    {d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                    </p>
                    <p className={`text-sm font-bold ${isToday ? "text-white" : "text-[#1E293B]"}`}>
                    {d.getUTCDate()}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Time slot rows */}
            {(() => {
              // Collect all unique time slots across all availability entries
              const allSlots = new Set<string>()
              teacher.availability.forEach((a) => {
                generateSlots(a.startTime, a.endTime).forEach((s) => allSlots.add(s))
              })
              const sortedSlots = Array.from(allSlots).sort()

              return sortedSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-1 mb-1">
                  <div className="text-xs text-gray-400 py-2 text-center font-medium">{formatTime(timeSlot)}</div>
                  {weekDates.map((dateObj, dayIdx) => {
                    const dayName = DAY_JS_MAP[dateObj.getUTCDay()]
                    const avail = availMap.get(dayName)
                    const dateStr = dateObj.toISOString().split("T")[0]
                    const todayStr = now.toISOString().split("T")[0]
                    const isPast = dateStr < todayStr
                    const isPastToday = dateStr === todayStr && Number(timeSlot.split(":")[0]) <= now.getUTCHours()
                    const isBlocked = blockedSet.has(dateStr)
                    const isBooked = bookedSet.has(`${dateStr}_${timeSlot}`)

                    // Check if this time falls within the availability window
                    const inWindow = avail && timeSlot >= avail.startTime && timeSlot < avail.endTime

                    const unavailable = !inWindow || isPast || isPastToday || isBlocked || isBooked
                    const selected = isSelected(dateObj, timeSlot)

                    if (unavailable) {
                      return (
                        <div key={dayIdx} className={`py-2 rounded-md text-center text-xs ${
                          isBooked ? "bg-red-50 text-red-300 line-through" : "bg-gray-50 text-gray-300"
                        }`}>
                          {isBooked ? "Booked" : inWindow ? "Past" : "—"}
                        </div>
                      )
                    }

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => toggleSlot(dateObj, timeSlot)}
                        className={`py-2 rounded-md text-center text-xs font-medium transition-all ${
                          selected
                            ? "bg-[#0D9488] text-white shadow-sm ring-2 ring-[#0D9488]/30"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        }`}
                      >
                        {selected ? "✓ Selected" : "Available"}
                      </button>
                    )
                  })}
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500 font-medium">Legend:</span>
          <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-green-50 border border-green-200" /><span className="text-xs text-gray-600">Available</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-[#0D9488]" /><span className="text-xs text-gray-600">Selected</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-red-50 border border-red-100" /><span className="text-xs text-gray-600">Booked</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-gray-50 border border-gray-100" /><span className="text-xs text-gray-600">Unavailable</span></div>
        </div>
      </div>

      {/* Floating action bar */}
      {selectedSlots.length > 0 && (
        <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">
              {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-gray-500">
              {selectedSlots
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((s) => `${new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ${formatTime(s.time)}`)
                .join(" • ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedSlots([])}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Clear
            </button>
            <button onClick={() => setStep("confirm")}
              className="px-5 py-2.5 bg-[#0D9488] text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
              Continue to Book →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
