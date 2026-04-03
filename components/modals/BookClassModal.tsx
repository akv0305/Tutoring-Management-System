"use client"

import React, { useState, useEffect } from "react"
import { X, CalendarPlus, Loader2, AlertTriangle, CheckCircle, Clock } from "lucide-react"

type Student = { id: string; name: string }
type Teacher = { id: string; name: string; subjects: { id: string; name: string }[] }
type PackageOption = { id: string; label: string; remaining: number; subjectId: string; teacherId: string }

export function BookClassModal({
  open,
  onClose,
  onSuccess,
  role,
  students,
  teachers,
  packages,
  preselectedStudentId,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  role: "COORDINATOR" | "PARENT"
  students: Student[]
  teachers: Teacher[]
  packages: PackageOption[]
  preselectedStudentId?: string
}) {
  const [studentId, setStudentId] = useState(preselectedStudentId ?? "")
  const [teacherId, setTeacherId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [packageId, setPackageId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState(60)
  const [isTrial, setIsTrial] = useState(false)
  const [topic, setTopic] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(false)
  const [bookingOrderRef, setBookingOrderRef] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStudentId(preselectedStudentId ?? "")
      setTeacherId("")
      setSubjectId("")
      setPackageId("")
      setDate("")
      setTime("")
      setDuration(60)
      setIsTrial(false)
      setTopic("")
      setMeetingLink("")
      setError("")
      setSuccess(false)
      setPendingPayment(false)
      setBookingOrderRef("")
    }
  }, [open, preselectedStudentId])

  // Filter teachers by selected subject
  const filteredTeachers = subjectId
    ? teachers.filter((t) => t.subjects.some((s) => s.id === subjectId))
    : teachers

  // Filter subjects — union of all teacher subjects
  const allSubjects = Array.from(
    new Map(teachers.flatMap((t) => t.subjects).map((s) => [s.id, s])).values()
  )

  // Filter packages by student + teacher + subject
  const filteredPackages = packages.filter(
    (p) =>
      (!studentId || p.label.includes("—")) && // packages are already scoped
      (!teacherId || p.teacherId === teacherId) &&
      (!subjectId || p.subjectId === subjectId)
  )

  // Auto-fill from package selection
  useEffect(() => {
    if (packageId) {
      const pkg = packages.find((p) => p.id === packageId)
      if (pkg) {
        setTeacherId(pkg.teacherId)
        setSubjectId(pkg.subjectId)
      }
    }
  }, [packageId, packages])

  const handleSubmit = async () => {
    setError("")

    if (!studentId) return setError("Please select a student.")
    if (!teacherId) return setError("Please select a teacher.")
    if (!subjectId) return setError("Please select a subject.")
    if (!date || !time) return setError("Please select date and time.")

    const scheduledAt = new Date(`${date}T${time}:00Z`).toISOString()

    setLoading(true)
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          teacherId,
          subjectId,
          packageId: packageId || null,
          slots: [scheduledAt],
          duration,
          isTrial,
          topicCovered: topic || null,
          meetingLink: meetingLink || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to book class")
        return
      }

      // Check if booking is pending payment
      if (data.pendingPayment) {
        setPendingPayment(true)
        setBookingOrderRef(data.orderRef || "")
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, pendingPayment ? 3000 : 1500)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Book a Class</h2>
              <p className="text-xs text-gray-500">Schedule a new session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          pendingPayment ? (
            <div className="p-10 text-center space-y-3">
              <Clock className="w-12 h-12 text-amber-500 mx-auto" />
              <p className="text-lg font-semibold text-[#1E293B]">Class Reserved!</p>
              {bookingOrderRef && (
                <p className="text-xs font-medium text-gray-500">
                  Ref: <span className="font-bold text-[#1E293B]">{bookingOrderRef}</span>
                </p>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 text-left">
                <p className="font-semibold mb-1">What happens next?</p>
                <p>Your coordinator will contact you with a payment link. The class will be confirmed once payment is received and verified.</p>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center">
              <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto" />
              <p className="text-lg font-semibold text-[#1E293B] mt-3">Class Booked!</p>
              <p className="text-sm text-gray-500 mt-1">The class has been scheduled successfully.</p>
            </div>
          )
        ) : (
          <div className="p-5 space-y-4">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Student */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select
                value={subjectId}
                onChange={(e) => { setSubjectId(e.target.value); setTeacherId(""); setPackageId(""); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              >
                <option value="">Select subject…</option>
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              <select
                value={teacherId}
                onChange={(e) => { setTeacherId(e.target.value); setPackageId(""); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              >
                <option value="">Select teacher…</option>
                {filteredTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Package (optional) */}
            {studentId && teacherId && subjectId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Package <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
                >
                  <option value="">No package (standalone class)</option>
                  {filteredPackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.remaining} classes left
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (UTC) *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      duration === d
                        ? "border-[#0D9488] bg-[#0D9488]/10 text-[#0D9488]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Trial toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="w-4 h-4 text-[#0D9488] border-gray-300 rounded focus:ring-[#0D9488]"
              />
              <span className="text-sm text-gray-700">This is a trial class</span>
            </label>

            {/* Topic (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quadratic equations, Essay writing…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              />
            </div>

            {/* Meeting link (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Link <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Booking…</>
              ) : (
                <><CalendarPlus className="w-4 h-4" />Book Class</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
