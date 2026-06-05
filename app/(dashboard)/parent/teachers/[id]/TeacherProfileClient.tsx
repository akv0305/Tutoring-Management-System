"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Star, Clock, BookOpen, MapPin, Calendar, ChevronLeft,
  ChevronRight, CheckCircle, Loader2, AlertTriangle, X, Package, Ticket, Wallet,
} from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"
import {
  getWeekDatesInTZ, utcToLocal, localToUTC, refDateToLocalStr,
  getTzAbbr, to24 as tzTo24, convertAvailabilitySlots,
} from "@/lib/timezone"


type Subject = { id: string; name: string }
type Availability = { dayOfWeek: string; startTime: string; endTime: string }
type BookedSlot = { start: string; duration: number }
type Student = { id: string; name: string }
type TrialEligibility = { studentId: string; subjectId: string; trialTaken: boolean }
type PackageTemplateOpt = {
  id: string; name: string; subjectId: string; subjectName: string
  classesIncluded: number; validityDays: number; suggestedPrice: number
  description: string; isPopular: boolean
}

type TeacherData = {
  id: string; name: string; initials: string; qualification: string; bio: string
  experience: number; rate: string; rateNum: number; rating: number; reviews: number; totalClasses: number
  timezone: string; subjects: Subject[]; availability: Availability[]
  blockedDates: string[]; bookedSlots: BookedSlot[]
}

type BookingType = "package" | "trial" | "standalone"

const DAY_JS_MAP: Record<number, string> = { 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY", 0: "SUNDAY" }

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(),
    now.getUTCDate() + mondayOffset + weekOffset * 7
  ))
  return Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(
    monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i
  )))
}

