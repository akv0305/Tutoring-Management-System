// app/(dashboard)/parent/progress/ProgressClient.tsx
"use client"

import React, { useState } from "react"
import {
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
  Star,
  Calendar,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { RatingStars } from "@/components/ui/RatingStars"

type SubjectProgress = {
  subjectName: string
  teacherName: string
  teacherInitials: string
  totalClasses: number
  completedClasses: number
  cancelledClasses: number
  noShowClasses: number
  avgRating: number | null
  ratingCount: number
  lastSessionDate: string | null
  lastSessionNotes: string | null
  lastSessionTopic: string | null
  recentFeedback: {
    date: string
    rating: number
    note: string
    teacher: string
    teacherInitials: string
  }[]
}

type StudentStats = {
  totalCompleted: number
  totalScheduled: number
  totalCancelled: number
  totalNoShow: number
  attendanceRate: number
  avgRatingGiven: string
  activeSubjects: number
  thisMonthCompleted: number
}

type StudentProgress = {
  studentId: string
  studentName: string
  grade: string
  subjects: SubjectProgress[]
  stats: StudentStats
}

function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-[#0D9488]",
  Physics: "bg-[#1E3A5F]",
  Chemistry: "bg-purple-500",
  English: "bg-amber-500",
  Science: "bg-emerald-500",
  "SAT Prep": "bg-orange-500",
  "ACT Prep": "bg-orange-500",
  "Computer Science": "bg-indigo-500",
}
const DEFAULT_BAR = "bg-[#0D9488]"

function SubjectCard({ sub }: { sub: SubjectProgress }) {
  const [expanded, setExpanded] = useState(false)
  const barColor = SUBJECT_COLORS[sub.subjectName] ?? DEFAULT_BAR

  // Completion rate for this subject
  const totalAttempted = sub.completedClasses + sub.cancelledClasses + sub.noShowClasses
  const completionPct =
    totalAttempted > 0 ? Math.round((sub.completedClasses / totalAttempted) * 100) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1E293B]">{sub.subjectName}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-[9px] font-bold">
              {sub.teacherInitials}
            </div>
            <span className="text-xs text-gray-500">{sub.teacherName}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#1E293B]">{sub.completedClasses}</span>
          <p className="text-xs text-gray-400">classes done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Completion Rate</span>
          <span>{completionPct}%</span>
        </div>
        <ProgressBar pct={completionPct} colorClass={barColor} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-sm font-bold text-green-600">{sub.completedClasses}</p>
          <p className="text-[10px] text-gray-500">Completed</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-sm font-bold text-red-500">{sub.cancelledClasses}</p>
          <p className="text-[10px] text-gray-500">Cancelled</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <p className="text-sm font-bold text-amber-600">{sub.noShowClasses}</p>
          <p className="text-[10px] text-gray-500">No Shows</p>
        </div>
      </div>

      {/* Rating */}
      {sub.avgRating !== null && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <RatingStars rating={Math.round(sub.avgRating)} size="sm" />
          <span className="text-xs text-gray-500">
            {sub.avgRating.toFixed(1)} avg ({sub.ratingCount} review{sub.ratingCount !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {/* Last session */}
      {sub.lastSessionDate && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last session: {sub.lastSessionDate}
          </p>
          {sub.lastSessionTopic && (
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">Topic:</span> {sub.lastSessionTopic}
            </p>
          )}
          {sub.lastSessionNotes && (
            <p className="text-xs text-gray-500 italic mt-1 leading-relaxed line-clamp-2">
              &ldquo;{sub.lastSessionNotes}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Recent feedback toggle */}
      {sub.recentFeedback.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide" : "Show"} Teacher Notes ({sub.recentFeedback.length})
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {sub.recentFeedback.map((fb, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{fb.date}</span>
                    {fb.rating > 0 && <RatingStars rating={fb.rating} size="sm" />}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{fb.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProgressClient({ students }: { students: StudentProgress[] }) {
  const [activeStudentIdx, setActiveStudentIdx] = useState(0)
  const hasMultipleStudents = students.length > 1

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Progress & Performance</h1>
          <p className="text-sm text-gray-500 mt-1">No students found.</p>
        </div>
      </div>
    )
  }

  const student = students[activeStudentIdx]
  const s = student.stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Progress & Performance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track {student.studentName}&apos;s learning journey
          </p>
        </div>

        {/* Student selector (if multiple children) */}
        {hasMultipleStudents && (
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5">
            {students.map((st, idx) => (
              <button
                key={st.studentId}
                onClick={() => setActiveStudentIdx(idx)}
                className={[
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeStudentIdx === idx
                    ? "bg-[#1E3A5F] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {st.studentName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Classes Completed"
          value={s.totalCompleted.toString()}
          subtitle={`${s.thisMonthCompleted} this month`}
          change=""
          changeType="neutral"
          icon={CheckCircle}
        />
        <KPICard
          title="Attendance Rate"
          value={`${s.attendanceRate}%`}
          subtitle={`${s.totalCompleted} attended / ${s.totalCompleted + s.totalCancelled + s.totalNoShow} total`}
          change={s.attendanceRate >= 90 ? "Excellent" : s.attendanceRate >= 75 ? "Good" : "Needs Improvement"}
          changeType={s.attendanceRate >= 90 ? "positive" : s.attendanceRate >= 75 ? "neutral" : "negative"}
          icon={TrendingUp}
        />
        <KPICard
          title="Avg Rating Given"
          value={s.avgRatingGiven}
          subtitle="To tutors"
          change=""
          changeType="neutral"
          icon={Star}
        />
        <KPICard
          title="Active Subjects"
          value={s.activeSubjects.toString()}
          subtitle={`${s.totalScheduled} upcoming`}
          change=""
          changeType="neutral"
          icon={BookOpen}
        />
      </div>

      {/* Subject Progress Cards */}
      {student.subjects.length > 0 ? (
        <div>
          <h2 className="text-base font-semibold text-[#1E293B] mb-3">Subject Progress</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {student.subjects.map((sub) => (
              <SubjectCard key={sub.subjectName} sub={sub} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No classes recorded yet for {student.studentName}.</p>
        </div>
      )}

      {/* Performance Metrics */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Attendance Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Attendance & Reliability</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-full border-4 border-[#0D9488] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-[#0D9488]">{s.attendanceRate}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Attendance Rate</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.totalCompleted} out of {s.totalCompleted + s.totalCancelled + s.totalNoShow} classes attended
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Completed", val: s.totalCompleted, color: "bg-[#22C55E]" },
                { label: "Cancelled", val: s.totalCancelled, color: "bg-[#F59E0B]" },
                { label: "No Shows", val: s.totalNoShow, color: "bg-[#EF4444]" },
                { label: "Upcoming", val: s.totalScheduled, color: "bg-blue-400" },
              ].map((row) => {
                const max = Math.max(s.totalCompleted, s.totalScheduled, s.totalCancelled, s.totalNoShow, 1)
                const pct = Math.round((row.val / max) * 100)
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">{row.val}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Session Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Session Summary</h3>
            <div className="space-y-4">
              {[
                {
                  label: "Total Classes Booked",
                  val: `${s.totalCompleted + s.totalScheduled + s.totalCancelled + s.totalNoShow}`,
                  icon: Calendar,
                  color: "text-[#1E3A5F]",
                },
                {
                  label: "Classes Completed",
                  val: s.totalCompleted.toString(),
                  icon: CheckCircle,
                  color: "text-[#22C55E]",
                },
                {
                  label: "Cancellations",
                  val: s.totalCancelled.toString(),
                  icon: XCircle,
                  color: "text-[#F59E0B]",
                },
                {
                  label: "No Shows",
                  val: s.totalNoShow.toString(),
                  icon: AlertCircle,
                  color: "text-[#EF4444]",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
