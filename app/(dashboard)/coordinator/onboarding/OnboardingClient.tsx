"use client"

import React, { useState, useMemo } from "react"
import {
  Info,
  Eye,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
} from "lucide-react"

/* ─── Types ─── */

type ClassRecord = {
  id: string
  date: string
  time: string
  subject: string
  teacher: string
  status: string
  isTrial: boolean
  topic: string | null
  rating: number | null
  feedback: string | null
}

type PackageRecord = {
  id: string
  name: string
  subject: string
  teacher: string
  classesIncluded: number
  classesUsed: number
  remaining: number
  status: string
  expiryDate: string
}

type OrderRecord = {
  id: string
  orderRef: string
  status: string
  totalAmount: number
  createdAt: string
}

type OnboardingStudent = {
  id: string
  studentName: string
  parentName: string
  email: string
  phone: string
  grade: string
  school: string | null
  gender: string | null
  subjects: string[]
  timezone: string
  parentTimezone: string | null
  scheduleNotes: string | null
  status: string
  registered: string
  updatedAt: string
  trialDate: string | null
  trialStatus: string | null
  trialRating: number | null
  trialFeedback: string | null
  classes: ClassRecord[]
  packages: PackageRecord[]
  bookingOrders: OrderRecord[]
}

type Counts = {
  total: number
  newLead: number
  trialScheduled: number
  trialCompleted: number
  converted: number
}

/* ─── Constants ─── */

const TABS = [
  { key: "all", label: "All", countKey: "total" as const },
  { key: "new_lead", label: "New Leads", countKey: "newLead" as const },
  { key: "trial_scheduled", label: "Trial Scheduled", countKey: "trialScheduled" as const },
  { key: "trial_completed", label: "Trial Completed", countKey: "trialCompleted" as const },
  { key: "converted", label: "Converted", countKey: "converted" as const },
]

const ONBOARDING_STAGES = [
  { key: "new_lead", label: "New Lead", icon: "1" },
  { key: "trial_scheduled", label: "Trial Scheduled", icon: "2" },
  { key: "trial_completed", label: "Trial Completed", icon: "3" },
  { key: "converted", label: "Converted", icon: "4" },
]

/* ─── Helpers ─── */

function onboardingStatusStyle(status: string): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case "new_lead":
      return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" }
    case "trial_scheduled":
      return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" }
    case "trial_completed":
      return { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" }
    case "converted":
      return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" }
    case "dropped":
      return { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" }
    default:
      return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" }
  }
}