function to24(time: string): string {
  const trimmed = time.trim()
  if (!/[APap][Mm]/.test(trimmed)) {
    const [h, m] = trimmed.split(":").map(Number)
    return `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
  }
  const isPM = /[Pp][Mm]/.test(trimmed)
  const cleaned = trimmed.replace(/\s*[APap][Mm]\s*/, "")
  let [h, m] = cleaned.split(":").map(Number)
  if (isNaN(m)) m = 0
  if (isPM && h !== 12) h += 12
  if (!isPM && h === 12) h = 0
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const start24 = to24(startTime)
  const end24 = to24(endTime)
  const [sh, sm] = start24.split(":").map(Number)
  const [eh] = end24.split(":").map(Number)
  let hour = sh
  while (hour < eh) {
    slots.push(`${String(hour).padStart(2, "0")}:${String(sm).padStart(2, "0")}`)
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

type SelectedSlot = { date: string; time: string; dateObj: Date; utcISO: string }

export function TeacherProfileClient({
  teacher,
  students,
  packageTemplates,
  trialEligibility,
  walletBalance = 0,
  parentTimezone = "America/New_York",
}: {
  teacher: TeacherData
  students: Student[]
  packageTemplates: PackageTemplateOpt[]
  trialEligibility: TrialEligibility[]
  walletBalance?: number
  parentTimezone?: string
}) {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [step, setStep] = useState<"browse" | "confirm">("browse")

  // Selection state — now on browse step
  const [studentId, setStudentId] = useState(students.length === 1 ? students[0].id : "")
  const [subjectId, setSubjectId] = useState(teacher.subjects.length === 1 ? teacher.subjects[0].id : "")
  const [bookingType, setBookingType] = useState<BookingType>("standalone")
  const [templateId, setTemplateId] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(false)
  const [bookingOrderRef, setBookingOrderRef] = useState("")

  // Discount state
  const [discountMethod, setDiscountMethod] = useState<"none" | "coupon" | "wallet">("none")
  const [couponCode, setCouponCode] = useState("")
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponValid, setCouponValid] = useState<boolean | null>(null)
  const [couponMessage, setCouponMessage] = useState("")
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)
  const [couponName, setCouponName] = useState("")

  const weekDates = useMemo(() => getWeekDatesInTZ(weekOffset, parentTimezone), [weekOffset, parentTimezone])

    // OLD availMap — REMOVE
  // OLD bookedSet — REMOVE

  // NEW — timezone-aware availability + booked slots
  const { availSlots, slotToUTC } = useMemo(
    () => convertAvailabilitySlots(teacher.availability, weekDates, teacher.timezone, parentTimezone),
    [teacher.availability, weekDates, teacher.timezone, parentTimezone]
  )

  const bookedSet = useMemo(() => {
    const s = new Set<string>()
    teacher.bookedSlots.forEach((b) => {
      const d = new Date(b.start)
      const local = utcToLocal(d, parentTimezone)
      s.add(`${local.dateStr}_${local.timeStr}`)
    })
    return s
  }, [teacher.bookedSlots, parentTimezone])

  const blockedSet = useMemo(() => {
    // blockedDates from server are in YYYY-MM-DD format (teacher's local dates)
    // Convert them: for each blocked date, the teacher is blocked all day in their TZ
    // For simplicity, keep the set as-is — we'll check against the teacher's date for each slot via slotToUTC
    return new Set(teacher.blockedDates)
  }, [teacher.blockedDates])

  const now = new Date()

  // Filter package templates by selected subject
  const filteredTemplates = useMemo(() => {
    if (!subjectId) return []
    return packageTemplates.filter((t) => t.subjectId === subjectId)
  }, [subjectId, packageTemplates])

  const selectedTemplate = packageTemplates.find((t) => t.id === templateId)

  // Trial eligibility
  const isTrialEligible = useMemo(() => {
    if (!studentId || !subjectId) return false
    const record = trialEligibility.find(
      (te) => te.studentId === studentId && te.subjectId === subjectId
    )
    if (!record) return true
    return !record.trialTaken
  }, [studentId, subjectId, trialEligibility])

  // Required slot count based on booking type
  const requiredSlots = bookingType === "package" && selectedTemplate
    ? selectedTemplate.classesIncluded
    : bookingType === "trial"
      ? 1
      : 0 // 0 means any number ≥ 1

  // Price display
  const priceDisplay = useMemo(() => {
    if (bookingType === "trial") return "Free"
    if (bookingType === "package" && selectedTemplate) {
      return `$${selectedTemplate.suggestedPrice.toFixed(2)} (${selectedTemplate.classesIncluded} classes)`
    }
    if (bookingType === "standalone" && selectedSlots.length > 0) {
      const total = teacher.rateNum * selectedSlots.length
      return `$${total.toFixed(2)} (${selectedSlots.length} × ${teacher.rate}/hr)`
    }
    return `${teacher.rate}/hr per class`
  }, [bookingType, selectedTemplate, selectedSlots.length, teacher.rateNum, teacher.rate])

    // Compute total amount for discount calculations
    const totalAmount = useMemo(() => {
      if (bookingType === "trial") return 0
      if (bookingType === "package" && selectedTemplate) return selectedTemplate.suggestedPrice
      if (bookingType === "standalone" && selectedSlots.length > 0) {
        return teacher.rateNum * selectedSlots.length
      }
      return 0
    }, [bookingType, selectedTemplate, selectedSlots.length, teacher.rateNum])
  
    // Wallet deduction preview
    const walletDeductionPreview = discountMethod === "wallet" && totalAmount > 0
      ? Math.min(walletBalance, totalAmount)
      : 0
  
    // Coupon discount preview
    const couponDeductionPreview = discountMethod === "coupon" && couponValid
      ? couponDiscountAmount
      : 0
  
    const amountAfterDiscount = totalAmount - (discountMethod === "coupon" ? couponDeductionPreview : walletDeductionPreview)

    const tzAbbr = useMemo(() => getTzAbbr(parentTimezone), [parentTimezone])
    const teacherTzAbbr = useMemo(() => getTzAbbr(teacher.timezone), [teacher.timezone])  
  
    async function validateCoupon() {
      if (!couponCode.trim()) return
      setCouponValidating(true)
      setCouponValid(null)
      setCouponMessage("")
      setCouponDiscountAmount(0)
      setCouponName("")
  
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponCode: couponCode.trim(), totalAmount }),
        })
        const data = await res.json()
  
        if (data.valid) {
          setCouponValid(true)
          setCouponMessage(data.message)
          setCouponDiscountAmount(data.discountAmount)
          setCouponName(data.couponName || data.couponCode)
        } else {
          setCouponValid(false)
          setCouponMessage(data.error || "Invalid coupon code.")
          setCouponDiscountAmount(0)
        }
      } catch {
        setCouponValid(false)
        setCouponMessage("Failed to validate coupon. Try again.")
      }
  
      setCouponValidating(false)
    }
  
    function resetCoupon() {
      setCouponCode("")
      setCouponValid(null)
      setCouponMessage("")
      setCouponDiscountAmount(0)
      setCouponName("")
    }
  
    function handleDiscountMethodChange(method: "none" | "coupon" | "wallet") {
      setDiscountMethod(method)
      if (method !== "coupon") resetCoupon()
    }
  

  function handleBookingTypeChange(type: BookingType) {
    setBookingType(type)
    setTemplateId("")
    setSelectedSlots([])
    setError("")
    setDiscountMethod("none")
    resetCoupon()
  }

  function handleSubjectChange(newSubjectId: string) {
    setSubjectId(newSubjectId)
    setTemplateId("")
    setSelectedSlots([])
    // Reset booking type if trial no longer eligible or templates change
    if (bookingType === "trial") {
      const eligible = trialEligibility.find(
        (te) => te.studentId === studentId && te.subjectId === newSubjectId
      )
      if (eligible && eligible.trialTaken) {
        setBookingType("standalone")
      }
    }
  }

  function handleStudentChange(newStudentId: string) {
    setStudentId(newStudentId)
    setSelectedSlots([])
    if (bookingType === "trial") {
      const eligible = trialEligibility.find(
        (te) => te.studentId === newStudentId && te.subjectId === subjectId
      )
      if (eligible && eligible.trialTaken) {
        setBookingType("standalone")
      }
    }
  }

  function toggleSlot(viewerDateStr: string, viewerTimeStr: string) {
    const key = `${viewerDateStr}_${viewerTimeStr}`
    const utcISO = slotToUTC.get(key) || ""
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => `${s.date}_${s.time}` === key)
      if (exists) return prev.filter((s) => `${s.date}_${s.time}` !== key)
      if (bookingType === "trial" && prev.length >= 1) return prev
      if (bookingType === "package" && selectedTemplate && prev.length >= selectedTemplate.classesIncluded) return prev
      return [...prev, { date: viewerDateStr, time: viewerTimeStr, dateObj: new Date(viewerDateStr + "T00:00:00Z"), utcISO }]
    })
  }

  function isSelected(viewerDateStr: string, viewerTimeStr: string) {
    return selectedSlots.some((s) => s.date === viewerDateStr && s.time === viewerTimeStr)
  }

  function canContinueToConfirm(): { ok: boolean; message: string } {
    if (!studentId) return { ok: false, message: "Please select a student." }
    if (!subjectId) return { ok: false, message: "Please select a subject." }
    if (selectedSlots.length === 0) return { ok: false, message: "Please select at least one time slot." }
    if (bookingType === "package") {
      if (!templateId) return { ok: false, message: "Please select a package." }
      if (selectedTemplate && selectedSlots.length !== selectedTemplate.classesIncluded) {
        const diff = selectedTemplate.classesIncluded - selectedSlots.length
        if (diff > 0) return { ok: false, message: `Please select ${diff} more class${diff > 1 ? "es" : ""} to match the package (${selectedTemplate.classesIncluded} required).` }
        return { ok: false, message: `Too many slots selected. This package includes ${selectedTemplate.classesIncluded} classes.` }
      }
    }
    if (bookingType === "trial" && selectedSlots.length !== 1) {
      return { ok: false, message: "Please select exactly 1 time slot for the trial class." }
    }
    return { ok: true, message: "" }
  }

  async function handleBook() {
    setError("")
    const check = canContinueToConfirm()
    if (!check.ok) return setError(check.message)

    setLoading(true)

    const slots = selectedSlots.map((slot) => slot.utcISO)

    try {
      const payload: any = {
        studentId,
        teacherId: teacher.id,
        subjectId,
        slots,
        duration: 60,
        isTrial: bookingType === "trial",
        discountMethod: bookingType === "trial" ? "none" : discountMethod,
      }

      if (bookingType === "package" && templateId) {
        payload.templateId = templateId
      }
      // Attach coupon code if using coupon discount
      if (discountMethod === "coupon" && couponValid && couponCode.trim()) {
        payload.couponCode = couponCode.trim()
      }

      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Booking failed")
        setLoading(false)
        return
      }

      if (data.pendingPayment) {
        setPendingPayment(true)
        setBookingOrderRef(data.orderRef || "")
      }

      setSuccess(true)
    } catch {
      setError("Network error. Please try again.")
    }

    setLoading(false)
  }

  // ── SUCCESS SCREEN ──
  if (success) {
    if (pendingPayment) {
      return (
        <div className="max-w-lg mx-auto mt-16 space-y-6">
          <div className="text-center space-y-3">
            <CheckCircle className="w-16 h-16 text-[#0D9488] mx-auto" />
            <h2 className="text-2xl font-bold text-[#1E293B]">Classes Reserved!</h2>
            {bookingOrderRef && (
              <p className="text-sm font-medium text-gray-500">
                Booking Ref: <span className="font-bold text-[#1E293B]">{bookingOrderRef}</span>
              </p>
            )}
            <p className="text-gray-500">
              {selectedSlots.length} class{selectedSlots.length > 1 ? "es" : ""} reserved with {teacher.name}.
              Choose how you&apos;d like to pay to confirm your booking.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={async () => {
                setError("")
                setLoading(true)
                try {
                  const paymentsRes = await fetch("/api/payments?status=PENDING")
                  const paymentsData = await paymentsRes.json()
                  let paymentIdToUse = ""
                  if (paymentsData.payments && paymentsData.payments.length > 0) {
                    const matchingPayment = paymentsData.payments.find(
                      (p: { studentId: string }) => p.studentId === studentId
                    ) || paymentsData.payments[0]
                    paymentIdToUse = matchingPayment.id
                  }
                  if (!paymentIdToUse) {
                    setError("Could not find the pending payment. Please try from your Payments page.")
                    setLoading(false)
                    return
                  }
                  const form = document.createElement("form")
                  form.method = "POST"
                  form.action = "/api/payments/ccavenue/redirect"
                  const input = document.createElement("input")
                  input.type = "hidden"
                  input.name = "paymentId"
                  input.value = paymentIdToUse
                  form.appendChild(input)
                  document.body.appendChild(form)
                  form.submit()
                } catch {
                  setError("Network error. Please try again.")
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="w-full flex items-center gap-4 p-5 bg-white border-2 border-[#0D9488] rounded-xl hover:bg-teal-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-[#0D9488]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#0D9488]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#1E293B]">Pay Online</p>
                  <span className="px-2 py-0.5 bg-[#0D9488] text-white text-[10px] font-bold rounded-full uppercase">Recommended</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Credit Card, Debit Card, Net Banking, UPI, Wallets</p>
              </div>
              {loading ? <Loader2 className="w-5 h-5 text-[#0D9488] animate-spin flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0D9488] flex-shrink-0" />}
            </button>

            <button
              onClick={() => router.push("/parent/payments")}
              className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1E293B]">Bank Transfer</p>
                <p className="text-sm text-gray-500 mt-0.5">Transfer to our bank account &middot; Admin confirms manually</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Time slots are reserved</p>
            <p>Your selected class times are held for you. Classes will be confirmed once payment is received and verified.</p>
          </div>

          <div className="text-center">
            <button onClick={() => router.push("/parent/classes")} className="text-sm text-gray-400 hover:text-gray-600 hover:underline transition-colors">
              I&apos;ll pay later &middot; View my classes
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-[#22C55E] mx-auto" />
        <h2 className="text-2xl font-bold text-[#1E293B]">Classes Booked!</h2>
        <p className="text-gray-500">
          {selectedSlots.length} class{selectedSlots.length > 1 ? "es" : ""} scheduled with {teacher.name}.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <button onClick={() => router.push("/parent/classes")} className="px-5 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">View My Classes</button>
          <button onClick={() => router.push("/parent/teachers")} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Back to Teachers</button>
        </div>
      </div>
    )
  }

  // ── CONFIRMATION STEP ──
  if (step === "confirm") {
    const studentName = students.find((s) => s.id === studentId)?.name || ""
    const subjectName = teacher.subjects.find((s) => s.id === subjectId)?.name || ""

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setStep("browse")} className="flex items-center gap-1 text-sm text-[#0D9488] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to calendar
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-bold text-[#1E293B]">Confirm Booking</h2>

          {/* Booking summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Teacher</p>
                <p className="font-bold text-[#1E293B]">{teacher.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Student</p>
                <p className="font-bold text-[#1E293B]">{studentName}</p>
              </div>
              <div>
                <p className="text-gray-500">Subject</p>
                <p className="font-bold text-[#1E293B]">{subjectName}</p>
              </div>
              <div>
                <p className="text-gray-500">Booking Type</p>
                <p className="font-bold text-[#1E293B]">
                  {bookingType === "package" && selectedTemplate
                    ? selectedTemplate.name
                    : bookingType === "trial"
                      ? "Free Trial Class"
                      : "Standalone Class"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{selectedSlots.length} class{selectedSlots.length > 1 ? "es" : ""} selected</p>
                <p className="text-lg font-bold text-[#0D9488]">{priceDisplay}</p>
              </div>
            </div>
          </div>

          {/* Slot list */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Scheduled Classes:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSlots
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((s) => (
                  <span key={`${s.date}_${s.time}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                    {new Date(s.date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })} at {formatTime(s.time)} {tzAbbr}
                  </span>
                ))}
            </div>
          </div>

          {/* Trial badge */}
          {bookingType === "trial" && (
            <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <div><span className="font-semibold">Free Trial Class</span> — This is a complimentary trial session. No payment required.</div>
            </div>
          )}

          {/* ── Discount Section (non-trial only) ── */}
          {bookingType !== "trial" && totalAmount > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Apply Discount (optional)</p>

              {/* Radio options */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleDiscountMethodChange("none")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    discountMethod === "none"
                      ? "border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  No Discount
                </button>

                <button
                  type="button"
                  onClick={() => handleDiscountMethodChange("coupon")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    discountMethod === "coupon"
                      ? "border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Use Coupon
                </button>

                {walletBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDiscountMethodChange("wallet")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      discountMethod === "wallet"
                        ? "border-[#F59E0B] bg-[#F59E0B]/5 text-[#F59E0B]"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Use Wallet (${walletBalance.toFixed(2)})
                  </button>
                )}
              </div>

              {/* Coupon input */}
              {discountMethod === "coupon" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase())
                        if (couponValid !== null) resetCoupon()
                      }}
                      placeholder="Enter coupon code"
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] ${
                        couponValid === true ? "border-green-400 bg-green-50" :
                        couponValid === false ? "border-red-300 bg-red-50" :
                        "border-gray-200"
                      }`}
                      disabled={couponValidating}
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={!couponCode.trim() || couponValidating || couponValid === true}
                      className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {couponValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : couponValid === true ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>

                  {couponMessage && (
                    <div className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${
                      couponValid
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {couponValid ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <span>{couponMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Wallet preview */}
              {discountMethod === "wallet" && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  <Wallet className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Wallet balance: ${walletBalance.toFixed(2)}</p>
                    <p className="text-xs mt-0.5">
                      ${walletDeductionPreview.toFixed(2)} will be deducted from your wallet.
                      {amountAfterDiscount > 0 && ` Remaining $${amountAfterDiscount.toFixed(2)} via payment.`}
                      {amountAfterDiscount === 0 && " No additional payment needed!"}
                    </p>
                  </div>
                </div>
              )}

              {/* Updated total */}
              {(couponDeductionPreview > 0 || walletDeductionPreview > 0) && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Original Total</span>
                    <span className="text-gray-400 line-through">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {discountMethod === "coupon" ? `Coupon (${couponName})` : "Wallet Balance"}
                    </span>
                    <span className="text-green-600 font-medium">
                      -${(discountMethod === "coupon" ? couponDeductionPreview : walletDeductionPreview).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1E293B]">Amount Due</span>
                    <span className="text-lg font-bold text-[#0D9488]">${amountAfterDiscount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Package info */}
          {bookingType === "package" && selectedTemplate && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <Package className="w-4 h-4 flex-shrink-0" />
              <div><span className="font-semibold">{selectedTemplate.name}</span> — {selectedTemplate.classesIncluded} classes for ${selectedTemplate.suggestedPrice.toFixed(2)} · Valid for {selectedTemplate.validityDays} days</div>
            </div>
          )}

          {/* Standalone info */}
          {bookingType === "standalone" && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              Booking {selectedSlots.length} standalone class{selectedSlots.length > 1 ? "es" : ""} at {teacher.rate}/hr each.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStep("browse")} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Back</button>
            <button
              onClick={handleBook}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Booking...</>
                : bookingType === "trial"
                  ? "Book Trial Class"
                  : <>Book {selectedSlots.length} Class{selectedSlots.length > 1 ? "es" : ""}</>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── BROWSE / CALENDAR STEP ──
  const continueCheck = canContinueToConfirm()

  return (
    <div className="space-y-6">
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

      {/* Booking Options Card — Student, Subject, Booking Type, Package */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-bold text-[#1E293B]">Booking Options</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select value={studentId} onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select value={subjectId} onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
              <option value="">Select subject</option>
              {teacher.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Booking Type Selector */}
        {studentId && subjectId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Package option */}
              {filteredTemplates.length > 0 && (
                <button
                  onClick={() => handleBookingTypeChange("package")}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    bookingType === "package"
                      ? "border-[#0D9488] bg-teal-50/50 ring-1 ring-[#0D9488]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Package className={`w-5 h-5 mb-2 ${bookingType === "package" ? "text-[#0D9488]" : "text-gray-400"}`} />
                  <p className={`text-sm font-semibold ${bookingType === "package" ? "text-[#0D9488]" : "text-[#1E293B]"}`}>Package</p>
                  <p className="text-xs text-gray-500 mt-0.5">Save with bundled classes</p>
                </button>
              )}

              {/* Trial option */}
              {isTrialEligible && (
                <button
                  onClick={() => handleBookingTypeChange("trial")}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    bookingType === "trial"
                      ? "border-[#F59E0B] bg-amber-50/50 ring-1 ring-[#F59E0B]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 mb-2 ${bookingType === "trial" ? "text-[#F59E0B]" : "text-gray-400"}`} />
                  <p className={`text-sm font-semibold ${bookingType === "trial" ? "text-[#F59E0B]" : "text-[#1E293B]"}`}>Trial Class</p>
                  <p className="text-xs text-gray-500 mt-0.5">1 free session</p>
                </button>
              )}

              {/* Standalone option */}
              <button
                onClick={() => handleBookingTypeChange("standalone")}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  bookingType === "standalone"
                    ? "border-[#1E3A5F] bg-blue-50/50 ring-1 ring-[#1E3A5F]/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Calendar className={`w-5 h-5 mb-2 ${bookingType === "standalone" ? "text-[#1E3A5F]" : "text-gray-400"}`} />
                <p className={`text-sm font-semibold ${bookingType === "standalone" ? "text-[#1E3A5F]" : "text-[#1E293B]"}`}>Standalone</p>
                <p className="text-xs text-gray-500 mt-0.5">{teacher.rate}/hr per class</p>
              </button>
            </div>
          </div>
        )}

        {/* Package template dropdown */}
        {bookingType === "package" && filteredTemplates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Package *</label>
            <select
              value={templateId}
              onChange={(e) => { setTemplateId(e.target.value); setSelectedSlots([]); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
            >
              <option value="">Choose a package</option>
              {filteredTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.classesIncluded} classes — ${t.suggestedPrice.toFixed(2)}{t.isPopular ? " (Popular)" : ""}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">
                <p className="font-semibold">{selectedTemplate.name}</p>
                {selectedTemplate.description && <p className="text-xs mt-0.5">{selectedTemplate.description}</p>}
                <p className="text-xs mt-1">Select exactly <strong>{selectedTemplate.classesIncluded}</strong> time slots below · Valid for {selectedTemplate.validityDays} days · <strong>${selectedTemplate.suggestedPrice.toFixed(2)}</strong></p>
              </div>
            )}
          </div>
        )}

        {/* Slot counter for package */}
        {bookingType === "package" && selectedTemplate && selectedSlots.length > 0 && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            selectedSlots.length === selectedTemplate.classesIncluded
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}>
            {selectedSlots.length === selectedTemplate.classesIncluded
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            }
            {selectedSlots.length} of {selectedTemplate.classesIncluded} classes selected
            {selectedSlots.length < selectedTemplate.classesIncluded &&
              ` — select ${selectedTemplate.classesIncluded - selectedSlots.length} more`
            }
          </div>
        )}

        {/* Trial info */}
        {bookingType === "trial" && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Select 1 time slot below for your free trial class. No payment required.
          </div>
        )}

        {/* Price display */}
        {studentId && subjectId && (bookingType !== "package" || templateId) && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Estimated Total</span>
            <span className="text-lg font-bold text-[#0D9488]">{priceDisplay}</span>
          </div>
        )}
      </div>

      {/* Availability Calendar — show only when ready to select slots */}
      {studentId && subjectId && (bookingType !== "package" || templateId) && (
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
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="text-xs text-gray-400 font-medium py-2 text-center">Time ({tzAbbr})</div>
                {weekDates.map((d, i) => {
                  const dateStr = refDateToLocalStr(d)
                  const todayLocal = utcToLocal(now, parentTimezone)
                  const isToday = dateStr === todayLocal.dateStr
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

              {(() => {
                // Collect all unique viewer time slots from the converted availability
                const allViewerTimeSlots = new Set<string>()
                for (const [, times] of availSlots) {
                  times.forEach((t) => allViewerTimeSlots.add(t))
                }
                const sortedSlots = Array.from(allViewerTimeSlots).sort()

                const todayLocal = utcToLocal(now, parentTimezone)

                return sortedSlots.map((timeSlot) => {
                  const hour = parseInt(timeSlot.split(":")[0])
                  const ampm = hour >= 12 ? "PM" : "AM"
                  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                  const timeLabel = `${h12}:${timeSlot.split(":")[1]} ${ampm}`

                  return (
                    <div key={timeSlot} className="grid grid-cols-8 gap-1 mb-1">
                      <div className="text-xs text-gray-400 py-2 text-center font-medium">{timeLabel}</div>
                      {weekDates.map((dateObj, dayIdx) => {
                        const dateStr = refDateToLocalStr(dateObj)
                        const slotKey = `${dateStr}_${timeSlot}`
                        const utcISO = slotToUTC.get(slotKey)

                        // Check if this slot exists in converted availability
                        const isAvailable = availSlots.get(dateStr)?.includes(timeSlot) ?? false

                        // Past check (in viewer's timezone)
                        const isPast = dateStr < todayLocal.dateStr
                        const isPastToday = dateStr === todayLocal.dateStr && parseInt(timeSlot.split(":")[0]) <= todayLocal.hour

                        // Blocked check — need to check the teacher's date for this slot
                        let isBlocked = false
                        if (utcISO) {
                          const utcDate = new Date(utcISO)
                          const teacherLocal = utcToLocal(utcDate, teacher.timezone)
                          isBlocked = blockedSet.has(teacherLocal.dateStr)
                        }

                        const isBooked = bookedSet.has(slotKey)
                        const unavailable = !isAvailable || isPast || isPastToday || isBlocked || isBooked
                        const selected = isSelected(dateStr, timeSlot)

                        const atMax = !selected && (
                          (bookingType === "trial" && selectedSlots.length >= 1) ||
                          (bookingType === "package" && selectedTemplate && selectedSlots.length >= selectedTemplate.classesIncluded)
                        )

                        if (unavailable) {
                          return (
                            <div key={dayIdx} className={`py-2 rounded-md text-center text-xs ${
                              isBooked ? "bg-red-50 text-red-300 line-through" : "bg-gray-50 text-gray-300"
                            }`}>
                              {isBooked ? "Booked" : isAvailable ? "Past" : ""}
                            </div>
                          )
                        }

                        if (atMax && !selected) {
                          return (
                            <div key={dayIdx} className="py-2 rounded-md text-center text-xs bg-gray-50 text-gray-300" />
                          )
                        }

                        return (
                          <button
                            key={dayIdx}
                            onClick={() => toggleSlot(dateStr, timeSlot)}
                            className={`py-2 rounded-md text-center text-xs font-medium transition-all ${
                              selected
                                ? "bg-[#0D9488] text-white shadow-sm ring-2 ring-[#0D9488]/30"
                                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            }`}
                          >
                            {selected ? "Selected" : "Available"}
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">Legend:</span>
            <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-green-50 border border-green-200" /><span className="text-xs text-gray-600">Available</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-[#0D9488]" /><span className="text-xs text-gray-600">Selected</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-red-50 border border-red-100" /><span className="text-xs text-gray-600">Booked</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-gray-50 border border-gray-100" /><span className="text-xs text-gray-600">Unavailable</span></div>
          </div>
        </div>
      )}

      {/* Floating action bar */}
      {selectedSlots.length > 0 && (
        <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">
              {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
              {bookingType === "package" && selectedTemplate && (
                <span className="font-normal text-gray-500"> of {selectedTemplate.classesIncluded} required</span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {selectedSlots
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 4)
                .map((s) => `${new Date(s.date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })} ${formatTime(s.time)} ${tzAbbr}`)
                .join(" · ")}
              {selectedSlots.length > 4 && ` +${selectedSlots.length - 4} more`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedSlots([])}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Clear
            </button>
            <button
              onClick={() => {
                const check = canContinueToConfirm()
                if (!check.ok) {
                  setError(check.message)
                  return
                }
                setError("")
                setStep("confirm")
              }}
              disabled={!continueCheck.ok}
              className="px-5 py-2.5 bg-[#0D9488] text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Continue to Book
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
    </div>
  )
}
