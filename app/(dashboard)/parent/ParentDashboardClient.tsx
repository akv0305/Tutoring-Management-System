"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
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
  X,
  AlertCircle,
  Loader2,
  Info,
  ArrowRight,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"
import Link from "next/link"
import { ClassDetailsModal } from "@/components/modals/ClassDetailsModal"

type UpcomingClass = {
  id: string
  studentName: string
  day: string
  time: string
  teacherName: string
  initials: string
  subject: string
  status: string
  canJoin: boolean
  meetingLink: string | null
}

type ActivePackage = {
  id: string
  name: string
  teacher: string
  total: number
  used: number
  remaining: number
  expires: string
  status: string
  barColor: string
  isLow: boolean
}

type Coordinator = {
  name: string
  initials: string
  email: string
  phone: string
}

type Feedback = {
  date: string
  rating: number
  text: string
}

type WalletTxn = {
  id: string
  amount: number
  type: string
  description: string
  date: string
}

type DashboardData = {
  parentFirstName: string
  childrenNames: string[]
  upcomingClasses: UpcomingClass[]
  completedCount: number
  totalRemaining: number
  avgRating: string
  activePackages: ActivePackage[]
  coordinator: Coordinator | null
  feedback: Feedback[]
  walletBalance: number
  recentWalletTransactions: WalletTxn[]
}

