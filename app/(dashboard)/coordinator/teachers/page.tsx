"use client"

import React, { useState, useMemo } from "react"
import { Filter, Star } from "lucide-react"

/* ─── Types ─── */
type Teacher = {
  id: string
  name: string
  initials: string
  avatarBg: string
  qualification: string
  subjects: string[]
  subjectColors: string[]
  rating: number
  reviews: number
  experience: string
  activeStudents: number
  availability: string
  availabilityColor: string
  isVerified: boolean
}

/* ─── Data ─── */
const TEACHERS: Teacher[] = [
  {
    id: "T001",
    name: "Dr. Ananya Sharma",
    initials: "AS",
    avatarBg: "bg-[#1E3A5F]",
    qualification: "Ph.D. Mathematics, IIT Delhi",
    subjects: ["Mathematics", "Statistics"],
    subjectColors: ["bg-teal-50 text-teal-700 border-teal-200", "bg-blue-50 text-blue-700 border-blue-200"],
    rating: 4.9,
    reviews: 128,
    experience: "8 years",
    activeStudents: 12,
    availability: "Available",
    availabilityColor: "text-green-600 bg-green-50 border-green-200",
    isVerified: true,
  },
  {
    id: "T002",
    name: "Prof. Vikram Rao",
    initials: "VR",
    avatarBg: "bg-[#0D9488]",
    qualification: "M.Sc. Physics, NIT Trichy",
    subjects: ["Physics", "ACT Prep", "SAT Prep"],
    subjectColors: ["bg-blue-50 text-blue-700 border-blue-200", "bg-orange-50 text-orange-700 border-orange-200", "bg-purple-50 text-purple-700 border-purple-200"],
    rating: 4.7,
    reviews: 95,
    experience: "6 years",
    activeStudents: 9,
    availability: "Available",
    availabilityColor: "text-green-600 bg-green-50 border-green-200",
    isVerified: true,
  },
  {
    id: "T003",
    name: "Ms. Deepika Nair",
    initials: "DN",
    avatarBg: "bg-purple-700",
    qualification: "M.A. English Literature, DU",
    subjects: ["English", "Creative Writing"],
    subjectColors: ["bg-amber-50 text-amber-700 border-amber-200", "bg-rose-50 text-rose-700 border-rose-200"],
    rating: 4.8,
    reviews: 74,
    experience: "5 years",
    activeStudents: 7,
    availability: "Available",
    availabilityColor: "text-green-600 bg-green-50 border-green-200",
    isVerified: true,
  },
  {
    id: "T004",
    name: "Mr. Suresh Iyer",
    initials: "SI",
    avatarBg: "bg-emerald-700",
    qualification: "M.Sc. Chemistry, IISc Bangalore",
    subjects: ["Chemistry", "Science"],
    subjectColors: ["bg-emerald-50 text-emerald-700 border-emerald-200", "bg-teal-50 text-teal-700 border-teal-200"],
    rating: 4.6,
    reviews: 61,
    experience: "7 years",
    activeStudents: 8,
    availability: "Limited",
    availabilityColor: "text-amber-600 bg-amber-50 border-amber-200",
    isVerified: true,
  },
  {
    id: "T005",
    name: "Ms. Kavitha Menon",
    initials: "KM",
    avatarBg: "bg-rose-700",
    qualification: "M.Sc. Computer Science, BITS",
    subjects: ["Computer Science", "Coding", "Math"],
    subjectColors: ["bg-indigo-50 text-indigo-700 border-indigo-200", "bg-cyan-50 text-cyan-700 border-cyan-200", "bg-teal-50 text-teal-700 border-teal-200"],
    rating: 4.5,
    reviews: 43,
    experience: "4 years",
    activeStudents: 6,
    availability: "Available",
    availabilityColor: "text-green-600 bg-green-50 border-green-200",
    isVerified: false,
  },
  {
    id: "T006",
    name: "Dr. Rajan Pillai",
    initials: "RP",
    avatarBg: "bg-indigo-700",
    qualification: "Ph.D. History, JNU Delhi",
    subjects: ["History", "Social Studies", "English"],
    subjectColors: ["bg-amber-50 text-amber-700 border-amber-200", "bg-gray-100 text-gray-700 border-gray-200", "bg-rose-50 text-rose-700 border-rose-200"],
    rating: 4.4,
    reviews: 38,
    experience: "10 years",
    activeStudents: 5,
    availability: "On Leave",
    availabilityColor: "text-red-600 bg-red-50 border-red-200",
    isVerified: true,
  },
]

/* ─── Star Rating display ─── */
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
      <span className="text-xs font-semibold text-[#1E293B]">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

/* ─── Teacher Card ─── */
function TeacherCardCoord({ teacher }: { teacher: Teacher }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full ${teacher.avatarBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white text-lg font-bold">{teacher.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#1E293B] truncate">{teacher.name}</h3>
            {teacher.isVerified && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E3A5F]/10 text-[#1E3A5F] uppercase">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{teacher.qualification}</p>
          <div className="mt-1">
            <StarRating rating={teacher.rating} count={teacher.reviews} />
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((sub, i) => (
          <span key={sub} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${teacher.subjectColors[i] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {sub}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400">Experience</p>
          <p className="font-semibold text-[#1E293B] mt-0.5">{teacher.experience}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400">Active Students</p>
          <p className="font-semibold text-[#1E293B] mt-0.5">{teacher.activeStudents}</p>
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Availability:</span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${teacher.availabilityColor}`}>
          {teacher.availability}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          View Full Profile
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            teacher.availability === "On Leave"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#0D9488] text-white hover:bg-teal-700"
          }`}
          disabled={teacher.availability === "On Leave"}
        >
          Assign to Student
        </button>
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function CoordinatorTeachersPage() {
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [availFilter, setAvailFilter] = useState("all")
  const [search, setSearch] = useState("")

  const allSubjects = Array.from(new Set(TEACHERS.flatMap((t) => t.subjects))).sort()

  const filtered = useMemo(() => {
    return TEACHERS.filter((t) => {
      const matchSub = subjectFilter === "all" || t.subjects.includes(subjectFilter)
      const matchAvail = availFilter === "all" || t.availability.toLowerCase().replace(" ", "_") === availFilter
      const q = search.toLowerCase()
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.subjects.some((s) => s.toLowerCase().includes(q))
      return matchSub && matchAvail && matchSearch
    })
  }, [subjectFilter, availFilter, search])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Directory</h1>
        <p className="text-sm text-gray-500 mt-0.5">Browse and assign available teachers to your students</p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">Filters:</span>
        </div>

        {/* Subject dropdown */}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
        >
          <option value="all">All Subjects</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Availability dropdown */}
        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
        >
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="on_leave">On Leave</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by name or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <span className="text-sm text-gray-500 ml-auto">
          {filtered.length} teacher{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No teachers match the selected filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TeacherCardCoord key={t.id} teacher={t} />
          ))}
        </div>
      )}
    </div>
  )
}