function OnboardingBadge({ status }: { status: string }) {
  const s = onboardingStatusStyle(status)
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border px-2 py-0.5 text-[10px] leading-4 ${s.bg} ${s.text} ${s.border}`}
    >
      {label}
    </span>
  )
}

function classStatusStyle(status: string): string {
  if (["completed", "confirmed"].includes(status))
    return "text-green-700 bg-green-50"
  if (["scheduled", "pending payment"].includes(status))
    return "text-amber-700 bg-amber-50"
  if (status.includes("cancelled") || status.includes("no show"))
    return "text-red-600 bg-red-50"
  return "text-gray-600 bg-gray-50"
}

/* ─── CopyButton ─── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 text-gray-400" />
      )}
    </button>
  )
}

/* ─── StarRating ─── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

/* ─── OnboardingTimeline ─── */

function OnboardingTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = ONBOARDING_STAGES.findIndex(
    (s) => s.key === currentStatus
  )
  const isDropped = currentStatus === "dropped"

  return (
    <div className="flex items-center gap-0">
      {ONBOARDING_STAGES.map((stage, i) => {
        const isComplete = !isDropped && i < currentIdx
        const isCurrent = !isDropped && i === currentIdx

        let circleClass =
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0"
        if (isComplete)
          circleClass += " bg-green-500 border-green-500 text-white"
        else if (isCurrent)
          circleClass +=
            " bg-[#0D9488] border-[#0D9488] text-white ring-4 ring-[#0D9488]/20"
        else if (isDropped)
          circleClass += " bg-red-100 border-red-300 text-red-400"
        else circleClass += " bg-gray-100 border-gray-200 text-gray-400"

        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              <div className={circleClass}>
                {isComplete ? <Check className="w-4 h-4" /> : stage.icon}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight ${
                  isCurrent
                    ? "text-[#0D9488]"
                    : isComplete
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < ONBOARDING_STAGES.length - 1 && (
              <div
                className={`flex-1 h-0.5 min-w-[20px] mt-[-18px] ${
                  isComplete ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ─── OnboardingStudentDetailModal ─── */

function OnboardingStudentDetailModal({
  student,
  onClose,
}: {
  student: OnboardingStudent
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<"classes" | "packages" | "orders">(
    "classes"
  )
  const [showAllClasses, setShowAllClasses] = useState(false)

  const displayClasses = showAllClasses
    ? student.classes
    : student.classes.slice(0, 10)
  const hasMoreClasses = student.classes.length > 10

  const tabs = [
    {
      key: "classes" as const,
      label: "Classes",
      icon: ClipboardList,
      count: student.classes.length,
    },
    {
      key: "packages" as const,
      label: "Packages",
      icon: Package,
      count: student.packages.length,
    },
    {
      key: "orders" as const,
      label: "Orders",
      icon: ShoppingCart,
      count: student.bookingOrders.length,
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-base font-bold text-[#0D9488]">
              {student.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1E293B]">
                  {student.studentName}
                </h2>
                <OnboardingBadge status={student.status} />
              </div>
              <p className="text-xs text-gray-500">
                {student.grade}
                {student.school && <> · {student.school}</>}
                {student.gender && (
                  <>
                    {" "}
                    ·{" "}
                    {student.gender.charAt(0).toUpperCase() +
                      student.gender.slice(1).toLowerCase()}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Onboarding Timeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Onboarding Progress
            </p>
            <OnboardingTimeline currentStatus={student.status} />
            {student.status === "dropped" && (
              <p className="text-xs text-red-500 font-medium mt-3 text-center">
                This student has been marked as dropped.
              </p>
            )}
          </div>

          {/* Contact & Details grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Parent contact */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Parent / Guardian
              </p>
              <p className="text-sm font-semibold text-[#1E293B]">
                {student.parentName}
              </p>
              {student.email !== "—" && (
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-gray-600 truncate">
                    {student.email}
                  </p>
                  <CopyButton text={student.email} />
                </div>
              )}
              {student.phone !== "—" && (
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-gray-600">{student.phone}</p>
                  <CopyButton text={student.phone} />
                </div>
              )}
              {student.parentTimezone && (
                <p className="text-[10px] text-gray-400">
                  Timezone: {student.parentTimezone}
                </p>
              )}
            </div>

            {/* Student details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Student Details
              </p>
              <div className="flex flex-wrap gap-1">
                {student.subjects.map((sub) => (
                  <span
                    key={sub}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200"
                  >
                    {sub}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Timezone: {student.timezone}
              </p>
              <p className="text-xs text-gray-500">
                Registered: {student.registered}
              </p>
              <p className="text-xs text-gray-500">
                Last Updated: {student.updatedAt}
              </p>
            </div>
          </div>

          {/* Schedule Notes */}
          {student.scheduleNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Schedule Notes
                </p>
              </div>
              <p className="text-sm text-amber-800">{student.scheduleNotes}</p>
            </div>
          )}

          {/* Trial Info */}
          {student.trialDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                Trial Class
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-blue-400 uppercase">Date</p>
                  <p className="font-medium text-blue-800">
                    {student.trialDate}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 uppercase">Status</p>
                  <p className="font-medium text-blue-800 capitalize">
                    {student.trialStatus ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 uppercase">Rating</p>
                  {student.trialRating ? (
                    <StarRating rating={student.trialRating} />
                  ) : (
                    <p className="text-blue-400">—</p>
                  )}
                </div>
              </div>
              {student.trialFeedback && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-[10px] text-blue-400 uppercase mb-1">
                    Parent Feedback
                  </p>
                  <p className="text-sm text-blue-800 italic">
                    &ldquo;{student.trialFeedback}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tabbed section: Classes / Packages / Orders */}
          <div>
            <div className="flex gap-1 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-[#0D9488] text-[#0D9488]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold ${
                        activeTab === tab.key
                          ? "bg-[#0D9488] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-3">
              {/* Classes tab */}
              {activeTab === "classes" && (
                <>
                  {student.classes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No classes yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {displayClasses.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-[#1E293B]">
                                {c.subject}
                              </span>
                              {c.isTrial && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold uppercase">
                                  Trial
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${classStatusStyle(
                                  c.status
                                )}`}
                              >
                                {c.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.date} at {c.time} · {c.teacher}
                            </p>
                            {c.topic && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Topic: {c.topic}
                              </p>
                            )}
                            {c.feedback && (
                              <p className="text-xs text-gray-400 mt-0.5 italic">
                                &ldquo;{c.feedback}&rdquo;
                              </p>
                            )}
                          </div>
                          {c.rating && (
                            <div className="flex-shrink-0">
                              <StarRating rating={c.rating} />
                            </div>
                          )}
                        </div>
                      ))}
                      {hasMoreClasses && (
                        <button
                          onClick={() => setShowAllClasses(!showAllClasses)}
                          className="flex items-center gap-1 mx-auto text-xs font-medium text-[#0D9488] hover:underline py-2"
                        >
                          {showAllClasses ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              Show all {student.classes.length} classes
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Packages tab */}
              {activeTab === "packages" && (
                <>
                  {student.packages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No active packages.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {student.packages.map((p) => (
                        <div key={p.id} className="p-3 rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[#1E293B]">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {p.subject} · {p.teacher}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center font-medium rounded-full border px-2 py-0.5 text-[10px] leading-4 ${
                                p.status === "active"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              {p.status.charAt(0).toUpperCase() +
                                p.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              <span className="font-semibold text-[#1E293B]">
                                {p.remaining}
                              </span>
                              /{p.classesIncluded} remaining
                            </span>
                            <span>Expires {p.expiryDate}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.remaining <= 2
                                  ? "bg-red-400"
                                  : p.remaining <= 4
                                  ? "bg-amber-400"
                                  : "bg-green-400"
                              }`}
                              style={{
                                width: `${Math.round(
                                  (p.remaining / p.classesIncluded) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Orders tab */}
              {activeTab === "orders" && (
                <>
                  {student.bookingOrders.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No booking orders.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {student.bookingOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#1E293B]">
                              {o.orderRef}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {o.createdAt}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#1E293B]">
                              ${o.totalAmount.toFixed(2)}
                            </p>
                            <span
                              className={`inline-flex items-center font-medium rounded-full border px-2 py-0.5 text-[10px] leading-4 capitalize ${
                                o.status === "paid"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : o.status.includes("pending")
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-100 flex-shrink-0">
          <div className="text-[10px] text-gray-400">
            ID: {student.id.slice(0, 8)}…
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

export function OnboardingClient({
  students,
  counts,
}: {
  students: OnboardingStudent[]
  counts: Counts
}) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [viewStudent, setViewStudent] = useState<OnboardingStudent | null>(null)

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchTab = activeTab === "all" || s.status === activeTab
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.subjects.join(" ").toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [activeTab, search, students])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            Student Onboarding
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage your student onboarding pipeline
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-0">
        {TABS.map((tab) => {
          const count = counts[tab.countKey]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#0D9488] text-[#0D9488]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && count > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? "bg-[#0D9488] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search students, parents, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Student",
                  "Parent",
                  "Contact",
                  "Grade",
                  "Subjects",
                  "Timezone",
                  "Status",
                  "Registered",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    No students found.
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1E293B]">
                      {s.studentName}
                    </p>
                    {s.trialDate && (
                      <p className="text-[10px] text-gray-400">
                        Trial: {s.trialDate}
                        {s.trialRating ? ` · ${s.trialRating}★` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {s.parentName}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600 text-xs">{s.email}</p>
                    <p className="text-gray-400 text-xs">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {s.grade}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {s.timezone}
                  </td>
                  <td className="px-4 py-3">
                    <OnboardingBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {s.registered}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      title="View Details"
                      onClick={() => setViewStudent(s)}
                      className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Showing {filtered.length} of {students.length} students
        </div>
      </div>

      {/* Onboarding Workflow Info Card */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              Onboarding Workflow
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>
                <span className="font-medium">New Lead</span> – Student
                registers on the platform. Contact the family within 24 hours.
              </li>
              <li>
                <span className="font-medium">Trial Scheduled</span> – A trial
                class is booked with a suitable teacher. Confirm date/time with
                the family.
              </li>
              <li>
                <span className="font-medium">Trial Completed</span> – Trial
                class done. Collect feedback and rating; follow up on
                conversion.
              </li>
              <li>
                <span className="font-medium">Converted</span> – Student
                purchases a package and becomes an active student in your
                bucket.
              </li>
            </ol>
            <p className="text-xs text-blue-500 mt-3">
              Auto-assignment rule: New registrations are distributed to
              coordinators with available slots (bucket size &lt; 50). Students
              are sorted by registration date.
            </p>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewStudent && (
        <OnboardingStudentDetailModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
        />
      )}
    </div>
  )
}
