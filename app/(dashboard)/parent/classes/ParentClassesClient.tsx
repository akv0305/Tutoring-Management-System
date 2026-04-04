"use client"

import React, { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Video,
  RotateCcw,
  CheckCircle,
  Eye,
  Star,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle,
  ExternalLink,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"
import { BookClassModal } from "@/components/modals/BookClassModal"
import { RescheduleModal } from "@/components/modals/RescheduleModal"
import { CancelClassModal } from "@/components/modals/CancelClassModal"
import { RateClassModal } from "@/components/modals/RateClassModal"
import { ClassDetailsModal } from "@/components/modals/ClassDetailsModal"

type UpcomingClass = {
  id: string
  dayLabel: string
  dateNum: number
  month: string
  time: string
  duration: string
  teacher: string
  teacherInitials: string
  subject: string
  status: string
  canJoin: boolean
  isTrial: boolean
  teacherId: string
  meetingLink: string | null
}

type CompletedClass = {
  id: string
  date: string
  subject: string
  topic: string
  teacher: string
  duration: string
  rated: boolean
  rating: number | null
  hasNotes: boolean
}

type CancelledClass = {
  id: string
  date: string
  subject: string
  teacher: string
  reason: string
}

type MonthStats = { scheduled: number; completed: number; cancelled: number }

type CalendarData = {
  year: number
  month: string
  startDay: number
  days: number
  classDates: number[]
  today: number
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function MiniCalendar({ data }: { data: CalendarData }) {
  const cells: (number | null)[] = Array(data.startDay).fill(null)
  for (let d = 1; d <= data.days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-[#1E293B]">
          {data.month} {data.year}
        </h3>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const isToday = d === data.today
          const isClass = data.classDates.includes(d)
          return (
            <div
              key={d}
              className={[
                "flex items-center justify-center w-8 h-8 rounded-full mx-auto text-xs font-medium cursor-default",
                isToday
                  ? "bg-[#0D9488] text-white"
                  : isClass
                  ? "bg-[#F59E0B]/20 text-[#B45309] font-semibold"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {d}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#0D9488]" />
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40" />
          <span className="text-xs text-gray-500">Scheduled</span>
        </div>
      </div>
    </div>
  )
}

type Tab = "upcoming" | "completed" | "cancelled"

export function ParentClassesClient({
  childName,
  upcoming,
  completed,
  cancelled,
  monthStats,
  calendarData,
}: {
  childName: string
  upcoming: UpcomingClass[]
  completed: CompletedClass[]
  cancelled: CancelledClass[]
  monthStats: MonthStats
  calendarData: CalendarData
}) {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming")

  // Book modal
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  useEffect(() => {
    if (showBookModal && !bookingData) {
      fetch("/api/classes/booking-data").then((r) => r.json()).then((d) => setBookingData(d)).catch(() => {})
    }
  }, [showBookModal, bookingData])

  // Reschedule modal
  const [rescheduleClass, setRescheduleClass] = useState<UpcomingClass | null>(null)
  const [teacherSlots, setTeacherSlots] = useState<any>(null)
  useEffect(() => {
    if (rescheduleClass) {
      fetch(`/api/classes/teacher-slots?teacherId=${rescheduleClass.teacherId}`)
        .then((r) => r.json()).then((d) => setTeacherSlots(d)).catch(() => {})
    } else {
      setTeacherSlots(null)
    }
  }, [rescheduleClass])

  // Cancel modal
  const [cancelClass, setCancelClass] = useState<UpcomingClass | null>(null)

  // Rate modal
  const [rateClass, setRateClass] = useState<CompletedClass | null>(null)

  // Details modal
  const [detailsClass, setDetailsClass] = useState<UpcomingClass | null>(null)

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "upcoming", label: "Upcoming", badge: upcoming.length || undefined },
    { key: "completed", label: "Completed", badge: completed.length || undefined },
    { key: "cancelled", label: "Cancelled", badge: cancelled.length || undefined },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track {childName}&apos;s learning sessions
          </p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />Book a Class
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-[#1E3A5F] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {t.label}
            {t.badge && (
              <span className={[
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                activeTab === t.key ? "bg-white/20 text-white" : "bg-[#0D9488]/10 text-[#0D9488]",
              ].join(" ")}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* UPCOMING */}
      {activeTab === "upcoming" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-4">
                Upcoming Classes ({upcoming.length})
              </h2>
              <div className="space-y-4">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No upcoming classes scheduled.</p>
                ) : (
                  upcoming.map((cls) => {
                    const isPending = cls.status === "pending_payment"

                    return (
                      <div
                        key={cls.id}
                        className={[
                          "flex gap-4 p-4 rounded-xl border border-gray-100 border-l-4 hover:bg-gray-50 transition-colors",
                          isPending
                            ? "border-l-amber-400 bg-amber-50/30"
                            : "border-l-[#0D9488] bg-gray-50/40",
                        ].join(" ")}
                      >
                        <div className="flex-shrink-0 w-14 text-center">
                          <div className="bg-[#1E3A5F] text-white rounded-lg py-1.5 px-2">
                            <p className="text-xs font-medium uppercase">{cls.month}</p>
                            <p className="text-2xl font-bold leading-tight">{cls.dateNum}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{cls.dayLabel}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-[#1E293B]">{cls.subject}</h3>
                                {cls.isTrial && (
                                  <span className="px-2 py-0.5 bg-[#F59E0B]/10 text-[#B45309] text-xs font-semibold rounded-full border border-[#F59E0B]/30">TRIAL</span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-300">
                                    <Clock className="w-3 h-3" />Payment Pending
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cls.duration}</span>
                              </div>
                            </div>
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full border border-amber-200">
                                <Clock className="w-3 h-3" />Awaiting Payment
                              </span>
                            ) : (
                              <StatusBadge status={cls.status} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-xs font-bold">{cls.teacherInitials}</div>
                            <span className="text-xs text-gray-600 font-medium">{cls.teacher}</span>
                          </div>
                          {isPending ? (
                            <div className="mt-3">
                              <p className="text-xs text-amber-600">
                                Your coordinator will contact you with a payment link. Class will be confirmed once payment is verified.
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {cls.canJoin && cls.meetingLink ? (
                                <button
                                  onClick={() => window.open(cls.meetingLink!, "_blank", "noopener,noreferrer")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-[#0D9488]/90 transition-colors"
                                >
                                  <Video className="w-3 h-3" />Join Class
                                </button>
                              ) : null}
                              <button
                                onClick={() => setDetailsClass(cls)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F]/90 transition-colors"
                              >
                                <Eye className="w-3 h-3" />View Details
                              </button>
                              <button
                                onClick={() => setRescheduleClass(cls)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />Reschedule
                              </button>
                              <button
                                onClick={() => setCancelClass(cls)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="w-3 h-3" />Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          <div>
            <MiniCalendar data={calendarData} />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">This Month</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Scheduled", val: String(monthStats.scheduled), color: "text-[#0D9488]" },
                  { label: "Completed", val: String(monthStats.completed), color: "text-[#22C55E]" },
                  { label: "Cancelled", val: String(monthStats.cancelled), color: "text-[#EF4444]" },
                  { label: "Remaining", val: String(monthStats.scheduled), color: "text-[#F59E0B]" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED */}
      {activeTab === "completed" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1E293B]">Completed Classes</h2>
              <p className="text-xs text-gray-500 mt-0.5">{completed.length} sessions completed</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {completed.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No completed classes yet.</p>
            ) : (
              completed.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B]">
                      {cls.subject}  <span className="text-gray-500 font-normal">{cls.topic}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cls.teacher}  {cls.date}  {cls.duration}
                    </p>
                  </div>
                  <StatusBadge status="completed" />
                  <div className="w-40 flex items-center justify-end gap-2">
                    {cls.rated && cls.rating ? (
                      <RatingStars rating={cls.rating} size="sm" />
                    ) : (
                      <button
                        onClick={() => setRateClass(cls)}
                        className="flex items-center gap-1 text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80"
                      >
                        <Star className="w-3.5 h-3.5" />Rate Class
                      </button>
                    )}
                  </div>
                  <button
                    className={[
                      "p-1.5 rounded-lg transition-colors",
                      cls.hasNotes ? "text-[#1E3A5F] hover:bg-[#1E3A5F]/10" : "text-gray-300 cursor-not-allowed",
                    ].join(" ")}
                    title={cls.hasNotes ? "View session notes" : "No session notes available"}
                    disabled={!cls.hasNotes}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CANCELLED */}
      {activeTab === "cancelled" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#1E293B]">Cancelled Classes</h2>
            <p className="text-xs text-gray-500 mt-0.5">{cancelled.length} cancelled sessions</p>
          </div>
          <div className="divide-y divide-gray-50">
            {cancelled.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No cancelled classes.</p>
            ) : (
              cancelled.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B]">
                      {cls.subject}  <span className="text-gray-500 font-normal">{cls.teacher}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{cls.date}</p>
                    <p className="text-xs text-[#F97316] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{cls.reason}
                    </p>
                  </div>
                  <StatusBadge status="cancelled" />
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-[#0D9488]/90 transition-colors">
                    <RotateCcw className="w-3 h-3" />Rebook
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/*  MODALS  */}

      {/* Book Class Modal */}
      {bookingData && (
        <BookClassModal
          open={showBookModal}
          onClose={() => setShowBookModal(false)}
          onSuccess={() => window.location.reload()}
          role="PARENT"
          students={bookingData.students}
          teachers={bookingData.teachers}
          packages={bookingData.packages}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleClass && teacherSlots && (
        <RescheduleModal
          open={!!rescheduleClass}
          onClose={() => setRescheduleClass(null)}
          onSuccess={() => window.location.reload()}
          classId={rescheduleClass.id}
          currentDate={`${rescheduleClass.month} ${rescheduleClass.dateNum}`}
          currentTime={rescheduleClass.time}
          teacherName={rescheduleClass.teacher}
          subject={rescheduleClass.subject}
          teacherAvailability={teacherSlots.availability}
          teacherBookedSlots={teacherSlots.bookedSlots}
          teacherBlockedDates={teacherSlots.blockedDates}
        />
      )}

      {/* Cancel Modal */}
      {cancelClass && (
        <CancelClassModal
          open={!!cancelClass}
          onClose={() => setCancelClass(null)}
          onSuccess={() => window.location.reload()}
          classId={cancelClass.id}
          subject={cancelClass.subject}
          teacherName={cancelClass.teacher}
          scheduledDate={`${cancelClass.month} ${cancelClass.dateNum}`}
          scheduledTime={cancelClass.time}
          cancelledBy="student"
        />
      )}

      {/* Class Details Modal */}
      {detailsClass && (
        <ClassDetailsModal
          open={!!detailsClass}
          onClose={() => setDetailsClass(null)}
          cls={{
            id: detailsClass.id,
            subject: detailsClass.subject,
            teacher: detailsClass.teacher,
            teacherInitials: detailsClass.teacherInitials,
            date: `${detailsClass.dayLabel}, ${detailsClass.month} ${detailsClass.dateNum}`,
            time: detailsClass.time,
            duration: detailsClass.duration,
            status: detailsClass.status,
            isTrial: detailsClass.isTrial,
            meetingLink: detailsClass.meetingLink,
          }}
        />
      )}

      {/* Rate Modal */}
      {rateClass && (
        <RateClassModal
          open={!!rateClass}
          onClose={() => setRateClass(null)}
          onSuccess={() => window.location.reload()}
          classId={rateClass.id}
          subject={rateClass.subject}
          teacherName={rateClass.teacher}
          classDate={rateClass.date}
        />
      )}
    </div>
  )
}
