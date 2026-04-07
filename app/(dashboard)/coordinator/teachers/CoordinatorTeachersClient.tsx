"use client"

import React, { useState, useMemo } from "react"
import { Filter, Star, X, Eye } from "lucide-react"

/* ─── Types ─── */
type Teacher = {
  id: string
  name: string
  initials: string
  qualification: string
  subjects: string[]
  rating: number
  reviews: number
  experience: string
  activeStudents: number
  status: string
}

/* ─── Color helpers ─── */
const AVATAR_COLORS = [
  "bg-[#1E3A5F]",
  "bg-[#0D9488]",
  "bg-purple-700",
  "bg-emerald-700",
  "bg-rose-700",
  "bg-indigo-700",
  "bg-amber-700",
  "bg-cyan-700",
]

const SUBJECT_COLOR_MAP: Record<string, string> = {
  Mathematics: "bg-teal-50 text-teal-700 border-teal-200",
  Physics: "bg-blue-50 text-blue-700 border-blue-200",
  Chemistry: "bg-emerald-50 text-emerald-700 border-emerald-200",
  English: "bg-amber-50 text-amber-700 border-amber-200",
  Science: "bg-teal-50 text-teal-700 border-teal-200",
  "SAT Prep": "bg-purple-50 text-purple-700 border-purple-200",
  "ACT Prep": "bg-orange-50 text-orange-700 border-orange-200",
  "Computer Science": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Test Prep": "bg-orange-50 text-orange-700 border-orange-200",
  Languages: "bg-rose-50 text-rose-700 border-rose-200",
}
const DEFAULT_SUBJECT_COLOR = "bg-gray-100 text-gray-600 border-gray-200"

function getAvatarBg(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getSubjectColor(subject: string): string {
  return SUBJECT_COLOR_MAP[subject] ?? DEFAULT_SUBJECT_COLOR
}

function getAvailability(status: string): { label: string; cls: string } {
  switch (status) {
    case "active":
      return { label: "Available", cls: "text-green-600 bg-green-50 border-green-200" }
    case "on_leave":
      return { label: "On Leave", cls: "text-red-600 bg-red-50 border-red-200" }
    case "inactive":
      return { label: "Inactive", cls: "text-gray-500 bg-gray-50 border-gray-200" }
    default:
      return { label: "Unknown", cls: "text-gray-500 bg-gray-50 border-gray-200" }
  }
}

/* ─── Star Rating ─── */
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className="w-3.5 h-3.5"
            fill={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}
            stroke={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#1E293B]">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

/* ─── Teacher Detail Modal ─── */
function TeacherDetailModal({
  teacher,
  onClose,
}: {
  teacher: Teacher
  onClose: () => void
}) {
  const avail = getAvailability(teacher.status)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-[#1E293B]">
            Teacher Profile
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full ${getAvatarBg(teacher.name)} flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <span className="text-white text-lg font-bold">
                {teacher.initials}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-[#1E293B]">
                {teacher.name}
              </p>
              <p className="text-xs text-gray-500">{teacher.qualification}</p>
              <div className="mt-1">
                <StarRating rating={teacher.rating} count={teacher.reviews} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">
              Subjects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {teacher.subjects.map((s) => (
                <span
                  key={s}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getSubjectColor(s)}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Experience</p>
              <p className="font-semibold text-[#1E293B] mt-0.5">
                {teacher.experience}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Active Students</p>
              <p className="font-semibold text-[#1E293B] mt-0.5">
                {teacher.activeStudents}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Availability:</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${avail.cls}`}
            >
              {avail.label}
            </span>
          </div>
        </div>

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

/* ─── Teacher Card ─── */
function TeacherCardCoord({
  teacher,
  onView,
}: {
  teacher: Teacher
  onView: () => void
}) {
  const avail = getAvailability(teacher.status)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-full ${getAvatarBg(teacher.name)} flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <span className="text-white text-lg font-bold">
            {teacher.initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#1E293B] truncate">
              {teacher.name}
            </h3>
            {teacher.status === "active" && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E3A5F]/10 text-[#1E3A5F] uppercase">
                ✓ Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            {teacher.qualification}
          </p>
          <div className="mt-1">
            <StarRating rating={teacher.rating} count={teacher.reviews} />
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((sub) => (
          <span
            key={sub}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getSubjectColor(sub)}`}
          >
            {sub}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400">Experience</p>
          <p className="font-semibold text-[#1E293B] mt-0.5">
            {teacher.experience}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400">Active Students</p>
          <p className="font-semibold text-[#1E293B] mt-0.5">
            {teacher.activeStudents}
          </p>
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Availability:</span>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${avail.cls}`}
        >
          {avail.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onView}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View Full Profile
        </button>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export function CoordinatorTeachersClient({
  teachers,
}: {
  teachers: Teacher[]
}) {
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [availFilter, setAvailFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)

  const allSubjects = useMemo(
    () => Array.from(new Set(teachers.flatMap((t) => t.subjects))).sort(),
    [teachers]
  )

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const avail = getAvailability(t.status)
      const matchSub =
        subjectFilter === "all" || t.subjects.includes(subjectFilter)
      const matchAvail =
        availFilter === "all" ||
        avail.label.toLowerCase().replace(" ", "_") === availFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q))
      return matchSub && matchAvail && matchSearch
    })
  }, [subjectFilter, availFilter, search, teachers])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Teacher Directory
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Browse available teachers for your students
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">Filters:</span>
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
        >
          <option value="all">All Subjects</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
        >
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by name or subject…"
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

        <span className="text-sm text-gray-500 ml-auto">
          {filtered.length} teacher{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No teachers match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TeacherCardCoord
              key={t.id}
              teacher={t}
              onView={() => setViewTeacher(t)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewTeacher && (
        <TeacherDetailModal
          teacher={viewTeacher}
          onClose={() => setViewTeacher(null)}
        />
      )}
    </div>
  )
}
