"use client"

import React from "react"
import {
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
  Zap,
  Star,
  Calendar,
  MessageCircle,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Types ─── */
type ChapterItem = {
  name: string
  status: "done" | "in-progress" | "not-started"
}

type SubjectProgress = {
  id: string
  subject: string
  teacher: string
  teacherInitials: string
  coveragePct: number
  chapters: ChapterItem[]
  lastSession: string
  teacherComment: string
  barColor: string
}

type FeedbackItem = {
  id: string
  teacher: string
  teacherInitials: string
  subject: string
  date: string
  rating: number
  note: string
}

type Achievement = {
  id: string
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  bg: string
  iconColor: string
  textColor: string
}

/* ─── Data ─── */
const SUBJECTS: SubjectProgress[] = [
  {
    id: "math",
    subject: "Mathematics",
    teacher: "Dr. Ananya Sharma",
    teacherInitials: "AS",
    coveragePct: 60,
    barColor: "bg-[#0D9488]",
    lastSession: "Mar 10, 2026",
    teacherComment:
      "Alex is making excellent progress with polynomials. Showing strong analytical thinking. Would benefit from extra practice on graphing.",
    chapters: [
      { name: "Linear Equations", status: "done" },
      { name: "Quadratic Equations", status: "done" },
      { name: "Polynomials", status: "done" },
      { name: "Factoring", status: "done" },
      { name: "Systems of Equations", status: "done" },
      { name: "Chapter 5: Polynomials (Advanced)", status: "in-progress" },
      { name: "Exponential Functions", status: "in-progress" },
      { name: "Logarithms", status: "not-started" },
      { name: "Trigonometry Basics", status: "not-started" },
      { name: "AP Calculus Intro", status: "not-started" },
    ],
  },
  {
    id: "physics",
    subject: "Physics / SAT Prep",
    teacher: "Prof. Vikram Rao",
    teacherInitials: "VR",
    coveragePct: 45,
    barColor: "bg-[#1E3A5F]",
    lastSession: "Mar 8, 2026",
    teacherComment:
      "Alex grasps concepts quickly. The force & motion unit went very well. Need to reinforce energy equations before the next session.",
    chapters: [
      { name: "Newton's Laws", status: "done" },
      { name: "Forces & Motion", status: "done" },
      { name: "Energy & Work", status: "done" },
      { name: "SAT Reading Strategies", status: "done" },
      { name: "Momentum & Collisions", status: "in-progress" },
      { name: "SAT Math Grid-Ins", status: "in-progress" },
      { name: "Waves & Sound", status: "not-started" },
      { name: "Electricity Basics", status: "not-started" },
      { name: "SAT Essay Writing", status: "not-started" },
    ],
  },
]

const FEEDBACK: FeedbackItem[] = [
  {
    id: "f1",
    teacher: "Dr. Ananya Sharma",
    teacherInitials: "AS",
    subject: "Mathematics",
    date: "Mar 10, 2026",
    rating: 5,
    note: "Alex demonstrated excellent problem-solving skills today. The quadratic equations topic was mastered quickly. Keep up the great work!",
  },
  {
    id: "f2",
    teacher: "Prof. Vikram Rao",
    teacherInitials: "VR",
    subject: "Physics",
    date: "Mar 8, 2026",
    rating: 4,
    note: "Good session overall. Alex is strong on theory but needs more practice with numerical problems. Assigned extra exercises for next class.",
  },
  {
    id: "f3",
    teacher: "Dr. Ananya Sharma",
    teacherInitials: "AS",
    subject: "Mathematics",
    date: "Mar 6, 2026",
    rating: 5,
    note: "Alex showed great improvement in factoring polynomials. The practice problems were completed accurately and ahead of schedule.",
  },
]

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "a1",
    label: "Perfect Attendance",
    desc: "No missed classes",
    icon: CheckCircle,
    bg: "bg-green-50",
    iconColor: "text-[#22C55E]",
    textColor: "text-green-700",
  },
  {
    id: "a2",
    label: "Fast Learner",
    desc: "Topics mastered quickly",
    icon: Zap,
    bg: "bg-amber-50",
    iconColor: "text-[#F59E0B]",
    textColor: "text-amber-700",
  },
  {
    id: "a3",
    label: "Consistent Student",
    desc: "8-day learning streak",
    icon: TrendingUp,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    textColor: "text-blue-700",
  },
  {
    id: "a4",
    label: "Top Rated",
    desc: "4.9 avg teacher rating",
    icon: Star,
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
    textColor: "text-purple-700",
  },
]

