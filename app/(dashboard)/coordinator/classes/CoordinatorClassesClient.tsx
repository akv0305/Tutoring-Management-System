"use client"

import React, { useState, useMemo } from "react"
import {
  Download,
  Eye,
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  Star,
  FileText,
  Package,
  CreditCard,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { RatingStars } from "@/components/ui/RatingStars"

/* ──────────────────── Types ──────────────────── */

type ClassRow = {
  id: string
  studentName: string
  studentId: string
  studentGrade: string
  parentName: string
  parentProfileId: string
  teacherName: string
  teacherId: string
  subject: string
  packageName: string
  orderRef: string
  scheduledAt: string
  date: string
  time: string
  duration: number
  status: string
  statusLower: string
  meetingLink: string
  topicCovered: string
  sessionNotes: string
  studentNotes: string
  parentRating: number | null
  parentFeedback: string
  isTrial: boolean
  completedAt: string | null
  cancelReason: string
}

type KPIs = {
  total: number
  completed: number
  scheduled: number
  pendingPayment: number
  cancelled: number
  noShow: number
}

type TeacherOption = { id: string; name: string }
type StudentOption = { id: string; name: string }

/* ──────────────────── Mini KPI ──────────────────── */

function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-0.5">
        {label}
      </p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ──────────────────── Class Detail Modal (View Only) ──────────────────── */

function ClassDetailModal({
  cls,
  onClose,
}: {
  cls: ClassRow
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between pr-8">
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">
                Class Details
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {cls.subject} — {cls.date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={cls.statusLower} size="sm" />
              {cls.isTrial && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                  TRIAL
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.date}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.time}
                </p>
              </div>
            </div>
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Student</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.studentName}
                </p>
                <p className="text-xs text-gray-400">
                  Grade {cls.studentGrade} · Parent: {cls.parentName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Teacher</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.teacherName}
                </p>
              </div>
            </div>
          </div>

          {/* Package & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Package</p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.packageName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Order Ref</p>
                <p className="text-sm font-mono font-medium text-[#1E3A5F]">
                  {cls.orderRef}
                </p>
              </div>
            </div>
          </div>

          {/* Topic / Session Notes */}
          {(cls.topicCovered || cls.sessionNotes) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {cls.topicCovered && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Topic Covered
                  </p>
                  <p className="text-sm text-[#1E293B] mt-0.5">
                    {cls.topicCovered}
                  </p>
                </div>
              )}
              {cls.sessionNotes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Session Notes (Teacher)
                  </p>
                  <p className="text-sm text-[#1E293B] mt-0.5 whitespace-pre-line">
                    {cls.sessionNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Student Notes */}
          {cls.studentNotes && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Student Notes
              </p>
              <p className="text-sm text-[#1E293B] mt-0.5 whitespace-pre-line">
                {cls.studentNotes}
              </p>
            </div>
          )}

          {/* Rating */}
          {cls.parentRating && (
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Parent Rating
                </span>
              </div>
              <RatingStars rating={cls.parentRating} size="sm" />
              {cls.parentFeedback && (
                <p className="text-sm text-gray-600 mt-1.5 italic">
                  &ldquo;{cls.parentFeedback}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Cancel reason */}
          {cls.cancelReason && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                Cancel Reason
              </p>
              <p className="text-sm text-red-700 mt-0.5">
                {cls.cancelReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer — Close only */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Main Client Component ──────────────────── */

export function CoordinatorClassesClient({
  classes,
  kpis,
  teachers,
  students,
  defaultMonth,
}: {
  classes: ClassRow[]
  kpis: KPIs
  teachers: TeacherOption[]
  students: StudentOption[]
  defaultMonth: string
}) {
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [teacherFilter, setTeacherFilter] = useState<string>("all")
  const [studentFilter, setStudentFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Modal
  const [detailClass, setDetailClass] = useState<ClassRow | null>(null)

  const filteredClasses = useMemo(() => {
    let result = classes

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }
    if (teacherFilter !== "all") {
      result = result.filter((c) => c.teacherId === teacherFilter)
    }
    if (studentFilter !== "all") {
      result = result.filter((c) => c.studentId === studentFilter)
    }
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00")
      result = result.filter((c) => new Date(c.scheduledAt) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59")
      result = result.filter((c) => new Date(c.scheduledAt) <= to)
    }

    return result
  }, [classes, statusFilter, teacherFilter, studentFilter, dateFrom, dateTo])

  // CSV export
  function exportCSV() {
    const headers = [
      "Date",
      "Time",
      "Student",
      "Teacher",
      "Subject",
      "Duration",
      "Status",
      "Package",
      "Order Ref",
      "Topic",
      "Rating",
      "Trial",
    ]
    const rows = filteredClasses.map((c) => [
      c.date,
      c.time,
      c.studentName,
      c.teacherName,
      c.subject,
      `${c.duration} min`,
      c.statusLower,
      c.packageName,
      c.orderRef,
      c.topicCovered,
      c.parentRating ?? "—",
      c.isTrial ? "Yes" : "No",
    ])
    const csv =
      [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `coordinator-classes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusTabs = [
    { key: "all", label: "All", count: kpis.total },
    { key: "COMPLETED", label: "Completed", count: kpis.completed },
    { key: "SCHEDULED", label: "Scheduled", count: kpis.scheduled },
    {
      key: "PENDING_PAYMENT",
      label: "Pending Payment",
      count: kpis.pendingPayment,
    },
    { key: "CANCELLED_STUDENT", label: "Cancelled", count: kpis.cancelled },
  ]

  const columns = [
    {
      key: "date",
      label: "Date & Time",
      sortable: true,
      render: (r: ClassRow) => (
        <div>
          <p className="text-sm font-medium text-[#1E293B]">{r.date}</p>
          <p className="text-xs text-gray-400">{r.time}</p>
        </div>
      ),
    },
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (r: ClassRow) => (
        <div>
          <p className="text-sm font-medium text-[#1E293B]">
            {r.studentName}
          </p>
          <p className="text-xs text-gray-400">Grade {r.studentGrade}</p>
        </div>
      ),
    },
    {
      key: "teacherName",
      label: "Teacher",
      sortable: true,
      render: (r: ClassRow) => (
        <span className="text-sm text-[#1E293B]">{r.teacherName}</span>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (r: ClassRow) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[#1E293B]">{r.subject}</span>
          {r.isTrial && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase">
              TRIAL
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r: ClassRow) => (
        <StatusBadge status={r.statusLower} size="sm" />
      ),
    },
    {
      key: "orderRef",
      label: "Order",
      render: (r: ClassRow) => (
        <span className="font-mono text-xs text-[#1E3A5F]">{r.orderRef}</span>
      ),
    },
    {
      key: "parentRating",
      label: "Rating",
      render: (r: ClassRow) =>
        r.parentRating ? (
          <RatingStars rating={r.parentRating} size="sm" />
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (r: ClassRow) => (
        <button
          title="View Details"
          onClick={() => setDetailClass(r)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Classes</h1>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <MiniKPI label="Total" value={kpis.total} />
        <MiniKPI
          label="Completed"
          value={kpis.completed}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI
          label="Scheduled"
          value={kpis.scheduled}
          valueClass="text-[#0D9488]"
        />
        <MiniKPI
          label="Pending Pay"
          value={kpis.pendingPayment}
          valueClass="text-[#F59E0B]"
        />
        <MiniKPI
          label="Cancelled"
          value={kpis.cancelled}
          valueClass="text-[#EF4444]"
        />
        <MiniKPI
          label="No-Show"
          value={kpis.noShow}
          valueClass="text-[#EF4444]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === tab.key
                  ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Student filter */}
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            Student
          </label>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Teacher filter */}
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            Teacher
          </label>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="all">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("")
                setDateTo("")
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filteredClasses as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search by student, teacher, subject, order..."
        pageSize={10}
      />

      {/* Detail Modal */}
      {detailClass && (
        <ClassDetailModal
          cls={detailClass}
          onClose={() => setDetailClass(null)}
        />
      )}
    </div>
  )
}
