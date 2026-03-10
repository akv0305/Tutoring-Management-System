"use client"

import React from "react"
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Star,
  Video,
  Search,
  CalendarPlus,
  Package,
  CreditCard,
  Gift,
  Plus,
  MessageCircle,
  Phone,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Upcoming classes data ─── */
const UPCOMING = [
  {
    id: "uc1",
    day: "Monday, Mar 10",
    time: "9:00 AM – 10:00 AM EST",
    teacherName: "Dr. Ananya Sharma",
    initials: "AS",
    subject: "Mathematics — Quadratic Equations",
    status: "confirmed",
    borderColor: "border-l-teal-500",
    canJoin: true,
  },
  {
    id: "uc2",
    day: "Wednesday, Mar 12",
    time: "9:00 AM – 10:00 AM EST",
    teacherName: "Dr. Ananya Sharma",
    initials: "AS",
    subject: "Mathematics — Graphing Quadratics",
    status: "scheduled",
    borderColor: "border-l-teal-500",
    canJoin: false,
  },
  {
    id: "uc3",
    day: "Friday, Mar 14",
    time: "9:00 AM – 10:00 AM EST",
    teacherName: "Dr. Ananya Sharma",
    initials: "AS",
    subject: "Mathematics — Word Problems",
    status: "scheduled",
    borderColor: "border-l-teal-500",
    canJoin: false,
  },
]

/* ─── Packages data ─── */
const PACKAGES = [
  {
    id: "pk1",
    name: "8 Classes — Mathematics",
    teacher: "Dr. Ananya Sharma",
    total: 8,
    used: 5,
    remaining: 3,
    expires: "Apr 10, 2026",
    status: "active",
    barColor: "bg-[#0D9488]",
    isLow: false,
  },
  {
    id: "pk2",
    name: "4 Classes — SAT Prep",
    teacher: "Prof. Vikram Rao",
    total: 4,
    used: 2,
    remaining: 2,
    expires: "Mar 25, 2026",
    status: "active",
    barColor: "bg-[#F59E0B]",
    isLow: true,
  },
]

/* ─── Feedback data ─── */
const FEEDBACK = [
  { date: "Mar 8 — Mathematics", rating: 5, text: "Great session on completing the square!" },
  { date: "Mar 5 — Mathematics", rating: 5, text: "Very clear explanations, Alex understood everything." },
]

/* ─── Page ─── */
export default function ParentDashboard() {
  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome, Jane!</h2>
          <p className="text-white/80 text-sm mt-1">
            Alex has 3 upcoming classes this week. Next class starts in 2 hours.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <button className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#1E293B] text-sm font-semibold hover:bg-amber-400 transition-colors shadow-sm">
            Book a Class
          </button>
          <button className="px-4 py-2 rounded-lg border border-white text-white text-sm font-semibold hover:bg-white/10 transition-colors">
            Browse Teachers
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Classes Remaining"
          value="5"
          subtitle="Math package (8 total)"
          change=""
          changeType="neutral"
          icon={BookOpen}
        />
        <KPICard
          title="Upcoming Classes"
          value="3"
          subtitle="This week"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Completed Classes"
          value="47"
          subtitle="Since Jan 2026"
          change="+12 this month"
          changeType="positive"
          icon={CheckCircle}
        />
        <KPICard
          title="Average Rating"
          value="4.9"
          subtitle="Given to tutors"
          change=""
          changeType="neutral"
          icon={Star}
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT col-span-2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Card A — Upcoming Classes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">This Week&apos;s Schedule</h2>
              <a href="/parent/classes" className="text-sm text-[#0D9488] font-medium hover:underline">
                View All Classes →
              </a>
            </div>
            <div className="flex flex-col gap-4">
              {UPCOMING.map((cls) => (
                <div
                  key={cls.id}
                  className={`rounded-lg border border-gray-100 border-l-4 ${cls.borderColor} p-4 hover:bg-gray-50/40 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Date/Time */}
                      <p className="text-xs text-gray-400 font-medium">{cls.day}</p>
                      <p className="text-sm font-bold text-[#1E293B] mt-0.5">{cls.time}</p>
                      {/* Teacher */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{cls.initials}</span>
                        </div>
                        <span className="text-sm text-gray-600">{cls.teacherName}</span>
                      </div>
                      {/* Subject */}
                      <p className="text-xs text-[#0D9488] font-medium mt-1">{cls.subject}</p>
                    </div>
                    {/* Right: badge + action */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={cls.status} size="sm" />
                      {cls.canJoin ? (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors">
                          <Video className="w-3 h-3" />
                          Join Class
                        </button>
                      ) : (
                        <button className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card B — Active Packages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">My Packages</h2>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                Buy New Package
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {PACKAGES.map((pkg) => {
                const pct = Math.round(((pkg.total - pkg.remaining) / pkg.total) * 100)
                return (
                  <div key={pkg.id} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/40 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1E293B]">{pkg.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{pkg.teacher}</p>
                        {/* Progress bar */}
                        <div className="mt-3 mb-1">
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pkg.barColor} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{pkg.used} used • {pkg.remaining} remaining</p>
                        <p className="text-xs text-gray-400 mt-0.5">Expires: {pkg.expires}</p>
                        {pkg.isLow && (
                          <p className="text-xs text-[#F59E0B] font-medium mt-1">
                            ⚠ Low balance — consider renewing
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={pkg.status} size="sm" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT col-span-1 */}
        <div className="flex flex-col gap-6">

          {/* Card C — Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: Search,      label: "Browse Teachers" },
                { icon: CalendarPlus,label: "Schedule a Class" },
                { icon: Package,     label: "Buy Package" },
                { icon: CreditCard,  label: "Make Payment" },
                { icon: Gift,        label: "Refer a Friend" },
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

          {/* Card D — My Coordinator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-3">Your Education Coordinator</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg font-bold">PM</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1E293B]">Priya Menon</p>
                <p className="text-xs text-gray-500 truncate">priya@expertguru.net</p>
                <p className="text-xs text-gray-500">+1 (800) 555-0142</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#0D9488] text-[#0D9488] text-xs font-medium hover:bg-teal-50 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                Send Message
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                Schedule Call
              </button>
            </div>
          </div>

          {/* Card E — Recent Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-3">Feedback Given</h2>
            <div className="flex flex-col gap-3">
              {FEEDBACK.map((fb, i) => (
                <div key={i} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 font-medium mb-1">{fb.date}</p>
                  <RatingStars rating={fb.rating} size="sm" />
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{fb.text}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 text-sm text-[#0D9488] font-medium hover:underline">
              Give Feedback →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
