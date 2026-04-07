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
} from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Student = {
  id: string
  studentName: string
  parentName: string
  grade: string
  subjects: string[]
  packageStatus: string
  classesRemaining: string
  nextClass: string
  teacher: string
  actionType: string
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
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-[#1E293B]">
            Student Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-lg font-bold text-[#0D9488]">
              {student.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-base font-semibold text-[#1E293B]">
                {student.studentName}
              </p>
              <p className="text-xs text-gray-500">{student.grade}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Parent
              </p>
              <p className="font-medium text-[#1E293B]">
                {student.parentName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Teacher
              </p>
              <p className="font-medium text-[#1E293B]">{student.teacher}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Package Status
              </p>
              <StatusBadge status={student.packageStatus} size="sm" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Classes Left
              </p>
              <p
                className={`font-bold ${
                  student.classesRemaining === "0"
                    ? "text-[#EF4444]"
                    : Number(student.classesRemaining) <= 3
                    ? "text-[#F59E0B]"
                    : "text-[#22C55E]"
                }`}
              >
                {student.classesRemaining}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Next Class
              </p>
              <p className="font-medium text-[#1E293B]">
                {student.nextClass}
              </p>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">
              Subjects
            </p>
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
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

  /* Columns defined inside component to access setViewStudent */
  const columns = [
    {
      key: "studentName",
      label: "Student Name",
      sortable: true,
      render: (r: Student) => (
        <span className="font-medium text-[#1E293B]">{r.studentName}</span>
      ),
    },
    {
      key: "parentName",
      label: "Parent Name",
      sortable: true,
      render: (r: Student) => (
        <span className="text-gray-600 text-sm">{r.parentName}</span>
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
      label: "Package Status",
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
              title="View"
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
        <MiniKPI
          label="Active"
          value={kpis.active}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI
          label="Trial Phase"
          value={kpis.trial}
          valueClass="text-[#F59E0B]"
        />
        <MiniKPI
          label="Inactive"
          value={kpis.inactive}
          valueClass="text-gray-400"
        />
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
