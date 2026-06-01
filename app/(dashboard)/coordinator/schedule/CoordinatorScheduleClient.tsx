"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  ChevronLeft, ChevronRight, Users, X, CalendarPlus, Loader2,
  AlertTriangle, CheckCircle, Clock, Calendar, Package as PackageIcon,
  CreditCard, Send, Eye, Info, Check, Ticket, DollarSign
} from "lucide-react"
import { useRouter } from "next/navigation"

/* ─── Types ─── */
type ClassBlock = {
  id: string; student: string; teacher: string; subject: string
  subjectColor: string; startHour: number; duration: number
  dayIndex: number; isTrial: boolean; status: string
}
type LegendItem = { label: string; cls: string }
type Student = { id: string; name: string; parentId?: string }
type TeacherSubject = { id: string; name: string }
type Teacher = { id: string; name: string; subjects: TeacherSubject[]; hourlyRate?: number }
type PackageOption = {
  id: string; label: string; remaining: number
  subjectId: string; teacherId: string; studentId?: string
}
type AvailabilitySlot = { dayOfWeek: string; startTime: string; endTime: string }
type BookedSlot = { start: string; duration: number }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_MAP: Record<string, number> = {
  MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3,
  FRIDAY: 4, SATURDAY: 5, SUNDAY: 6,
}
const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
]

