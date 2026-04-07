"use client"

import React from "react"
import {
  Users,
  Calendar,
  UserPlus,
  CreditCard,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import Link from "next/link"

type PipelineItem = {
  name: string
  grade: string
  subjects: string
  note: string
  rating?: string
}

type PendingPayment = {
  student: string
  pkg: string
  amount: string
  method: string
  date: string
}

type DashboardData = {
  coordinatorFirstName: string
  totalStudents: number
  upcomingCount: number
  pendingOnboarding: number
  pendingPayments: PendingPayment[]
  pendingPaymentTotal: number
  todayClasses: {
    id: string
    student: string
    teacher: string
    subject: string
    time: string
    status: string
  }[]
  newLeads: PipelineItem[]
  trialScheduled: PipelineItem[]
  trialCompleted: PipelineItem[]
}

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
  items: PipelineItem[]
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
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">None</p>
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>
    </div>
  )
}

export function CoordinatorDashboardClient({ data }: { data: DashboardData }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good Morning, {data.coordinatorFirstName}!
          </h2>
          <p className="text-white/80 text-sm mt-1">
            You have {data.pendingOnboarding} students to onboard and{" "}
            {data.pendingPayments.length} payments to confirm today.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/coordinator/onboarding" className="px-4 py-2 rounded-lg bg-white text-[#1E3A5F] text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm">
          View Onboarding Queue
        </Link>
        <Link href="/coordinator/payments" className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#1E293B] text-sm font-semibold hover:bg-amber-400 transition-colors shadow-sm">
          Confirm Payments
        </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="My Students"
          value={String(data.totalStudents)}
          subtitle="Assigned to you"
          change=""
          changeType="neutral"
          icon={Users}
        />
        <KPICard
          title="Upcoming Classes"
          value={String(data.upcomingCount)}
          subtitle="Next 7 days"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Pending Onboarding"
          value={String(data.pendingOnboarding)}
          subtitle="Awaiting action"
          change={data.pendingOnboarding > 0 ? "urgent" : ""}
          changeType={data.pendingOnboarding > 0 ? "negative" : "neutral"}
          icon={UserPlus}
        />
        <KPICard
          title="Payments to Confirm"
          value={String(data.pendingPayments.length)}
          subtitle={`$${data.pendingPaymentTotal} pending`}
          change=""
          changeType="neutral"
          icon={CreditCard}
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT col-span-2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1E293B]">
                Today&apos;s Classes — {today}
              </h2>
              <Link href="/coordinator/schedule" className="text-sm text-[#0D9488] font-medium hover:underline">
                View Full Calendar →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {data.todayClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No classes scheduled for today.
                </p>
              ) : (
                data.todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-4 rounded-lg border border-gray-100 border-l-4 ${
                      cls.status === "confirmed"
                        ? "border-l-green-500"
                        : "border-l-amber-400"
                    } p-4 bg-gray-50/40 hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#1E293B]">
                          {cls.subject}
                        </span>
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
                ))
              )}
            </div>
          </div>

          {/* Onboarding Pipeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1E293B]">
                Student Onboarding Queue
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {data.pendingOnboarding} pending
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KanbanCol
                title="New Leads"
                headerClass="bg-amber-100"
                textClass="text-amber-700"
                items={data.newLeads}
                btnLabel="Contact Family"
              />
              <KanbanCol
                title="Trial Scheduled"
                headerClass="bg-blue-100"
                textClass="text-blue-700"
                items={data.trialScheduled}
                btnLabel="View Details"
              />
              <KanbanCol
                title="Trial Completed"
                headerClass="bg-green-100"
                textClass="text-green-700"
                items={data.trialCompleted}
                btnLabel="Convert to Package"
              />
            </div>
          </div>
        </div>

        {/* RIGHT col-span-1 */}
        <div className="flex flex-col gap-6">
          {/* Pending Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">
              Confirm Payments
            </h2>
            <div className="flex flex-col gap-3">
              {data.pendingPayments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No pending payments.
                </p>
              ) : (
                data.pendingPayments.map((p) => (
                  <div
                    key={p.student + p.date}
                    className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">
                          {p.student}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{p.pkg}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.method} · {p.date}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#1E293B] flex-shrink-0">
                        {p.amount}
                      </p>
                    </div>
    
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
