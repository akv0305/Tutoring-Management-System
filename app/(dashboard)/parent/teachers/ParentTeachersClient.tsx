"use client"

import React, { useState, useMemo } from "react"
import { Star, ShieldCheck, X } from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"
import { useRouter } from "next/navigation"

type TeacherEntry = {
  id: string
  initials: string
  avatarBg: string
  name: string
  qualification: string
  subjects: string[]
  subjectColors: string[]
  rating: number
  reviews: number
  price: string
  experience: string
  availability: string
  isExistingTeacher: boolean
  isVerified: boolean
}

function TeacherGridCard({ teacher }: { teacher: TeacherEntry }) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      <div className="h-2 bg-[#0D9488]" />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-center -mt-8 mb-3">
          <div className={`w-16 h-16 rounded-full ${teacher.avatarBg} flex items-center justify-center border-4 border-white shadow-sm`}>
            <span className="text-white text-xl font-bold">{teacher.initials}</span>
          </div>
        </div>
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h3 className="text-base font-bold text-[#1E293B]">{teacher.name}</h3>
            {teacher.isVerified && <ShieldCheck className="w-4 h-4 text-[#22C55E] flex-shrink-0" />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{teacher.qualification}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-1 mb-3">
          {teacher.subjects.map((sub, i) => (
            <span key={sub} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${teacher.subjectColors[i] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {sub}
            </span>
          ))}
        </div>
        <div className="flex justify-center mb-3">
          {teacher.rating > 0 ? <RatingStars rating={teacher.rating} count={teacher.reviews} size="sm" /> : <span className="text-xs text-gray-400">No ratings yet</span>}
        </div>
        <p className="text-center text-xl font-bold text-[#0D9488] mb-1">{teacher.price}</p>
        <p className="text-center text-xs text-gray-500 mb-0.5">{teacher.experience}</p>
        <p className="text-center text-xs text-gray-400 mb-4">{teacher.availability}</p>
        <div className="border-t border-gray-100 mb-4" />
        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={() => router.push(`/parent/teachers/${teacher.id}`)}
            className="w-full text-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
          >
            View Profile & Availability
          </button>
          <button
            onClick={() => router.push(`/parent/teachers/${teacher.id}`)}
            className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
              teacher.isExistingTeacher
                ? "bg-[#0D9488] text-white hover:bg-teal-700"
                : "bg-[#F59E0B] text-[#1E293B] hover:bg-amber-400"
            }`}
          >
            {teacher.isExistingTeacher ? "Book Class" : "Book Trial"}
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function ParentTeachersClient({
  teachers,
  subjectOptions,
}: {
  teachers: TeacherEntry[]
  subjectOptions: string[]
}) {
  const [subject, setSubject] = useState("All Subjects")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const matchSubject =
        subject === "All Subjects" || t.subjects.includes(subject)
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subjects.join(" ").toLowerCase().includes(q)
      return matchSubject && matchSearch
    })
  }, [subject, search, teachers])

  const hasFilters = subject !== "All Subjects" || search !== ""

  function clearFilters() {
    setSubject("All Subjects")
    setSearch("")
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Browse Teachers</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Find the perfect tutor for your child
        </p>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input
              type="text"
              placeholder="Search by name or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <FilterSelect
            value={subject}
            onChange={setSubject}
            options={["All Subjects", ...subjectOptions]}
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              &quot;{search}&quot;
              <button onClick={() => setSearch("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {subject !== "All Subjects" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              {subject}
              <button onClick={() => setSubject("All Subjects")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Teacher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">
            No teachers found matching your criteria.
          </div>
        ) : (
          filtered.map((teacher) => (
            <TeacherGridCard key={teacher.id} teacher={teacher} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <p className="text-sm text-gray-500">
          Showing {filtered.length} of {teachers.length} teachers
        </p>
      </div>
    </div>
  )
}