function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function MiniBar({ val, max, color }: { val: number; max: number; color: string }) {
  const pct = Math.round((val / max) * 100)
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{val}</span>
    </div>
  )
}

const STATUS_CONFIG = {
  done: { icon: CheckCircle, color: "text-[#22C55E]", label: "Completed" },
  "in-progress": { icon: Clock, color: "text-[#F59E0B]", label: "In Progress" },
  "not-started": { icon: BookOpen, color: "text-gray-300", label: "Not Started" },
}

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Progress &amp; Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Track Alex&apos;s learning journey and achievements</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Classes Completed"
          value="47"
          subtitle="Since Jan 2026"
          change="+12 this month"
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Avg Rating Given"
          value="4.9"
          subtitle="To tutors"
          change="Excellent"
          changeType="positive"
          icon={Star}
        />
        <KPICard
          title="Current Streak"
          value="8 days"
          subtitle="Consecutive learning"
          change="Keep it up!"
          changeType="positive"
          icon={Zap}
        />
        <KPICard
          title="Subjects Active"
          value="2"
          subtitle="Mathematics & Physics"
          change="On track"
          changeType="positive"
          icon={BookOpen}
        />
      </div>

      {/* Subject Progress */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Subject Progress</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {SUBJECTS.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              {/* Subject header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B]">{sub.subject}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-[9px] font-bold">
                      {sub.teacherInitials}
                    </div>
                    <span className="text-xs text-gray-500">{sub.teacher}</span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#1E293B]">{sub.coveragePct}%</span>
              </div>

              {/* Progress bar */}
              <div className="mb-1">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Topic Coverage</span>
                  <span>{sub.coveragePct}% complete</span>
                </div>
                <ProgressBar pct={sub.coveragePct} colorClass={sub.barColor} />
              </div>

              {/* Chapter list */}
              <div className="mt-4 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {sub.chapters.map((ch) => {
                  const cfg = STATUS_CONFIG[ch.status]
                  return (
                    <div key={ch.name} className="flex items-center gap-2">
                      <cfg.icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                      <span className={`text-xs ${ch.status === "not-started" ? "text-gray-400" : "text-gray-600"}`}>
                        {ch.name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Last session: {sub.lastSession}
                </p>
                <p className="text-xs text-gray-500 italic mt-1.5 leading-relaxed">&ldquo;{sub.teacherComment}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Feedback */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Feedback &amp; Notes from Teachers</h2>
        <div className="space-y-4">
          {FEEDBACK.map((fb) => (
            <div key={fb.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {fb.teacherInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-sm font-semibold text-[#1E293B]">{fb.teacher}</span>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{fb.subject}</span>
                    </div>
                    <span className="text-xs text-gray-400">{fb.date}</span>
                  </div>
                  <div className="mt-1.5">
                    <RatingStars rating={fb.rating} size="sm" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{fb.note}</p>
                  <button className="flex items-center gap-1 mt-2 text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80 border border-[#0D9488]/30 px-2.5 py-1 rounded-lg hover:bg-[#0D9488]/5 transition-colors">
                    <MessageCircle className="w-3 h-3" />
                    View Note
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Attendance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Attendance &amp; Punctuality</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-full border-4 border-[#0D9488] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-[#0D9488]">98%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1E293B]">Attendance Rate</p>
                <p className="text-xs text-gray-500 mt-0.5">47 out of 48 classes attended</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "On Time", val: 44, max: 48, color: "bg-[#22C55E]" },
                { label: "Late (< 5 min)", val: 3, max: 48, color: "bg-[#F59E0B]" },
                { label: "Absent", val: 1, max: 48, color: "bg-[#EF4444]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                  <MiniBar val={row.val} max={row.max} color={row.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Session Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Session Stats</h3>
            <div className="space-y-4">
              {[
                { label: "Avg Session Duration", val: "58 min", icon: Clock, color: "text-[#0D9488]" },
                { label: "Topics Completed", val: "12 topics", icon: CheckCircle, color: "text-[#22C55E]" },
                { label: "Homework Completion", val: "94%", icon: TrendingUp, color: "text-[#1E3A5F]" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`${a.bg} rounded-xl p-4 text-center border border-white`}>
              <div className="flex items-center justify-center mb-2">
                <a.icon className={`w-8 h-8 ${a.iconColor}`} />
              </div>
              <p className={`text-sm font-semibold ${a.textColor}`}>{a.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
