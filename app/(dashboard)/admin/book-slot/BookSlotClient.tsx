"use client"

import React, { useState, useMemo } from "react"
import {
  ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertTriangle,
  User, BookOpen, Calendar, Clock, Package, Ticket, Wallet, ArrowLeft,
} from "lucide-react"
import {
  getWeekDatesInTZ, utcToLocal, localToUTC, refDateToLocalStr,
  getTzAbbr, to24, convertAvailabilitySlots,
} from "@/lib/timezone"

/* ──────────────────── Types ──────────────────── */

type Student = {
  id: string; name: string; grade: string
  gradeBandId: string | null; gradeBandName: string | null
  parentId: string | null
  parentName: string; parentEmail: string; parentTimezone: string
  walletBalance: number
}

type Subject = { id: string; name: string }

type Teacher = {
  id: string; name: string; timezone: string
  subjects: Subject[]
  availability: { dayOfWeek: string; startTime: string; endTime: string }[]
  blockedDates: string[]
  bookedSlots: { start: string; duration: number }[]
  defaultRate: number
}

type TeacherRate = {
  teacherId: string; subjectId: string; gradeBandId: string
  studentFacingRate: number; compensationRate: number
}

type PackageTemplate = {
  id: string; name: string; subjectId: string; subjectName: string
  classesIncluded: number; validityDays: number; suggestedPrice: number
  description: string; isPopular: boolean
}

type Props = {
  role: "ADMIN" | "COORDINATOR"
  students: Student[]
  teachers: Teacher[]
  teacherRates: TeacherRate[]
  packageTemplates: PackageTemplate[]
  allGrades: GradeOption[]
}

type Step = "select" | "slots" | "confirm"
type SlotMode = "availability" | "custom"

// Add this type near the top with other types
type GradeOption = {
  id: string; name: string; shortName: string; sortOrder: number
  gradeBandId: string; gradeBandName: string
}

/* ──────────────────── Component ──────────────────── */

