"use client"

import React, { useState } from "react"
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
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Types ─── */
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
  isTrial?: boolean
}

type CompletedClass = {
  id: string
  date: string
  subject: string
  topic: string
  teacher: string
  duration: string
  rated: boolean
  rating?: number
  hasNotes: boolean
}

type CancelledClass = {
  id: string
  date: string
  subject: string
  teacher: string
  reason: string
}

/* ─── Data ─── */
const UPCOMING: UpcomingClass[] = [
  {
    id: "u1",
    dayLabel: "Tuesday",
    dateNum: 11,
    month: "Mar",
    time: "9:00 AM – 10:00 AM EST",
    duration: "60 min",
    teacher: "Dr. Ananya Sharma",
    teacherInitials: "AS",
    subject: "Mathematics — Chapter 5: Polynomials",
    status: "confirmed",
    canJoin: true,
  },
  {
    id: "u2",
    dayLabel: "Thursday",
    dateNum: 13,
    month: "Mar",
    time: "11:00 AM – 12:00 PM EST",
    duration: "60 min",
    teacher: "Prof. Vikram Rao",
    teacherInitials: "VR",
    subject: "Physics — Forces & Motion",
    status: "confirmed",
    canJoin: false,
  },
  {
    id: "u3",
    dayLabel: "Saturday",
    dateNum: 15,
    month: "Mar",
    time: "10:00 AM – 11:00 AM EST",
    duration: "60 min",
    teacher: "Dr. Ananya Sharma",
    teacherInitials: "AS",
    subject: "SAT Prep — Math Section Practice",
    status: "scheduled",
    canJoin: false,
    isTrial: true,
  },
]

const COMPLETED: CompletedClass[] = [
  { id: "c1", date: "Mar 10, 2026", subject: "Mathematics", topic: "Quadratic Equations", teacher: "Dr. Ananya Sharma", duration: "60 min", rated: true, rating: 5, hasNotes: true },
  { id: "c2", date: "Mar 8, 2026", subject: "Physics", topic: "Newton's Laws", teacher: "Prof. Vikram Rao", duration: "60 min", rated: true, rating: 4, hasNotes: true },
  { id: "c3", date: "Mar 6, 2026", subject: "Mathematics", topic: "Linear Equations", teacher: "Dr. Ananya Sharma", duration: "60 min", rated: false, hasNotes: false },
  { id: "c4", date: "Mar 4, 2026", subject: "SAT Prep", topic: "Evidence-Based Reading", teacher: "Prof. Vikram Rao", duration: "60 min", rated: true, rating: 5, hasNotes: true },
  { id: "c5", date: "Mar 1, 2026", subject: "Mathematics", topic: "Factoring Polynomials", teacher: "Dr. Ananya Sharma", duration: "60 min", rated: true, rating: 5, hasNotes: false },
  { id: "c6", date: "Feb 27, 2026", subject: "Physics", topic: "Energy & Work", teacher: "Prof. Vikram Rao", duration: "60 min", rated: false, hasNotes: true },
  { id: "c7", date: "Feb 24, 2026", subject: "Mathematics", topic: "Systems of Equations", teacher: "Dr. Ananya Sharma", duration: "60 min", rated: true, rating: 4, hasNotes: false },
  { id: "c8", date: "Feb 22, 2026", subject: "SAT Prep", topic: "Math Grid-In Problems", teacher: "Prof. Vikram Rao", duration: "60 min", rated: true, rating: 5, hasNotes: true },
]

const CANCELLED: CancelledClass[] = [
  { id: "x1", date: "Mar 4, 2026", subject: "SAT Prep", teacher: "Prof. Vikram Rao", reason: "Teacher unavailable — rescheduled by coordinator" },
  { id: "x2", date: "Feb 20, 2026", subject: "Mathematics", teacher: "Dr. Ananya Sharma", reason: "Parent requested cancellation" },
]