export function ParentDashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()
  const [detailsClass, setDetailsClass] = React.useState<UpcomingClass | null>(null)
  const childList = data.childrenNames.join(" & ")

  // Coordinator message modal state
  const [showCoordModal, setShowCoordModal] = useState(false)
  const [coordTitle, setCoordTitle] = useState("Message from Parent")
  const [coordMessage, setCoordMessage] = useState("")
  const [coordSending, setCoordSending] = useState(false)
  const [coordSuccess, setCoordSuccess] = useState("")
  const [coordError, setCoordError] = useState("")

  function openCoordModal(prefilledTitle: string) {
    setCoordTitle(prefilledTitle)
    setCoordMessage("")
    setCoordError("")
    setCoordSuccess("")
    setShowCoordModal(true)
  }

  async function handleSendCoordinatorMessage() {
    if (!coordMessage.trim()) {
      setCoordError("Please enter a message.")
      return
    }
    setCoordSending(true)
    setCoordError("")
    setCoordSuccess("")
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "coordinator",
          title: coordTitle,
          message: coordMessage.trim(),
        }),
      })
      const resData = await res.json()
      if (!res.ok) {
        setCoordError(resData.error || "Failed to send message.")
      } else {
        setCoordSuccess(`Message sent to ${resData.coordinatorName || "your coordinator"}.`)
        setCoordMessage("")
        setTimeout(() => {
          setShowCoordModal(false)
          setCoordSuccess("")
        }, 2000)
      }
    } catch {
      setCoordError("Network error. Please try again.")
    }
    setCoordSending(false)
  }

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome, {data.parentFirstName}!</h2>
          <p className="text-white/80 text-sm mt-1">
            {childList} {data.childrenNames.length === 1 ? "has" : "have"} {data.upcomingClasses.length} upcoming class{data.upcomingClasses.length !== 1 ? "es" : ""} scheduled.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <Link href="/parent/teachers" className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#1E293B] text-sm font-semibold hover:bg-amber-400 transition-colors shadow-sm">
            Book a Class
          </Link>
          <Link href="/parent/teachers" className="px-4 py-2 rounded-lg border border-white text-white text-sm font-semibold hover:bg-white/10 transition-colors">
            Browse Teachers
          </Link>
        </div>
      </div>

      {/* Booking Process Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
        <Info className="w-5 h-5 text-[#0D9488] flex-shrink-0" />
        <p className="text-sm text-[#1E293B]">
          <span className="font-semibold">How to book a class:</span>{" "}
          Browse Teachers <ArrowRight className="w-3 h-3 inline text-gray-400" /> Select a teacher <ArrowRight className="w-3 h-3 inline text-gray-400" /> View availability <ArrowRight className="w-3 h-3 inline text-gray-400" /> Pick time slots <ArrowRight className="w-3 h-3 inline text-gray-400" /> Confirm booking.{" "}
          <span className="text-gray-500">You can book trial classes, standalone sessions, or full packages.</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <KPICard
          title="Wallet Balance"
          value={`$${data.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={data.walletBalance > 0 ? "Available for bookings" : "No balance"}
          change=""
          changeType="neutral"
          icon={CreditCard}
        />
        <KPICard
          title="Classes Remaining"
          value={data.totalRemaining.toString()}
          subtitle="Across all packages"
          change=""
          changeType="neutral"
          icon={BookOpen}
        />
        <KPICard
          title="Upcoming Classes"
          value={data.upcomingClasses.length.toString()}
          subtitle="Scheduled"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Completed Classes"
          value={data.completedCount.toString()}
          subtitle="All time"
          change=""
          changeType="neutral"
          icon={CheckCircle}
        />
        <KPICard
          title="Average Rating"
          value={data.avgRating}
          subtitle="Given to tutors"
          change=""
          changeType="neutral"
          icon={Star}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT col-span-2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Upcoming Classes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">Upcoming Schedule</h2>
              <a href="/parent/classes" className="text-sm text-[#0D9488] font-medium hover:underline">
                View All Classes &rarr;
              </a>
            </div>
            <div className="flex flex-col gap-4">
              {data.upcomingClasses.length > 0 ? (
                data.upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-lg border border-gray-100 border-l-4 border-l-teal-500 p-4 hover:bg-gray-50/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-medium">{cls.day}</p>
                        <p className="text-sm font-bold text-[#1E293B] mt-0.5">{cls.time}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">{cls.initials}</span>
                          </div>
                          <span className="text-sm text-gray-600">{cls.teacherName}</span>
                        </div>
                        <p className="text-xs text-[#0D9488] font-medium mt-1">{cls.subject}</p>
                        {data.childrenNames.length > 1 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">Student: {cls.studentName}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <StatusBadge status={cls.status} size="sm" />
                        {cls.canJoin && cls.meetingLink ? (
                          <button
                            onClick={() => window.open(cls.meetingLink!, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors"
                          >
                            <Video className="w-3 h-3" />
                            Join Class
                          </button>
                        ) : null}
                        <button
                          onClick={() => setDetailsClass(cls)}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No upcoming classes scheduled</p>
              )}
            </div>
          </div>

          {/* Active Packages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">My Packages</h2>
              <button
                onClick={() => router.push("/parent/teachers")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Buy New Package
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {data.activePackages.length > 0 ? (
                data.activePackages.map((pkg) => {
                  const pct = Math.round((pkg.used / pkg.total) * 100)
                  return (
                    <div key={pkg.id} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/40 transition-colors">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1E293B]">{pkg.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pkg.teacher}</p>
                          <div className="mt-3 mb-1">
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pkg.barColor} transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">{pkg.used} used &middot; {pkg.remaining} remaining</p>
                          <p className="text-xs text-gray-400 mt-0.5">Expires: {pkg.expires}</p>
                          {pkg.isLow && (
                            <p className="text-xs text-[#F59E0B] font-medium mt-1">
                              Low balance &mdash; consider renewing
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <StatusBadge status={pkg.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No active packages</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT col-span-1 */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              {[
                { icon: Search,       label: "Browse Teachers",  href: "/parent/teachers" },
                { icon: CalendarPlus, label: "Schedule a Class", href: "/parent/teachers" },
                { icon: Package,      label: "Buy Package",      href: "/parent/teachers" },
                { icon: CreditCard,   label: "Make Payment",     href: "/parent/payments" },
                { icon: Gift,         label: "Refer a Friend",   href: "/parent/referrals" },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="w-full inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#0D9488]" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Coordinator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-3">Your Education Coordinator</h2>
            {data.coordinator ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">{data.coordinator.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1E293B]">{data.coordinator.name}</p>
                    <p className="text-xs text-gray-500 truncate">{data.coordinator.email}</p>
                    {data.coordinator.phone && (
                      <p className="text-xs text-gray-500">{data.coordinator.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openCoordModal("Message from Parent")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#0D9488] text-[#0D9488] text-xs font-medium hover:bg-teal-50 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Send Message
                  </button>
                  <button
                    onClick={() => openCoordModal("Callback Request")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Schedule Call
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No coordinator assigned yet</p>
            )}
          </div>

          {/* Wallet Summary */}
          {data.walletBalance > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-[#1E293B] mb-3">Wallet</h2>
              <div className="flex items-center gap-3 mb-4 p-3 bg-[#0D9488]/5 rounded-lg border border-[#0D9488]/20">
                <CreditCard className="w-6 h-6 text-[#0D9488]" />
                <div>
                  <p className="text-xl font-bold text-[#0D9488]">
                    ${data.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">Available balance</p>
                </div>
              </div>
              {data.recentWalletTransactions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Activity</h3>
                  {data.recentWalletTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 truncate">{txn.description}</p>
                        <p className="text-[10px] text-gray-400">{txn.date}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold ml-2 ${
                          txn.amount > 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                        }`}
                      >
                        {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
                Wallet balance is auto-applied to your next booking.
              </p>
            </div>
          )}

          {/* Feedback Given */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-3">Feedback Given</h2>
            {data.feedback.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.feedback.map((fb, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400 font-medium mb-1">{fb.date}</p>
                    <RatingStars rating={fb.rating} size="sm" />
                    {fb.text && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{fb.text}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No feedback given yet</p>
            )}
            <Link
              href="/parent/classes?status=COMPLETED"
              className="mt-3 inline-block text-sm text-[#0D9488] font-medium hover:underline"
            >
              Give Feedback &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Class Details Modal */}
      {detailsClass && (
        <ClassDetailsModal
          open={!!detailsClass}
          onClose={() => setDetailsClass(null)}
          cls={{
            id: detailsClass.id,
            subject: detailsClass.subject,
            teacher: detailsClass.teacherName,
            teacherInitials: detailsClass.initials,
            date: detailsClass.day,
            time: detailsClass.time,
            duration: "60 min",
            status: detailsClass.status,
            meetingLink: detailsClass.meetingLink,
            studentName: detailsClass.studentName,
          }}
        />
      )}

      {/* Coordinator Message Modal */}
      {showCoordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1E293B]">
                {coordTitle === "Callback Request" ? "Request a Callback" : "Contact Coordinator"}
              </h3>
              <button
                onClick={() => setShowCoordModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              {coordTitle === "Callback Request"
                ? "Let your coordinator know when you'd like to be called back."
                : "Send a message to your assigned education coordinator."}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {coordTitle === "Callback Request" ? "Preferred time & message *" : "Your Message *"}
              </label>
              <textarea
                value={coordMessage}
                onChange={(e) => setCoordMessage(e.target.value)}
                rows={4}
                placeholder={
                  coordTitle === "Callback Request"
                    ? "e.g., Please call me tomorrow between 10 AM  12 PM EST. I'd like to discuss..."
                    : "e.g., I'd like to discuss package options for my child..."
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none resize-none"
              />
            </div>

            {coordError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{coordError}
              </div>
            )}

            {coordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />{coordSuccess}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCoordModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCoordinatorMessage}
                disabled={coordSending || !!coordSuccess}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {coordSending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                  : coordTitle === "Callback Request"
                    ? "Send Request"
                    : "Send Message"
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