export function BookSlotClient({ role, students, teachers, teacherRates, packageTemplates, allGrades }: Props) {
  // Step state
  const [step, setStep] = useState<Step>("select")

  // Step 1 — selections
  const [studentId, setStudentId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [selectedGradeId, setSelectedGradeId] = useState("")

  // Step 2 — slots
  const [slotMode, setSlotMode] = useState<SlotMode>("availability")
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]) // UTC ISO strings

  // Custom slot
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("")

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // ── Derived data ──
  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [studentId, students])
  const selectedTeacher = useMemo(() => teachers.find((t) => t.id === teacherId), [teacherId, teachers])

  const teacherSubjects = useMemo(() => {
    if (!selectedTeacher) return []
    return selectedTeacher.subjects
  }, [selectedTeacher])

  const selectedTemplate = useMemo(
    () => packageTemplates.find((t) => t.id === templateId),
    [templateId, packageTemplates]
  )

    // Derive gradeBandId from the selected grade (not from student profile)
  const selectedGrade = useMemo(() => {
    if (!selectedGradeId) return null
    return allGrades.find((g) => g.id === selectedGradeId) || null
  }, [selectedGradeId, allGrades])

  const selectedGradeBandId = selectedGrade?.gradeBandId || null

  // Filter grades to only those whose grade-band has an active rate for this teacher+subject
  const eligibleGrades = useMemo(() => {
    if (!teacherId || !subjectId) return []
    const eligibleBandIds = new Set(
      teacherRates
        .filter((r) => r.teacherId === teacherId && r.subjectId === subjectId)
        .map((r) => r.gradeBandId)
    )
    if (eligibleBandIds.size === 0) return []
    return allGrades.filter((g) => eligibleBandIds.has(g.gradeBandId))
  }, [teacherId, subjectId, teacherRates, allGrades])

  // Rate: grade-band rate if found, else teacher's default
  const effectiveRate = useMemo(() => {
    if (!teacherId || !subjectId) return 0
    if (selectedGradeBandId) {
      const rate = teacherRates.find(
        (r) => r.teacherId === teacherId && r.subjectId === subjectId && r.gradeBandId === selectedGradeBandId
      )
      if (rate) return rate.studentFacingRate
    }
    return selectedTeacher?.defaultRate || 0
  }, [teacherId, subjectId, selectedGradeBandId, teacherRates, selectedTeacher])

  const totalAmount = useMemo(() => {
    if (selectedTemplate) return selectedTemplate.suggestedPrice
    return effectiveRate * selectedSlots.length
  }, [effectiveRate, selectedSlots.length, selectedTemplate])

  // ── Availability calendar ──
  const adminTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
  const parentTZ = selectedStudent?.parentTimezone || "America/New_York"
  const teacherTZ = selectedTeacher?.timezone || "Asia/Kolkata"

  const weekDates = useMemo(
    () => getWeekDatesInTZ(weekOffset, adminTZ),
    [weekOffset, adminTZ]
  )

  const { availSlots, slotToUTC } = useMemo(() => {
    if (!selectedTeacher) return { availSlots: new Map(), slotToUTC: new Map() }
    return convertAvailabilitySlots(
      selectedTeacher.availability,
      weekDates,
      teacherTZ,
      adminTZ
    )
  }, [selectedTeacher, weekDates, teacherTZ, adminTZ])

  // Booked set for this teacher
  const bookedSet = useMemo(() => {
    const set = new Set<string>()
    if (!selectedTeacher) return set
    for (const slot of selectedTeacher.bookedSlots) {
      const local = utcToLocal(new Date(slot.start), adminTZ)
      set.add(`${local.dateStr}_${local.timeStr}`)
    }
    return set
  }, [selectedTeacher, adminTZ])

  // Blocked dates set
  const blockedSet = useMemo(() => {
    return new Set(selectedTeacher?.blockedDates || [])
  }, [selectedTeacher])

  // Collect all unique time strings across all days
  const allTimeSlots = useMemo(() => {
    const times = new Set<string>()
    for (const [, slots] of availSlots) {
      for (const s of slots) times.add(s)
    }
    return [...times].sort()
  }, [availSlots])

  // ── Slot formatting helpers ──
  function formatSlotDualTZ(utcIso: string) {
    const utcDate = new Date(utcIso)
    const pLocal = utcToLocal(utcDate, parentTZ)
    const tLocal = utcToLocal(utcDate, teacherTZ)
    const pAbbr = getTzAbbr(parentTZ, utcDate)
    const tAbbr = getTzAbbr(teacherTZ, utcDate)
    return {
      parentStr: `${pLocal.dateFormatted} ${pLocal.formatted12h} ${pAbbr}`,
      teacherStr: `${tLocal.dateFormatted} ${tLocal.formatted12h} ${tAbbr}`,
    }
  }

  // ── Handlers ──
  function handleStudentChange(id: string) {
    setStudentId(id)
    setTeacherId("")
    setSubjectId("")
    setTemplateId("")
    setSelectedSlots([])
    setError("")
    // Auto-select grade from student's profile if available
    const student = students.find((s) => s.id === id)
    if (student?.gradeBandId) {
      const matchingGrade = allGrades.find((g) => g.gradeBandId === student.gradeBandId)
      setSelectedGradeId(matchingGrade?.id || "")
    } else {
      setSelectedGradeId("")
    }
  }

  function handleTeacherChange(id: string) {
    setTeacherId(id)
    setSubjectId("")
    setTemplateId("")
    setSelectedSlots([])
    setWeekOffset(0)
    setError("")
  }

  function handleSubjectChange(id: string) {
    setSubjectId(id)
    setTemplateId("")
    setSelectedSlots([])
    setError("")
    // Keep selectedGradeId — but if it's no longer eligible, clear it
    if (selectedGradeId) {
      const stillEligible = teacherRates.some(
        (r) => r.teacherId === teacherId && r.subjectId === id && r.gradeBandId === (allGrades.find((g) => g.id === selectedGradeId)?.gradeBandId || "")
      )
      if (!stillEligible) setSelectedGradeId("")
    }
  }

  function toggleSlot(dateStr: string, timeStr: string) {
    const key = `${dateStr}_${timeStr}`
    const utcIso = slotToUTC.get(key)
    if (!utcIso) return

    setSelectedSlots((prev) =>
      prev.includes(utcIso)
        ? prev.filter((s) => s !== utcIso)
        : [...prev, utcIso]
    )
    setError("")
  }

  function addCustomSlot() {
    if (!customDate || !customTime) return
    // customDate = YYYY-MM-DD, customTime = HH:mm in admin's local timezone
    const utcDate = localToUTC(customDate, customTime, adminTZ)
    const utcIso = utcDate.toISOString()
    if (!selectedSlots.includes(utcIso)) {
      setSelectedSlots((prev) => [...prev, utcIso])
    }
    setCustomDate("")
    setCustomTime("")
    setError("")
  }

  function removeSlot(utcIso: string) {
    setSelectedSlots((prev) => prev.filter((s) => s !== utcIso))
  }

  function canProceedToSlots() {
    return studentId && teacherId && subjectId
  }

  function canProceedToConfirm() {
    if (selectedTemplate) {
      return selectedSlots.length === selectedTemplate.classesIncluded
    }
    return selectedSlots.length > 0
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/admin/book-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          teacherId,
          subjectId,
          slots: selectedSlots,
          isCustomSlot: slotMode === "custom",
          couponCode: couponCode.trim() || undefined,
          templateId: templateId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Booking failed")
        setSubmitting(false)
        return
      }

      setSuccess(data.message || "Booking successful!")
      // Reset after success
      setTimeout(() => {
        setStep("select")
        setStudentId("")
        setTeacherId("")
        setSubjectId("")
        setTemplateId("")
        setCouponCode("")
        setSelectedSlots([])
        setSuccess("")
      }, 3000)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Filtered package templates for the selected subject ──
  const availableTemplates = useMemo(
    () => packageTemplates.filter((t) => t.subjectId === subjectId),
    [subjectId, packageTemplates]
  )

  // ── Today boundary ──
  const todayStr = refDateToLocalStr(weekDates[0] || new Date())

  // ─────────────────────────── RENDER ───────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Book Slot</h1>
        <p className="text-sm text-gray-500 mt-1">
          Book classes on behalf of a parent. Wallet balance will be deducted automatically.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["select", "slots", "confirm"] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => {
                if (s === "select") setStep("select")
                if (s === "slots" && canProceedToSlots()) setStep("slots")
                if (s === "confirm" && canProceedToConfirm()) setStep("confirm")
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s
                  ? "bg-[#0D9488] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {i + 1}. {s === "select" ? "Select" : s === "slots" ? "Time Slots" : "Confirm"}
            </button>
            {i < 2 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* ════════════ STEP 1: SELECT ════════════ */}
      {step === "select" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <User className="w-4 h-4 inline mr-1" />Student
            </label>
            <select
              value={studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            >
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.grade} (Parent: {s.parentName})
                </option>
              ))}
            </select>
          </div>

          {/* Parent info card */}
          {selectedStudent && (
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Parent</span>
                <span className="font-medium text-[#1E293B]">{selectedStudent.parentName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Email</span>
                <span className="font-medium text-[#1E293B]">{selectedStudent.parentEmail}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Timezone</span>
                <span className="font-medium text-[#1E293B]">{selectedStudent.parentTimezone}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Wallet Balance</span>
                <span className={`font-bold ${selectedStudent.walletBalance > 0 ? "text-green-600" : "text-red-500"}`}>
                  ${selectedStudent.walletBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <BookOpen className="w-4 h-4 inline mr-1" />Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              disabled={!studentId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] disabled:opacity-50"
            >
              <option value="">Select a teacher…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.timezone})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={!teacherId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] disabled:opacity-50"
            >
              <option value="">Select a subject…</option>
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          {subjectId && eligibleGrades.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
              >
                <option value="">Select grade…</option>
                {eligibleGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.gradeBandName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show rate info */}
          {subjectId && teacherId && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              Rate: <span className="font-semibold text-[#1E293B]">${effectiveRate}/hr</span>
              {selectedGradeBandId ? (
                <span className="text-xs text-green-600 ml-2">(grade-band rate)</span>
              ) : (
                <span className="text-xs text-amber-600 ml-2">(teacher default rate — select a grade for subject-specific pricing)</span>
              )}
            </div>
          )}


          {/* Rate info */}
          {subjectId && effectiveRate > 0 && (
            <div className="text-sm text-gray-600">
              Rate: <span className="font-semibold text-[#1E293B]">${effectiveRate.toFixed(2)}/hr</span>
              {selectedStudent?.gradeBandName && (
                <span className="text-xs text-gray-400 ml-2">({selectedStudent.gradeBandName})</span>
              )}
            </div>
          )}

          {/* Package template */}
          {availableTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Package className="w-4 h-4 inline mr-1" />Package (optional)
              </label>
              <select
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value)
                  setSelectedSlots([])
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              >
                <option value="">Standalone classes</option>
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.classesIncluded} classes — ${t.suggestedPrice.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Coupon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Ticket className="w-4 h-4 inline mr-1" />Coupon Code (optional)
            </label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          <button
            onClick={() => setStep("slots")}
            disabled={!canProceedToSlots()}
            className="w-full py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next — Select Time Slots
          </button>
        </div>
      )}

      {/* ════════════ STEP 2: SLOTS ════════════ */}
      {step === "slots" && (
        <div className="space-y-4">
          <button onClick={() => setStep("select")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0D9488]">
            <ArrowLeft className="w-4 h-4" /> Back to selection
          </button>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSlotMode("availability")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                slotMode === "availability"
                  ? "bg-[#0D9488] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              From Availability
            </button>
            <button
              onClick={() => setSlotMode("custom")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                slotMode === "custom"
                  ? "bg-[#0D9488] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Custom Slot
            </button>
          </div>

          {selectedTemplate && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Package: <strong>{selectedTemplate.name}</strong> — select exactly{" "}
              <strong>{selectedTemplate.classesIncluded}</strong> slots.
              Selected: {selectedSlots.length} / {selectedTemplate.classesIncluded}
            </div>
          )}

          {/* ── Availability grid ── */}
          {slotMode === "availability" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              {/* Week nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-[#1E293B]">
                  {weekDates[0]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                  {weekDates[6]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded hover:bg-gray-100">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs text-[#0D9488] hover:underline"
                  >
                    This week
                  </button>
                </div>
              </div>

              {/* Timezone info */}
              <div className="mb-3 text-xs text-gray-500 flex flex-wrap gap-x-4">
                <span>Viewing in: <strong>{getTzAbbr(adminTZ)}</strong> (your timezone)</span>
                <span>Teacher: <strong>{getTzAbbr(teacherTZ)}</strong></span>
                <span>Parent: <strong>{getTzAbbr(parentTZ)}</strong></span>
              </div>

              {/* Grid */}
              {allTimeSlots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No available slots this week. Try navigating to another week or use Custom Slot.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-1 text-xs text-gray-500 w-20">Time</th>
                        {weekDates.map((d, i) => {
                          const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                          return (
                            <th key={i} className="text-center py-2 px-1 text-xs text-gray-500">
                              <div>{dayNames[i]}</div>
                              <div className="font-semibold text-[#1E293B]">{d.getUTCDate()}</div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {allTimeSlots.map((timeStr) => (
                        <tr key={timeStr} className="border-b border-gray-50">
                          <td className="py-1.5 px-1 text-xs text-gray-500 whitespace-nowrap">
                            {(() => {
                              const [h, m] = timeStr.split(":").map(Number)
                              const ampm = h >= 12 ? "PM" : "AM"
                              const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
                              return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
                            })()}
                          </td>
                          {weekDates.map((d, colIdx) => {
                            const dateStr = refDateToLocalStr(d)
                            const key = `${dateStr}_${timeStr}`
                            const slotsForDay = availSlots.get(dateStr) || []
                            const isAvailable = slotsForDay.includes(timeStr)
                            const isBooked = bookedSet.has(key)
                            const isBlocked = blockedSet.has(dateStr)
                            const utcIso = slotToUTC.get(key)
                            const isSelected = utcIso ? selectedSlots.includes(utcIso) : false

                            // Past check
                            const isPast = utcIso ? new Date(utcIso) < new Date() : false

                            if (!isAvailable) {
                              return <td key={colIdx} className="py-1.5 px-1 text-center" />
                            }

                            if (isBooked || isBlocked || isPast) {
                              return (
                                <td key={colIdx} className="py-1.5 px-1 text-center">
                                  <span className="inline-block px-2 py-1 text-[10px] rounded bg-gray-100 text-gray-400">
                                    {isBooked ? "Booked" : isPast ? "Past" : "Blocked"}
                                  </span>
                                </td>
                              )
                            }

                            const atPackageLimit = selectedTemplate
                              ? selectedSlots.length >= selectedTemplate.classesIncluded && !isSelected
                              : false

                            return (
                              <td key={colIdx} className="py-1.5 px-1 text-center">
                                <button
                                  onClick={() => toggleSlot(dateStr, timeStr)}
                                  disabled={atPackageLimit}
                                  className={`inline-block px-2 py-1 text-[10px] rounded font-medium transition-colors ${
                                    isSelected
                                      ? "bg-[#0D9488] text-white"
                                      : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                                  } ${atPackageLimit ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  {isSelected ? "Selected" : "Available"}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-50 border border-teal-200" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#0D9488]" /> Selected</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Booked/Blocked</span>
              </div>
            </div>
          )}

          {/* ── Custom slot picker ── */}
          {slotMode === "custom" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
              <p className="text-xs text-gray-500">
                Pick any date and time. This bypasses teacher availability — use when you&apos;ve confirmed with the teacher directly.
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Time ({getTzAbbr(adminTZ)})
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={addCustomSlot}
                  disabled={!customDate || !customTime}
                  className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* ── Selected slots list with dual TZ preview ── */}
          {selectedSlots.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-[#1E293B] mb-3">
                Selected Slots ({selectedSlots.length})
              </h3>
              <div className="space-y-2">
                {[...selectedSlots].sort().map((utcIso) => {
                  const { parentStr, teacherStr } = formatSlotDualTZ(utcIso)
                  return (
                    <div
                      key={utcIso}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <span>
                          <span className="text-xs text-gray-400">Parent:</span>{" "}
                          <span className="font-medium text-[#1E293B]">{parentStr}</span>
                        </span>
                        <span>
                          <span className="text-xs text-gray-400">Teacher:</span>{" "}
                          <span className="font-medium text-[#1E293B]">{teacherStr}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => removeSlot(utcIso)}
                        className="ml-2 text-red-400 hover:text-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep("confirm")}
            disabled={!canProceedToConfirm()}
            className="w-full py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next — Review & Confirm
          </button>
        </div>
      )}

      {/* ════════════ STEP 3: CONFIRM ════════════ */}
      {step === "confirm" && (
        <div className="space-y-4">
          <button onClick={() => setStep("slots")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0D9488]">
            <ArrowLeft className="w-4 h-4" /> Back to slots
          </button>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#1E293B]">Booking Summary</h2>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs block">Student</span>
                <span className="font-medium text-[#1E293B]">{selectedStudent?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Parent</span>
                <span className="font-medium text-[#1E293B]">{selectedStudent?.parentName}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Teacher</span>
                <span className="font-medium text-[#1E293B]">{selectedTeacher?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Subject</span>
                <span className="font-medium text-[#1E293B]">
                  {teacherSubjects.find((s) => s.id === subjectId)?.name}
                </span>
              </div>
              {selectedTemplate && (
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs block">Package</span>
                  <span className="font-medium text-[#1E293B]">{selectedTemplate.name}</span>
                </div>
              )}
            </div>

            {/* Slots dual TZ */}
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B] mb-2">
                Scheduled Classes ({selectedSlots.length})
              </h3>
              <div className="space-y-2">
                {[...selectedSlots].sort().map((utcIso, i) => {
                  const { parentStr, teacherStr } = formatSlotDualTZ(utcIso)
                  return (
                    <div key={utcIso} className="bg-gray-50 rounded-lg px-3 py-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <span>
                        <span className="text-xs text-gray-400">Parent ({getTzAbbr(parentTZ)}):</span>{" "}
                        <span className="font-medium">{parentStr}</span>
                      </span>
                      <span>
                        <span className="text-xs text-gray-400">Teacher ({getTzAbbr(teacherTZ)}):</span>{" "}
                        <span className="font-medium">{teacherStr}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rate</span>
                <span className="font-medium">${effectiveRate.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Classes</span>
                <span className="font-medium">{selectedSlots.length} × 60 min</span>
              </div>
              {couponCode && (
                <div className="flex justify-between text-amber-600">
                  <span>Coupon ({couponCode})</span>
                  <span>Applied at checkout</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-[#1E293B]">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  <Wallet className="w-4 h-4 inline mr-1" />Wallet Balance
                </span>
                <span className={`font-semibold ${(selectedStudent?.walletBalance || 0) >= totalAmount ? "text-green-600" : "text-red-500"}`}>
                  ${(selectedStudent?.walletBalance || 0).toFixed(2)}
                </span>
              </div>
              {(selectedStudent?.walletBalance || 0) < totalAmount && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    Insufficient wallet balance. The parent needs to top up at least{" "}
                    <strong>${(totalAmount - (selectedStudent?.walletBalance || 0)).toFixed(2)}</strong>{" "}
                    before this booking can be confirmed.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                (selectedStudent?.walletBalance || 0) < totalAmount
              }
              className="w-full py-3 rounded-lg bg-[#0D9488] text-white font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Booking…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Confirm & Book
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
