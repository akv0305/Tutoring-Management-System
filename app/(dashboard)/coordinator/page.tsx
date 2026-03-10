"use client"

import React from "react"
import {
  Users,
  Calendar,
  UserPlus,
  CreditCard,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Today's schedule data ─── */
const todayClasses = [
  { id: "1", time: "9:00 AM – 10:00 AM EST",    student: "Alex Smith",    teacher: "Dr. Ananya Sharma", subject: "Mathematics", status: "confirmed" as const, border: "border-l-green-500" },
  { id: "2", time: "10:30 AM – 11:30 AM EST",   student: "Maya Johnson",  teacher: "Prof. Vikram Rao",  subject: "Physics",     status: "confirmed" as const, border: "border-l-green-500" },
  { id: "3", time: "2:00 PM – 3:00 PM EST",     student: "Ryan Chen",     teacher: "Ms. Deepika Nair",  subject: "SAT Prep",    status: "scheduled" as const, border: "border-l-amber-400" },
  { id: "4", time: "4:00 PM – 5:00 PM EST",     student: "Priya Patel",   teacher: "Mr. Suresh Iyer",   subject: "Chemistry",   status: "scheduled" as const, border: "border-l-blue-500"  },
]

/* ─── Onboarding pipeline data ─── */
const newLeads = [
  { name: "Sophia Lee",   grade: "Grade 7", subjects: "Math, Coding",    note: "Registered: Mar 8" },
  { name: "Olivia Davis", grade: "Grade 5", subjects: "Reading, Math",   note: "Registered: Mar 9" },
]
const trialScheduled = [
  { name: "Aiden Brown", grade: "Grade 12", subjects: "ACT Prep", note: "Trial: Mar 12, 3PM" },
  { name: "Emma Wilson", grade: "Grade 9",  subjects: "Science",  note: "Trial: Mar 11, 4PM" },
]
const trialCompleted = [
  { name: "Noah Martinez", grade: "Grade 10", subjects: "Math", note: "Trial: Mar 7 ✓", rating: "Rating: 4.8★" },
]

/* ─── Pending payments data ─── */
const pendingPayments = [
  { student: "Maya Johnson",  pkg: "4 Classes – Physics",     amount: "$240.00", method: "Bank Transfer", date: "Mar 7" },
  { student: "Priya Patel",   pkg: "8 Classes – Chemistry",   amount: "$480.00", method: "Bank Transfer", date: "Mar 6" },
  { student: "Aiden Brown",   pkg: "4 Classes – ACT",         amount: "$260.00", method: "Bank Transfer", date: "Mar 4" },
]

/* ─── Activity feed data ─── */
const activities = [
  { dot: "bg-green-500", text: "Alex Smith completed Math class",         time: "2 hours ago" },
  { dot: "bg-blue-500",  text: "Trial scheduled for Aiden Brown",         time: "3 hours ago" },
  { dot: "bg-amber-500", text: "Payment pending from Maya Johnson",        time: "5 hours ago" },
  { dot: "bg-green-500", text: "Noah Martinez trial completed",            time: "Yesterday"   },
  { dot: "bg-blue-500",  text: "New student Sophia Lee registered",        time: "Yesterday"   },
  { dot: "bg-red-500",   text: "Emma Wilson rescheduled Science trial",    time: "2 days ago"  },
]

/* ─── Kanban column ─── */
function KanbanCol({
  title,
  headerClass,
  textClass,
  items,
  btnLabel,
}: {
  title: string
  headerClass: string
  textClass: string
  items: { name: string; grade: string; subjects: string; note: string; rating?: string }[]
  btnLabel: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`rounded-t-lg px-3 py-2 ${headerClass}`}>
        <span className={`text-xs font-semibold uppercase tracking-wide ${textClass}`}>
          {title} ({items.length})
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.name} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
            <p className="text-sm font-semibold text-[#1E293B]">{item.name}</p>
            <p className="text-xs text-gray-500">{item.grade}</p>
            <p className="text-xs text-[#0D9488] mt-0.5">{item.subjects}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
            {item.rating && (
              <p className="text-xs font-semibold text-amber-500 mt-0.5">{item.rating}</p>
            )}
            <button className="mt-2 w-full text-xs font-medium px-2 py-1.5 rounded-md border border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors">
              {btnLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function CoordinatorDashboard() {
  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Good Morning, Priya!</h2>
          <p className="text-white/80 text-sm mt-1">
            You have 5 new students to onboard and 3 payments to confirm today.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="px-4 py-2 rounded-lg bg-white text-[#1E3A5F] text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm">
            View Onboarding Queue
          </button>
          <button className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#1E293B] text-sm font-semibold hover:bg-amber-400 transition-colors shadow-sm">
            Confirm Payments
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard title="My Students"          value="42"  subtitle="3 new this week"       change="+7%"    changeType="positive" icon={Users}    />
        <KPICard title="Upcoming Classes"     value="23"  subtitle="Next 7 days"            change=""       changeType="neutral"  icon={Calendar} />
        <KPICard title="Pending Onboarding"   value="5"   subtitle="Awaiting contact"       change="urgent" changeType="negative" icon={UserPlus} />
        <KPICard title="Payments to Confirm"  value="3"   subtitle="$720 pending"           change=""       changeType="neutral"  icon={CreditCard} />
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT col-span-2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Card A — Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1E293B]">Today's Classes — March 10, 2026</h2>
              <span className="text-sm text-[#0D9488] font-medium cursor-pointer hover:underline">View Full Calendar →</span>
            </div>
            <div className="flex flex-col gap-3">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`flex items-center gap-4 rounded-lg border border-gray-100 border-l-4 ${cls.border} p-4 bg-gray-50/40 hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1E293B]">{cls.subject}</span>
                      <StatusBadge status={cls.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium text-[#1E293B]">{cls.student}</span>
                      {" · "}with{" "}
                      <span className="font-medium text-[#1E293B]">{cls.teacher}</span>
                    </p>
                    <p className="text-xs text-[#0D9488] font-medium mt-0.5">{cls.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card B — Onboarding Pipeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1E293B]">Student Onboarding Queue</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">5 pending</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KanbanCol
                title="New Leads"       headerClass="bg-amber-100" textClass="text-amber-700"
                items={newLeads}        btnLabel="Contact Family"
              />
              <KanbanCol
                title="Trial Scheduled" headerClass="bg-blue-100"  textClass="text-blue-700"
                items={trialScheduled}  btnLabel="View Details"
              />
              <KanbanCol
                title="Trial Completed" headerClass="bg-green-100" textClass="text-green-700"
                items={trialCompleted}  btnLabel="Convert to Package"
              />
            </div>
          </div>
        </div>

        {/* RIGHT col-span-1 */}
        <div className="flex flex-col gap-6">

          {/* Card C — Pending Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Confirm Payments</h2>
            <div className="flex flex-col gap-3">
              {pendingPayments.map((p) => (
                <div key={p.student} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">{p.student}</p>
                      <p className="text-xs text-gray-500 truncate">{p.pkg}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.method} · {p.date}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1E293B] flex-shrink-0">{p.amount}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" />Confirm
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" />Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card D — Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Activity Feed</h2>
            <div className="flex flex-col gap-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${a.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E293B] leading-snug">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
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
