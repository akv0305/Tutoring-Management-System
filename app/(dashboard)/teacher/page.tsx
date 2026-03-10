"use client"

import React from "react"
import {
  Calendar,
  BookOpen,
  Star,
  Wallet,
  Video,
  Clock,
  CalendarPlus,
  FileText,
  AlertCircle,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Today's classes ─── */
const todayClasses = [
  {
    id: "c1",
    time: "9:00 AM – 10:00 AM EST",
    studentName: "Alex Smith",
    initials: "AS",
    subject: "Mathematics — Grade 8",
    topic: "Chapter 12: Quadratic Equations",
    status: "confirmed",
    borderColor: "border-l-green-500",
    isTrial: false,
  },
  {
    id: "c2",
    time: "10:30 AM – 11:30 AM EST",
    studentName: "Ryan Chen",
    initials: "RC",
    subject: "Mathematics — Grade 6",
    topic: "Fractions & Decimals Review",
    status: "confirmed",
    borderColor: "border-l-green-500",
    isTrial: false,
  },
  {
    id: "c3",
    time: "2:00 PM – 3:00 PM EST",
    studentName: "Priya Patel",
    initials: "PP",
    subject: "AP Calculus — Grade 11",
    topic: "Integration by Parts",
    status: "scheduled",
    borderColor: "border-l-amber-400",
    isTrial: false,
  },
  {
    id: "c4",
    time: "4:30 PM – 5:30 PM EST",
    studentName: "Noah Martinez",
    initials: "NM",
    subject: "Mathematics — Grade 10",
    topic: "Trial Class — Assessment",
    status: "trial",
    borderColor: "border-l-blue-500",
    isTrial: true,
  },
]

/* ─── Upcoming week ─── */
const upcomingWeek = [
  { date: "Tue, Mar 11", time: "9:00 AM",  student: "Alex Smith",   subject: "Mathematics" },
  { date: "Tue, Mar 11", time: "11:00 AM", student: "Aiden Brown",  subject: "AP Calculus" },
  { date: "Wed, Mar 12", time: "9:00 AM",  student: "Alex Smith",   subject: "Mathematics" },
  { date: "Wed, Mar 12", time: "2:00 PM",  student: "Ryan Chen",    subject: "Mathematics" },
  { date: "Thu, Mar 13", time: "9:00 AM",  student: "Alex Smith",   subject: "Mathematics" },
  { date: "Thu, Mar 13", time: "10:30 AM", student: "Priya Patel",  subject: "AP Calculus" },
  { date: "Fri, Mar 14", time: "9:00 AM",  student: "Ryan Chen",    subject: "Mathematics" },
  { date: "Fri, Mar 14", time: "2:00 PM",  student: "Maya Johnson", subject: "SAT Prep" },
]

/* ─── Feedback ─── */
const feedbackItems = [
  { rating: 5, from: "Alex Smith's Parent",  text: "Dr. Ananya explains complex concepts so simply. My son loves math now!", date: "Mar 8, 2026" },
  { rating: 5, from: "Ryan Chen's Parent",   text: "Very patient and thorough. Ryan's grades have improved significantly.", date: "Mar 5, 2026" },
  { rating: 4, from: "Priya Patel's Parent", text: "Good session. Would appreciate more practice problems assigned.", date: "Mar 3, 2026" },
]

/* ─── Stat rows ─── */
const statsRows = [
  { label: "Total Classes Taught",       value: "156",           valueClass: "text-[#1E293B]" },
  { label: "Completion Rate",            value: "98.7%",         valueClass: "text-[#22C55E]" },
  { label: "Average Rating",             value: "4.9 / 5.0",     valueClass: "text-[#F59E0B]" },
  { label: "No-Shows",                   value: "0",             valueClass: "text-[#22C55E]" },
  { label: "Cancellations This Month",   value: "1 of 3 allowed",valueClass: "text-[#1E293B]" },
]

/* ─── Page ─── */
export default function TeacherDashboard() {
  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0D9488 0%, #1E3A5F 100%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back, Dr. Ananya!</h2>
          <p className="text-white/80 text-sm mt-1">
            You have 4 classes scheduled today. Your next class starts in 45 minutes.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] text-[#1E293B] font-semibold text-sm hover:bg-amber-400 transition-colors shadow-sm flex-shrink-0">
          <Video className="w-4 h-4" />
          Join Next Class
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Today's Classes"
          value="4"
          subtitle="Next: 9:00 AM EST"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="This Week"
          value="18"
          subtitle="3 remaining today"
          change=""
          changeType="neutral"
          icon={BookOpen}
        />
        <KPICard
          title="My Rating"
          value="4.9"
          subtitle="Based on 156 reviews"
          change="★"
          changeType="positive"
          icon={Star}
        />
        <KPICard
          title="This Month Earnings"
          value="$1,240"
          subtitle="32 classes completed"
          change=""
          changeType="neutral"
          icon={Wallet}
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — col-span-2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Card A — Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">Monday, March 10, 2026</h2>
              <a href="/teacher/schedule" className="text-sm text-[#0D9488] font-medium hover:underline">
                View Full Schedule →
              </a>
            </div>
            <div className="flex flex-col gap-4">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`rounded-lg border border-gray-100 border-l-4 ${cls.borderColor} p-4 hover:bg-gray-50/50 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Time */}
                      <p className="text-sm font-bold text-[#1E293B]">{cls.time}</p>
                      {/* Student row */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{cls.initials}</span>
                        </div>
                        <span className="text-sm font-medium text-[#1E293B]">{cls.studentName}</span>
                        {cls.isTrial && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                            TRIAL
                          </span>
                        )}
                      </div>
                      {/* Subject & topic */}
                      <p className="text-xs text-[#0D9488] font-medium mt-1">{cls.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{cls.topic}</p>
                    </div>
                    {/* Right: badge + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={cls.status} size="sm" />
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors">
                          <Video className="w-3 h-3" />
                          Join Class
                        </button>
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                          <FileText className="w-3 h-3" />
                          View Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card B — Upcoming This Week */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Rest of the Week</h2>
            <div className="flex flex-col gap-2">
              {upcomingWeek.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors"
                >
                  <span className="w-24 flex-shrink-0 text-xs text-gray-400 font-medium">{row.date}</span>
                  <span className="w-20 flex-shrink-0 text-xs font-semibold text-[#1E293B]">{row.time}</span>
                  <span className="flex-1 text-sm text-[#1E293B]">{row.student}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                    {row.subject}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — col-span-1 */}
        <div className="flex flex-col gap-6">

          {/* Card C — Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: Clock,       label: "Update Availability" },
                { icon: CalendarPlus,label: "Open New Slots" },
                { icon: FileText,    label: "Add Class Notes" },
                { icon: AlertCircle, label: "Report an Issue" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-full inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#0D9488]" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Card D — Recent Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Student Feedback</h2>
            <div className="flex flex-col gap-4">
              {feedbackItems.map((fb, i) => (
                <div key={i} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#1E293B]">{fb.from}</span>
                    <span className="text-[10px] text-gray-400">{fb.date}</span>
                  </div>
                  <RatingStars rating={fb.rating} size="sm" />
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{fb.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card E — My Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Performance</h2>
            <div className="flex flex-col gap-3">
              {statsRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`text-sm font-bold ${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Teacher cancellation limit: 3 per month. No-shows result in −0.5 rating penalty.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