/* ─── Calendar Block (main schedule) ─── */
function Block({ block }: { block: ClassBlock }) {
  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 text-[10px] leading-tight shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${block.subjectColor}`}
      style={{ top: `${block.startHour * 52}px`, height: `${block.duration * 50}px` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold truncate">{block.subject}</span>
        {block.isTrial && (
          <span className="flex-shrink-0 px-1 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold uppercase">Trial</span>
        )}
      </div>
      <div className="truncate text-[9px] mt-0.5 opacity-80">{block.student}</div>
      <div className="truncate text-[9px] opacity-70">{block.teacher}</div>
    </div>
  )
}

/* ─── Teacher Weekly Schedule Mini-Calendar ─── */
function TeacherSchedulePreview({
  availability, bookedSlots, blockedDates, selectedSlots, onToggleSlot, isSingleSelect,
}: {
  availability: AvailabilitySlot[]; bookedSlots: BookedSlot[]; blockedDates: string[]
  selectedSlots: { date: string; time: string }[]
  onToggleSlot: (date: string, time: string) => void; isSingleSelect: boolean
}) {
  const [weekOffset, setWeekOffset] = useState(0)

  const selectedSet = useMemo(() => {
    const set = new Set<string>()
    selectedSlots.forEach((s) => set.add(`${s.date}_${s.time}`))
    return set
  }, [selectedSlots])

  const weekDates = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = today.getDay()
    const startMonday = new Date(today)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      startMonday.setDate(today.getDate() - (dayOfWeek - 1))
    } else if (dayOfWeek === 6) {
      startMonday.setDate(today.getDate() + 2)
    } else {
      startMonday.setDate(today.getDate() + 1)
    }
    startMonday.setDate(startMonday.getDate() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startMonday); d.setDate(startMonday.getDate() + i); return d
    })
  }, [weekOffset])

  const availByDay = useMemo(() => {
    const map: Record<number, { start: number; end: number }[]> = {}
    availability.forEach((a) => {
      const dayIdx = DAY_MAP[a.dayOfWeek]; if (dayIdx === undefined) return
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
  const hours = Array.from({ length: 12 }, (_, i) => i + 8)
  const now = new Date()

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
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

      <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 text-[10px] text-blue-700 font-medium">
        {isSingleSelect ? "Click an available slot to select it for the trial class." : "Click available slots to select them. Click again to deselect."}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="flex border-b border-gray-100">
            <div className="w-16 flex-shrink-0" />
            {weekDates.map((d, i) => {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
              const isBlocked = blockedSet.has(iso)
              const isToday = d.toDateString() === now.toDateString()
              return (
                <div key={i} className={`flex-1 text-center py-2 border-l border-gray-100 ${isBlocked ? "bg-red-50" : isToday ? "bg-teal-50/50" : ""}`}>
                  <p className="text-[10px] font-medium text-gray-500">{DAYS[i]}</p>
                  <p className={`text-sm font-bold ${isToday ? "text-[#0D9488]" : "text-[#1E293B]"}`}>{d.getDate()}</p>
                  {isBlocked && <p className="text-[8px] text-red-500 font-medium">Blocked</p>}
                </div>
              )
            })}
          </div>

          <div className="flex">
            <div className="w-16 flex-shrink-0">
              {hours.map((h) => (
                <div key={h} className="h-[34px] flex items-center justify-end pr-2">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                  </span>
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
                    const isSelected = selectedSet.has(slotKey)
                    const isPastHour = isPastDay || (d.toDateString() === now.toDateString() && h <= now.getHours())

                    let cellCls = "bg-white"
                    let content: React.ReactNode = null
                    let cursor = "cursor-default"

                    if (isSelected) {
                      cellCls = "bg-[#0D9488]"
                      content = <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      cursor = "cursor-pointer"
                    } else if (isBooked) {
                      cellCls = "bg-red-50"
                      content = <span className="text-[8px] text-red-500 font-semibold">Booked</span>
                    } else if (isAvailable && !isPastHour) {
                      cellCls = "bg-green-50 hover:bg-green-200"
                      content = <span className="text-[8px] text-green-600 font-semibold">Available</span>
                      cursor = "cursor-pointer"
                    } else {
                      cellCls = "bg-gray-50/50"
                    }

                    return (
                      <div key={h}
                        className={`h-[34px] border-t border-gray-50 flex items-center justify-center transition-colors ${cellCls} ${cursor}`}
                        onClick={() => { if (isSelected || (isAvailable && !isBooked && !isPastHour)) onToggleSlot(iso, timeStr) }}
                      >
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

      <div className="flex items-center gap-4 px-3 py-2 border-t border-gray-100 bg-gray-50">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-300 flex items-center justify-center text-[6px] text-green-600 font-bold">A</span> Available
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-[#0D9488] flex items-center justify-center"><Check className="w-2 h-2 text-white" strokeWidth={3} /></span> Selected
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-300 flex items-center justify-center text-[6px] text-red-500 font-bold">B</span> Booked
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" /> Unavailable
        </span>
      </div>
    </div>
  )
}

/* ─── Advanced Booking Panel ─── */
function AdvancedBookingPanel({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [studentId, setStudentId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [bookingType, setBookingType] = useState<"standalone" | "package" | "trial">("standalone")
  const [packageId, setPackageId] = useState("")
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string }[]>([])
  const [topic, setTopic] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "payment_link" | "package">("bank_transfer")

  const [teacherScheduleLoading, setTeacherScheduleLoading] = useState(false)
  const [teacherAvailability, setTeacherAvailability] = useState<AvailabilitySlot[]>([])
  const [teacherBookedSlots, setTeacherBookedSlots] = useState<BookedSlot[]>([])
  const [teacherBlockedDates, setTeacherBlockedDates] = useState<string[]>([])
  const [scheduleLoaded, setScheduleLoaded] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponValid, setCouponValid] = useState<boolean | null>(null)
  const [couponMessage, setCouponMessage] = useState("")
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(false)
  const [bookingOrderRef, setBookingOrderRef] = useState("")
  const [step, setStep] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      fetch("/api/classes/booking-data").then((r) => r.json()).then((d) => {
        setStudents(d.students || []); setTeachers(d.teachers || []); setPackages(d.packages || [])
      }).catch(() => {}).finally(() => setLoadingData(false))
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setStudentId(""); setTeacherId(""); setSubjectId(""); setBookingType("standalone")
      setPackageId(""); setSelectedSlots([]); setTopic(""); setMeetingLink("")
      setPaymentMethod("bank_transfer"); setTeacherAvailability([]); setTeacherBookedSlots([])
      setTeacherBlockedDates([]); setScheduleLoaded(false); setError(""); setSuccess(false)
      setPendingPayment(false); setBookingOrderRef(""); setStep(1)
      resetCoupon()
    }
  }, [open])

  useEffect(() => {
    if (!teacherId) {
      setTeacherAvailability([]); setTeacherBookedSlots([]); setTeacherBlockedDates([]); setScheduleLoaded(false); return
    }
    setTeacherScheduleLoading(true); setScheduleLoaded(false); setSelectedSlots([])
    fetch(`/api/classes/teacher-slots?teacherId=${teacherId}`).then((r) => r.json()).then((d) => {
      setTeacherAvailability(d.availability || []); setTeacherBookedSlots(d.bookedSlots || []); setTeacherBlockedDates(d.blockedDates || []); setScheduleLoaded(true)
    }).catch(() => {}).finally(() => setTeacherScheduleLoading(false))
  }, [teacherId])

  const allSubjects = useMemo(() => Array.from(new Map(teachers.flatMap((t) => t.subjects).map((s) => [s.id, s])).values()), [teachers])
  const filteredTeachers = useMemo(() => !subjectId ? teachers : teachers.filter((t) => t.subjects.some((s) => s.id === subjectId)), [subjectId, teachers])
  const filteredPackages = useMemo(() => packages.filter((p) => {
    if (teacherId && p.teacherId !== teacherId) return false
    if (subjectId && p.subjectId !== subjectId) return false
    if (studentId && p.studentId && p.studentId !== studentId) return false; return true
  }), [packages, teacherId, subjectId, studentId])

  useEffect(() => {
    if (packageId) {
      const pkg = packages.find((p) => p.id === packageId)
      if (pkg) { if (pkg.teacherId) setTeacherId(pkg.teacherId); if (pkg.subjectId) setSubjectId(pkg.subjectId); setPaymentMethod("package") }
    }
  }, [packageId, packages])

  const handleToggleSlot = useCallback((date: string, time: string) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.date === date && s.time === time)
      if (exists) return prev.filter((s) => !(s.date === date && s.time === time))
      if (bookingType === "trial") return [{ date, time }]
      return [...prev, { date, time }]
    })
    // Reset coupon when slots change
    resetCoupon()
  }, [bookingType])

  // Price calculation
  const selectedTeacher = teachers.find((t) => t.id === teacherId)
  const hourlyRate = selectedTeacher?.hourlyRate || 0
  const totalAmount = useMemo(() => {
    if (bookingType === "trial") return 0
    if (bookingType === "package") return 0 // Package is prepaid
    return hourlyRate * selectedSlots.length
  }, [bookingType, hourlyRate, selectedSlots.length])

  const amountAfterCoupon = couponValid ? Math.max(0, totalAmount - couponDiscountAmount) : totalAmount

  const selectedTeacherName = selectedTeacher?.name || ""
  const selectedStudentName = students.find((s) => s.id === studentId)?.name || ""
  const selectedSubjectName = allSubjects.find((s) => s.id === subjectId)?.name || ""
  const selectedStudentParentId = students.find((s) => s.id === studentId)?.parentId || ""

  // Coupon helpers
  function resetCoupon() {
    setCouponCode(""); setCouponValid(null); setCouponMessage(""); setCouponDiscountAmount(0); setCouponValidating(false)
  }

  async function validateCoupon() {
    if (!couponCode.trim() || totalAmount <= 0) return
    setCouponValidating(true); setCouponValid(null); setCouponMessage(""); setCouponDiscountAmount(0)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim(), totalAmount, parentProfileId: selectedStudentParentId }),
      })
      const data = await res.json()
      if (data.valid) {
        setCouponValid(true); setCouponMessage(data.message); setCouponDiscountAmount(data.discountAmount)
      } else {
        setCouponValid(false); setCouponMessage(data.error || "Invalid coupon code."); setCouponDiscountAmount(0)
      }
    } catch {
      setCouponValid(false); setCouponMessage("Failed to validate coupon. Try again.")
    }
    setCouponValidating(false)
  }

  const handleSubmit = async () => {
    setError("")
    if (!studentId) return setError("Please select a student.")
    if (!teacherId) return setError("Please select a teacher.")
    if (!subjectId) return setError("Please select a subject.")
    if (selectedSlots.length === 0) return setError("Please select at least one time slot.")

    const slots = selectedSlots.map((s) => new Date(`${s.date}T${s.time}:00Z`).toISOString())

    setLoading(true)
    try {
      const payload: any = {
        studentId, teacherId, subjectId,
        packageId: bookingType === "package" ? packageId : null,
        slots, duration: 60, isTrial: bookingType === "trial",
        topicCovered: topic || null, meetingLink: meetingLink || null,
        discountMethod: couponValid && couponCode.trim() ? "coupon" : "none",
      }
      if (couponValid && couponCode.trim()) payload.couponCode = couponCode.trim()

      const res = await fetch("/api/classes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to book class"); return }
      if (data.pendingPayment) { setPendingPayment(true); setBookingOrderRef(data.orderRef || "") }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 2500)
    } catch { setError("Network error. Please try again.") }
    finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center"><CalendarPlus className="w-5 h-5 text-[#0D9488]" /></div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Schedule Class on Behalf of Student</h2>
              <p className="text-xs text-gray-500">Select details, pick a slot, review pricing & confirm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Step indicator */}
        {!success && (
          <div className="flex items-center gap-2 px-5 pt-4">
            {[{ n: 1 as const, label: "Details" }, { n: 2 as const, label: "Pick Slots" }, { n: 3 as const, label: "Review & Pay" }].map((s, i) => (
              <React.Fragment key={s.n}>
                {i > 0 && <div className={`flex-1 h-0.5 ${step >= s.n ? "bg-[#0D9488]" : "bg-gray-200"}`} />}
                <button onClick={() => {
                  if (s.n === 1) setStep(1)
                  else if (s.n === 2 && studentId && subjectId && teacherId) setStep(2)
                  else if (s.n === 3 && studentId && subjectId && teacherId && selectedSlots.length > 0) setStep(3)
                }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    step === s.n ? "bg-[#0D9488] text-white" : step > s.n ? "bg-[#0D9488]/10 text-[#0D9488]" : "bg-gray-100 text-gray-400"
                  }`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{step > s.n ? "✓" : s.n}</span>
                  {s.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Success */}
        {success ? (
          pendingPayment ? (
            <div className="p-10 text-center space-y-3">
              <Clock className="w-12 h-12 text-amber-500 mx-auto" />
              <p className="text-lg font-semibold text-[#1E293B]">Class Reserved!</p>
              {bookingOrderRef && <p className="text-xs font-medium text-gray-500">Ref: <span className="font-bold text-[#1E293B]">{bookingOrderRef}</span></p>}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 text-left">
                <p className="font-semibold mb-1">Payment Pending</p>
                <p>{paymentMethod === "payment_link" ? "A payment link will be sent to the parent." : "The parent will need to complete payment via bank transfer."}</p>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center">
              <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto" />
              <p className="text-lg font-semibold text-[#1E293B] mt-3">Class Booked Successfully!</p>
              <p className="text-sm text-gray-500 mt-1">{selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} scheduled for {selectedStudentName} with {selectedTeacherName}</p>
            </div>
          )
        ) : loadingData ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 text-[#0D9488] animate-spin mx-auto" /><p className="text-sm text-gray-500 mt-3">Loading booking data…</p></div>
        ) : (
          <div className="p-5 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* ─── STEP 1 ─── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setPackageId(""); resetCoupon() }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                    <option value="">Select student…</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTeacherId(""); setPackageId(""); setSelectedSlots([]); resetCoupon() }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                    <option value="">Select subject…</option>
                    {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                  <select value={teacherId} onChange={(e) => { setTeacherId(e.target.value); setPackageId(""); setSelectedSlots([]); resetCoupon() }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                    <option value="">Select teacher…</option>
                    {filteredTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}{t.hourlyRate ? ` — $${t.hourlyRate}/hr` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type</label>
                  <div className="flex gap-2">
                    {([
                      { value: "standalone" as const, label: "Standalone", icon: Calendar },
                      { value: "package" as const, label: "Use Package", icon: PackageIcon },
                      { value: "trial" as const, label: "Trial Class", icon: Eye },
                    ]).map((bt) => (
                      <button key={bt.value} type="button"
                        onClick={() => { setBookingType(bt.value); setPackageId(""); if (bt.value === "trial") setSelectedSlots((prev) => prev.slice(0, 1)); setPaymentMethod(bt.value === "package" ? "package" : "bank_transfer"); resetCoupon() }}
                        className={`flex-1 flex items-center gap-2 justify-center py-2.5 rounded-lg text-sm font-medium border transition-colors ${bookingType === bt.value ? "border-[#0D9488] bg-[#0D9488]/10 text-[#0D9488]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        <bt.icon className="w-4 h-4" />{bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingType === "package" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Package *</label>
                    {filteredPackages.length === 0 ? (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No active packages found for this combination.</div>
                    ) : (
                      <select value={packageId} onChange={(e) => setPackageId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                        <option value="">Select package…</option>
                        {filteredPackages.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.remaining} classes remaining</option>)}
                      </select>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Quadratic equations"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={() => {
                    if (!studentId) return setError("Please select a student.")
                    if (!subjectId) return setError("Please select a subject.")
                    if (!teacherId) return setError("Please select a teacher.")
                    if (bookingType === "package" && !packageId) return setError("Please select a package.")
                    setError(""); setStep(2)
                  }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-colors">
                    Next: Pick Time Slots <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2 ─── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E293B]">{selectedTeacherName}&apos;s Schedule</h3>
                    <p className="text-xs text-gray-500 mt-0.5">All slots are 1 hour. {bookingType === "trial" ? "Select 1 slot." : "Select one or more slots."}</p>
                  </div>
                  <div className="text-right bg-[#0D9488]/5 rounded-lg px-3 py-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Selected</p>
                    <p className="text-xl font-bold text-[#0D9488]">{selectedSlots.length}</p>
                  </div>
                </div>

                {teacherScheduleLoading ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 text-[#0D9488] animate-spin mx-auto" /><p className="text-sm text-gray-500 mt-2">Loading teacher schedule…</p></div>
                ) : scheduleLoaded ? (
                  <TeacherSchedulePreview availability={teacherAvailability} bookedSlots={teacherBookedSlots} blockedDates={teacherBlockedDates}
                    selectedSlots={selectedSlots} onToggleSlot={handleToggleSlot} isSingleSelect={bookingType === "trial"} />
                ) : (
                  <div className="py-8 text-center text-sm text-gray-400">No schedule data available.</div>
                )}

                {selectedSlots.length > 0 && (
                  <div className="bg-[#0D9488]/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-[#0D9488] mb-2">Selected Slots ({selectedSlots.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.map((s, i) => {
                        const d = new Date(`${s.date}T${s.time}:00Z`)
                        return (
                          <span key={`${s.date}_${s.time}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-[#0D9488]/20 text-xs font-medium text-[#1E293B]">
                            <Check className="w-3 h-3 text-[#0D9488]" strokeWidth={3} />
                            {d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" })}{" "}
                            {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
                            <button onClick={() => setSelectedSlots((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button onClick={() => { if (selectedSlots.length === 0) return setError("Please select at least one time slot."); setError(""); setStep(3) }}
                    disabled={selectedSlots.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F]/90 transition-colors disabled:opacity-50">
                    Next: Review & Pay <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Review, Price & Coupon ─── */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1E293B]">Review Booking</h3>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Student</span><span className="font-medium text-[#1E293B]">{selectedStudentName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Teacher</span><span className="font-medium text-[#1E293B]">{selectedTeacherName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Subject</span><span className="font-medium text-[#1E293B]">{selectedSubjectName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span>
                    <span className="font-medium text-[#1E293B] capitalize">{bookingType === "package" ? "Package Class" : bookingType === "trial" ? "Trial Class (Free)" : "Standalone Class"}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-medium text-[#1E293B]">1 hour per slot</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Slots</span><span className="font-medium text-[#1E293B]">{selectedSlots.length}</span></div>
                  {topic && <div className="flex justify-between"><span className="text-gray-500">Topic</span><span className="font-medium text-[#1E293B]">{topic}</span></div>}
                </div>

                {/* Scheduled times */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Scheduled Times (UTC):</p>
                  {selectedSlots.map((s) => {
                    const d = new Date(`${s.date}T${s.time}:00Z`)
                    return (
                      <div key={`${s.date}_${s.time}`} className="flex items-center gap-2 text-sm text-[#1E293B]">
                        <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                        {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        {" at "}{d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
                      </div>
                    )
                  })}
                </div>

                {/* ─── PRICING SECTION (standalone only) ─── */}
                {bookingType === "standalone" && totalAmount > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Pricing
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{selectedSlots.length} class{selectedSlots.length > 1 ? "es" : ""} × ${hourlyRate.toFixed(2)}/hr</span>
                        <span className="font-semibold text-[#1E293B]">${totalAmount.toFixed(2)}</span>
                      </div>

                      {/* Coupon Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-[#0D9488]" /> Have a coupon code?
                        </label>
                        <div className="flex gap-2">
                          <input type="text" value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (couponValid !== null) resetCoupon() }}
                            placeholder="Enter coupon code"
                            disabled={couponValid === true}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none disabled:bg-gray-50 disabled:text-gray-500 uppercase" />
                          {couponValid === true ? (
                            <button onClick={resetCoupon}
                              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors">
                              Remove
                            </button>
                          ) : (
                            <button onClick={validateCoupon} disabled={couponValidating || !couponCode.trim()}
                              className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
                              {couponValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                            </button>
                          )}
                        </div>
                        {couponMessage && (
                          <p className={`text-xs mt-1.5 flex items-center gap-1 ${couponValid ? "text-green-600" : "text-red-600"}`}>
                            {couponValid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {couponMessage}
                          </p>
                        )}
                      </div>

                      {/* Discount breakdown */}
                      {couponValid && couponDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Coupon Discount</span>
                          <span className="font-semibold">-${couponDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Total */}
                      <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                        <span className="font-semibold text-[#1E293B]">Amount Due</span>
                        <span className="text-lg font-bold text-[#0D9488]">${amountAfterCoupon.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment method (standalone, with amount due) */}
                {bookingType === "standalone" && amountAfterCoupon > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPaymentMethod("bank_transfer")}
                        className={`flex-1 flex items-center gap-2 justify-center py-2.5 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === "bank_transfer" ? "border-[#0D9488] bg-[#0D9488]/10 text-[#0D9488]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        <CreditCard className="w-4 h-4" /> Bank Transfer
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("payment_link")}
                        className={`flex-1 flex items-center gap-2 justify-center py-2.5 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === "payment_link" ? "border-[#0D9488] bg-[#0D9488]/10 text-[#0D9488]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        <Send className="w-4 h-4" /> Send Payment Link
                      </button>
                    </div>
                    {paymentMethod === "payment_link" && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />A payment link will be sent to the parent via email/notification.
                      </div>
                    )}
                    {paymentMethod === "bank_transfer" && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />The class will be reserved with pending payment. Confirm manually once transfer is received.
                      </div>
                    )}
                  </div>
                )}

                {bookingType === "standalone" && amountAfterCoupon === 0 && couponValid && (
                  <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Coupon covers the full amount. No payment required — the booking will be confirmed immediately.
                  </div>
                )}

                {bookingType === "trial" && (
                  <div className="flex items-start gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />Trial classes are free. No payment required.
                  </div>
                )}

                {bookingType === "package" && (
                  <div className="flex items-start gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />This class will be deducted from the student&apos;s active package. No additional payment needed.
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Booking…</> : <><CalendarPlus className="w-4 h-4" />Confirm &amp; Book</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export function CoordinatorScheduleClient({
  classBlocks, dates, monthYear, legend, hasTrial, weekStartISO,
}: {
  classBlocks: ClassBlock[]; dates: string[]; monthYear: string
  legend: LegendItem[]; hasTrial: boolean; weekStartISO: string
}) {
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [showBookPanel, setShowBookPanel] = useState(false)
  const todayJs = new Date().getDay()
  const todayIdx = todayJs === 0 ? 6 : todayJs - 1
  const router = useRouter()

  function navigateWeek(offset: number) {
    const [y, m, d] = weekStartISO.split("-").map(Number)
    const date = new Date(Date.UTC(y, m - 1, d + offset * 7))
    router.push(`/coordinator/schedule?week=${date.toISOString().split("T")[0]}`)
  }
  function goToday() { router.push("/coordinator/schedule") }

  const todayMonday = (() => {
    const now = new Date()
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const [y, m, d] = todayISO.split("-").map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    const day = date.getUTCDay(); const diff = day === 0 ? -6 : 1 - day
    date.setUTCDate(date.getUTCDate() + diff)
    return date.toISOString().split("T")[0]
  })()
  const isCurrentWeek = weekStartISO === todayMonday

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and view all classes for your students</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["day", "week", "month"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 capitalize transition-colors ${view === v ? "bg-[#1E3A5F] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{v}</button>
            ))}
          </div>
          <button onClick={() => setShowBookPanel(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <Users className="w-4 h-4" /> Schedule on Behalf of Student
          </button>
        </div>
      </div>

      {view === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateWeek(-1)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <h2 className="text-base font-semibold text-[#1E293B]">Week of Mon, {monthYear.split(" ")[0]} {dates[0]} – {dates[6]}</h2>
              <button onClick={() => navigateWeek(1)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
            <button onClick={goToday} disabled={isCurrentWeek} className={`text-sm font-medium hover:underline transition-colors ${isCurrentWeek ? "text-gray-300 cursor-default" : "text-[#0D9488]"}`}>Today</button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="flex border-b border-gray-100">
                <div className="w-20 flex-shrink-0" />
                {DAYS.map((day, i) => (
                  <div key={day} className={`flex-1 text-center py-3 border-l border-gray-100 ${i === todayIdx ? "bg-[#1E3A5F]/5" : ""}`}>
                    <p className={`text-xs font-medium ${i === todayIdx ? "text-[#1E3A5F]" : "text-gray-500"}`}>{day}</p>
                    <p className={`text-lg font-bold mt-0.5 ${i === todayIdx ? "text-[#1E3A5F]" : "text-[#1E293B]"}`}>{dates[i]}</p>
                  </div>
                ))}
              </div>
              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  {TIME_SLOTS.map((t) => (<div key={t} className="h-[52px] flex items-start justify-end pr-3 pt-1"><span className="text-[10px] text-gray-400">{t}</span></div>))}
                </div>
                {DAYS.map((day, dayIdx) => {
                  const blocksForDay = classBlocks.filter((b) => b.dayIndex === dayIdx)
                  return (
                    <div key={day} className={`flex-1 relative border-l border-gray-100 ${dayIdx === todayIdx ? "bg-[#1E3A5F]/[0.02]" : ""}`} style={{ height: `${TIME_SLOTS.length * 52}px` }}>
                      {TIME_SLOTS.map((_, i) => (<div key={i} className="absolute left-0 right-0 border-t border-gray-50" style={{ top: `${i * 52}px` }} />))}
                      {blocksForDay.map((block) => <Block key={block.id} block={block} />)}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {view !== "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">{view === "day" ? "Day" : "Month"} view coming soon. Switch to <button onClick={() => setView("week")} className="text-[#0D9488] font-medium hover:underline">Week view</button> to see classes.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-xs text-gray-500 font-medium">Legend:</span>
        {legend.map((l) => (<div key={l.label} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded border-l-2 ${l.cls}`} /><span className="text-xs text-gray-600">{l.label}</span></div>))}
        {hasTrial && (<div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold">TRIAL</span><span className="text-xs text-gray-600">Trial class</span></div>)}
      </div>

      <AdvancedBookingPanel open={showBookPanel} onClose={() => setShowBookPanel(false)} onSuccess={() => window.location.reload()} />
    </div>
  )
}