/* ─── Mini Calendar ─── */
const MARCH_2026 = {
  year: 2026,
  month: "March",
  startDay: 0, // Sunday
  days: 31,
  classDates: [11, 13, 15],
  today: 10,
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function MiniCalendar() {
  const { month, year, startDay, days, classDates, today } = MARCH_2026
  const cells: (number | null)[] = Array(startDay).fill(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-[#1E293B]">{month} {year}</h3>
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
          const isToday = d === today
          const isClass = classDates.includes(d)
          return (
            <div
              key={d}
              className={[
                "flex items-center justify-center w-8 h-8 rounded-full mx-auto text-xs font-medium cursor-default",
                isToday ? "bg-[#0D9488] text-white" : isClass ? "bg-[#F59E0B]/20 text-[#B45309] font-semibold" : "text-gray-600 hover:bg-gray-50",
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

/* ─── Page ─── */
type Tab = "upcoming" | "completed" | "cancelled"

export default function ClassesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming")

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "upcoming", label: "Upcoming", badge: 3 },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Classes</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track Alex&apos;s learning sessions</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {t.label}
            {t.badge && (
              <span
                className={[
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                  activeTab === t.key ? "bg-white/20 text-white" : "bg-[#0D9488]/10 text-[#0D9488]",
                ].join(" ")}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── UPCOMING ── */}
      {activeTab === "upcoming" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Upcoming Classes (3)</h2>
              <div className="space-y-4">
                {UPCOMING.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex gap-4 p-4 rounded-xl border border-gray-100 border-l-4 border-l-[#0D9488] bg-gray-50/40 hover:bg-gray-50 transition-colors"
                  >
                    {/* Date badge */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="bg-[#1E3A5F] text-white rounded-lg py-1.5 px-2">
                        <p className="text-xs font-medium uppercase">{cls.month}</p>
                        <p className="text-2xl font-bold leading-tight">{cls.dateNum}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{cls.dayLabel}</p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#1E293B]">{cls.subject}</h3>
                            {cls.isTrial && (
                              <span className="px-2 py-0.5 bg-[#F59E0B]/10 text-[#B45309] text-xs font-semibold rounded-full border border-[#F59E0B]/30">
                                TRIAL
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {cls.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {cls.duration}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={cls.status} />
                      </div>

                      {/* Teacher row */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-xs font-bold">
                          {cls.teacherInitials}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{cls.teacher}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {cls.canJoin ? (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-[#0D9488]/90 transition-colors">
                            <Video className="w-3 h-3" />
                            Join Class
                          </button>
                        ) : (
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F]/90 transition-colors">
                            <Eye className="w-3 h-3" />
                            View Details
                          </button>
                        )}
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                          <RotateCcw className="w-3 h-3" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini calendar */}
          <div>
            <MiniCalendar />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">This Month</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Scheduled", val: "3", color: "text-[#0D9488]" },
                  { label: "Completed", val: "8", color: "text-[#22C55E]" },
                  { label: "Cancelled", val: "2", color: "text-[#EF4444]" },
                  { label: "Remaining", val: "5", color: "text-[#F59E0B]" },
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

      {/* ── COMPLETED ── */}
      {activeTab === "completed" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1E293B]">Completed Classes</h2>
              <p className="text-xs text-gray-500 mt-0.5">8 sessions completed</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
              Export History
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {COMPLETED.map((cls) => (
              <div key={cls.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                {/* Status icon */}
                <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {cls.subject} — <span className="text-gray-500 font-normal">{cls.topic}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cls.teacher} · {cls.date} · {cls.duration}
                  </p>
                </div>

                {/* Status badge */}
                <StatusBadge status="completed" />

                {/* Rating */}
                <div className="w-40 flex items-center justify-end gap-2">
                  {cls.rated && cls.rating ? (
                    <RatingStars rating={cls.rating} size="sm" />
                  ) : (
                    <button className="flex items-center gap-1 text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80">
                      <Star className="w-3.5 h-3.5" />
                      Rate Class
                    </button>
                  )}
                </div>

                {/* Notes icon */}
                <button
                  className={[
                    "p-1.5 rounded-lg transition-colors",
                    cls.hasNotes ? "text-[#1E3A5F] hover:bg-[#1E3A5F]/10" : "text-gray-300 cursor-not-allowed",
                  ].join(" ")}
                  title={cls.hasNotes ? "View session notes" : "No notes available"}
                  disabled={!cls.hasNotes}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CANCELLED ── */}
      {activeTab === "cancelled" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#1E293B]">Cancelled Classes</h2>
            <p className="text-xs text-gray-500 mt-0.5">2 cancelled sessions</p>
          </div>
          <div className="divide-y divide-gray-50">
            {CANCELLED.map((cls) => (
              <div key={cls.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {cls.subject} — <span className="text-gray-500 font-normal">{cls.teacher}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{cls.date}</p>
                  <p className="text-xs text-[#F97316] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {cls.reason}
                  </p>
                </div>
                <StatusBadge status="cancelled" />
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-[#0D9488]/90 transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  Rebook
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
