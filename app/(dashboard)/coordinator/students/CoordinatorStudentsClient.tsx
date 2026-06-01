"use client"

import React, { useState } from "react"
import {
  Download,
  Eye,
  Calendar,
  CreditCard,
  Package,
  AlertCircle,
  X,
  Mail,
  Phone,
  Clock,
  MapPin,
  BookOpen,
  GraduationCap,
  User,
  Copy,
  Check,
} from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Types ─── */

type ActivePackage = {
  name: string
  subject: string
  teacher: string
  classesUsed: number
  classesIncluded: number
  expiryDate: string
}

type UpcomingClass = {
  subject: string
  teacher: string
  scheduledAt: string
  status: string
  isTrial: boolean
}

type Student = {
  id: string
  studentName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  grade: string
  school: string
  timezone: string
  scheduleNotes: string
  onboardingStage: string
  subjects: string[]
  packageStatus: string
  classesRemaining: string
  nextClass: string
  teacher: string
  actionType: string
  activePackages: ActivePackage[]
  upcomingClasses: UpcomingClass[]
  pendingPaymentCount: number
  pendingPaymentTotal: number
  registeredAt: string
}

type KPIs = { total: number; active: number; trial: number; inactive: number }

/* ─── Student Detail Modal ─── */

function StudentDetailModal({
  student,
  onClose,
}: {
  student: Student
  onClose: () => void
}) {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)

  const handleCopy = async (text: string, type: "email" | "phone") => {
    if (text === "—") return
    await navigator.clipboard.writeText(text)
    if (type === "email") {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-base font-bold text-[#0D9488]">
              {student.studentName.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E293B]">
                {student.studentName}
              </h3>
              <p className="text-xs text-gray-500">{student.grade} · {student.school}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={student.packageStatus} size="sm" />
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">Registered {student.registeredAt}</span>
          </div>

          {/* Parent Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent / Guardian</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1E293B]">{student.parentName}</p>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-600">{student.parentEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  {student.parentEmail !== "—" && (
                    <>
                      <button
                        onClick={() => handleCopy(student.parentEmail, "email")}
                        className="p-1 rounded text-gray-400 hover:text-[#0D9488] transition-colors"
                        title="Copy email"
                      >
                        {copiedEmail ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`mailto:${student.parentEmail}`}
                        className="p-1 rounded text-gray-400 hover:text-[#1E3A5F] transition-colors"
                        title="Send email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-600">{student.parentPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  {student.parentPhone !== "—" && (
                    <>
                      <button
                        onClick={() => handleCopy(student.parentPhone, "phone")}
                        className="p-1 rounded text-gray-400 hover:text-[#0D9488] transition-colors"
                        title="Copy phone"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`tel:${student.parentPhone}`}
                        className="p-1 rounded text-gray-400 hover:text-[#1E3A5F] transition-colors"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <GraduationCap className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase font-medium">Teacher</p>
              </div>
              <p className="text-sm font-semibold text-[#1E293B]">{student.teacher}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Package className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase font-medium">Classes Left</p>
              </div>
              <p className={`text-sm font-bold ${
                student.classesRemaining === "0"
                  ? "text-[#EF4444]"
                  : Number(student.classesRemaining) <= 3
                  ? "text-[#F59E0B]"
                  : "text-[#22C55E]"
              }`}>
                {student.classesRemaining}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase font-medium">Timezone</p>
              </div>
              <p className="text-sm font-medium text-[#1E293B]">{student.timezone}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] text-gray-400 uppercase font-medium">Next Class</p>
              </div>
              <p className="text-sm font-medium text-[#1E293B]">{student.nextClass}</p>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1.5">Subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {student.subjects.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule Notes */}
          {student.scheduleNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Schedule Notes</p>
              <p className="text-sm text-amber-800">{student.scheduleNotes}</p>
            </div>
          )}

          {/* Active Packages */}
          {student.activePackages.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                Active Packages ({student.activePackages.length})
              </p>
              <div className="space-y-2">
                {student.activePackages.map((pkg, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#1E293B]">{pkg.name}</p>
                      <span className="text-xs text-gray-400">Exp: {pkg.expiryDate}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{pkg.subject}</span>
                      <span>·</span>
                      <span>{pkg.teacher}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#1E293B]">
                        {pkg.classesUsed}/{pkg.classesIncluded} used
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          pkg.classesUsed >= pkg.classesIncluded
                            ? "bg-red-400"
                            : pkg.classesIncluded - pkg.classesUsed <= 2
                            ? "bg-amber-400"
                            : "bg-[#0D9488]"
                        }`}
                        style={{ width: `${Math.min(100, (pkg.classesUsed / pkg.classesIncluded) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Classes */}
          {student.upcomingClasses.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                Upcoming Classes ({student.upcomingClasses.length})
              </p>
              <div className="space-y-1.5">
                {student.upcomingClasses.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">{cls.scheduledAt}</p>
                        <p className="text-[11px] text-gray-400">{cls.subject} · {cls.teacher}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {cls.isTrial && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">TRIAL</span>
                      )}
                      <StatusBadge status={cls.status.toLowerCase()} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Payments */}
          {student.pendingPaymentCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <CreditCard className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  {student.pendingPaymentCount} pending payment{student.pendingPaymentCount > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-500">
                  Total: ${student.pendingPaymentTotal.toFixed(2)}
                </p>
              </div>
              <Link
                href="/coordinator/payments"
                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
              >
                View
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            {student.parentEmail !== "—" && (
              <a
                href={`mailto:${student.parentEmail}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Parent
              </a>
            )}
            {student.parentPhone !== "—" && (
              <a
                href={`tel:${student.parentPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
            )}
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

/* ─── MiniKPI ─── */

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Main Component ─── */

export function CoordinatorStudentsClient({
  students,
  kpis,
}: {
  students: Student[]
  kpis: KPIs
}) {
  const [viewStudent, setViewStudent] = useState<Student | null>(null)

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (r: Student) => (
        <div>
          <span className="font-medium text-[#1E293B]">{r.studentName}</span>
          <p className="text-[10px] text-gray-400">{r.school !== "—" ? r.school : r.grade}</p>
        </div>
      ),
    },
    {
      key: "parentName",
      label: "Parent",
      sortable: true,
      render: (r: Student) => (
        <div>
          <span className="text-sm text-gray-600">{r.parentName}</span>
          <p className="text-[10px] text-gray-400">{r.parentEmail !== "—" ? r.parentEmail : ""}</p>
        </div>
      ),
    },
    {
      key: "grade",
      label: "Grade",
      sortable: true,
      render: (r: Student) => (
        <span className="text-sm text-gray-600">{r.grade}</span>
      ),
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (r: Student) => (
        <div className="flex flex-wrap gap-1">
          {r.subjects.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "packageStatus",
      label: "Status",
      sortable: true,
      render: (r: Student) => <StatusBadge status={r.packageStatus} size="sm" />,
    },
    {
      key: "classesRemaining",
      label: "Classes Left",
      sortable: true,
      render: (r: Student) => (
        <span
          className={`font-semibold text-sm ${
            r.classesRemaining === "0"
              ? "text-[#EF4444]"
              : Number(r.classesRemaining) <= 3
              ? "text-[#F59E0B]"
              : "text-[#22C55E]"
          }`}
        >
          {r.classesRemaining}
        </span>
      ),
    },
    {
      key: "nextClass",
      label: "Next Class",
      render: (r: Student) => (
        <span className="text-xs text-gray-500">{r.nextClass}</span>
      ),
    },
    {
      key: "teacher",
      label: "Teacher",
      render: (r: Student) => (
        <span className="text-sm text-gray-600">{r.teacher}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: Student) => {
        const type = r.actionType
        return (
          <div className="flex items-center gap-1">
            <button
              title="View Details"
              onClick={() => setViewStudent(r)}
              className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {type === "calendar" && (
              <Link
                href="/coordinator/schedule"
                title="View Schedule"
                className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
              </Link>
            )}
            {type === "payment" && (
              <Link
                href="/coordinator/payments"
                title="View Payments"
                className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
              </Link>
            )}
            {type === "package" && (
              <Link
                href="/coordinator/onboarding"
                title="Convert to Package"
                className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
              </Link>
            )}
            {type === "alert" && (
              <Link
                href="/coordinator/onboarding"
                title="Follow Up"
                className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Students assigned to your bucket
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Assigned" value={kpis.total} />
        <MiniKPI label="Active" value={kpis.active} valueClass="text-[#22C55E]" />
        <MiniKPI label="Trial Phase" value={kpis.trial} valueClass="text-[#F59E0B]" />
        <MiniKPI label="Inactive" value={kpis.inactive} valueClass="text-gray-400" />
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={students as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search students..."
        pageSize={10}
      />

      {/* Student Detail Modal */}
      {viewStudent && (
        <StudentDetailModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
        />
      )}
    </div>
  )
}
