"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Star, ShieldCheck, X } from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Teacher data ─── */
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

const TEACHERS: TeacherEntry[] = [
  {
    id: "ananya-sharma",
    initials: "AS",
    avatarBg: "bg-[#0D9488]",
    name: "Dr. Ananya Sharma",
    qualification: "Ph.D. Mathematics",
    subjects: ["Mathematics", "AP Calculus"],
    subjectColors: ["bg-teal-50 text-teal-700 border-teal-200", "bg-blue-50 text-blue-700 border-blue-200"],
    rating: 4.9,
    reviews: 156,
    price: "$55/hr",
    experience: "8 years experience",
    availability: "Mon–Fri, 8AM–2PM EST",
    isExistingTeacher: true,
    isVerified: true,
  },
  {
    id: "vikram-rao",
    initials: "VR",
    avatarBg: "bg-[#1E3A5F]",
    name: "Prof. Vikram Rao",
    qualification: "M.Sc. Physics",
    subjects: ["Physics", "SAT Prep"],
    subjectColors: ["bg-purple-50 text-purple-700 border-purple-200", "bg-orange-50 text-orange-700 border-orange-200"],
    rating: 4.7,
    reviews: 98,
    price: "$60/hr",
    experience: "10 years experience",
    availability: "Mon–Sat, 9AM–3PM EST",
    isExistingTeacher: true,
    isVerified: true,
  },
  {
    id: "deepika-nair",
    initials: "DN",
    avatarBg: "bg-purple-700",
    name: "Ms. Deepika Nair",
    qualification: "M.A. English",
    subjects: ["English", "Reading"],
    subjectColors: ["bg-amber-50 text-amber-700 border-amber-200", "bg-rose-50 text-rose-700 border-rose-200"],
    rating: 4.8,
    reviews: 112,
    price: "$50/hr",
    experience: "6 years experience",
    availability: "Mon–Fri, 10AM–4PM EST",
    isExistingTeacher: false,
    isVerified: true,
  },
  {
    id: "suresh-iyer",
    initials: "SI",
    avatarBg: "bg-emerald-700",
    name: "Mr. Suresh Iyer",
    qualification: "M.Sc. Chemistry",
    subjects: ["Chemistry", "Science"],
    subjectColors: ["bg-emerald-50 text-emerald-700 border-emerald-200", "bg-teal-50 text-teal-700 border-teal-200"],
    rating: 4.5,
    reviews: 76,
    price: "$60/hr",
    experience: "7 years experience",
    availability: "Tue–Sat, 8AM–1PM EST",
    isExistingTeacher: false,
    isVerified: true,
  },
  {
    id: "meera-krishnan",
    initials: "MK",
    avatarBg: "bg-indigo-700",
    name: "Dr. Meera Krishnan",
    qualification: "Ph.D. Computer Science",
    subjects: ["Coding", "Python", "CS"],
    subjectColors: ["bg-indigo-50 text-indigo-700 border-indigo-200", "bg-cyan-50 text-cyan-700 border-cyan-200", "bg-sky-50 text-sky-700 border-sky-200"],
    rating: 4.6,
    reviews: 64,
    price: "$60/hr",
    experience: "5 years experience",
    availability: "Mon–Thu, 11AM–5PM EST",
    isExistingTeacher: false,
    isVerified: true,
  },
  {
    id: "arjun-reddy",
    initials: "AR",
    avatarBg: "bg-rose-700",
    name: "Mr. Arjun Reddy",
    qualification: "M.Sc. Biology",
    subjects: ["Biology", "Science"],
    subjectColors: ["bg-green-50 text-green-700 border-green-200", "bg-teal-50 text-teal-700 border-teal-200"],
    rating: 4.4,
    reviews: 42,
    price: "$55/hr",
    experience: "4 years experience",
    availability: "Wed–Sun, 9AM–2PM EST",
    isExistingTeacher: false,
    isVerified: false,
  },
  {
    id: "priya-kumar",
    initials: "PK",
    avatarBg: "bg-pink-700",
    name: "Ms. Priya Kumar",
    qualification: "M.A. English",
    subjects: ["English", "ACT Prep"],
    subjectColors: ["bg-amber-50 text-amber-700 border-amber-200", "bg-orange-50 text-orange-700 border-orange-200"],
    rating: 4.7,
    reviews: 88,
    price: "$55/hr",
    experience: "6 years experience",
    availability: "Mon–Fri, 9AM–3PM EST",
    isExistingTeacher: false,
    isVerified: true,
  },
  {
    id: "rahul-joshi",
    initials: "RJ",
    avatarBg: "bg-slate-700",
    name: "Mr. Rahul Joshi",
    qualification: "M.Sc. Mathematics",
    subjects: ["Mathematics", "IB Math"],
    subjectColors: ["bg-teal-50 text-teal-700 border-teal-200", "bg-blue-50 text-blue-700 border-blue-200"],
    rating: 4.5,
    reviews: 52,
    price: "$65/hr",
    experience: "5 years experience",
    availability: "Tue–Sat, 10AM–4PM EST",
    isExistingTeacher: false,
    isVerified: true,
  },
  {
    id: "sunita-kapoor",
    initials: "SK",
    avatarBg: "bg-violet-700",
    name: "Dr. Sunita Kapoor",
    qualification: "Ph.D. Physics",
    subjects: ["Physics", "AP Physics"],
    subjectColors: ["bg-purple-50 text-purple-700 border-purple-200", "bg-indigo-50 text-indigo-700 border-indigo-200"],
    rating: 4.8,
    reviews: 72,
    price: "$70/hr",
    experience: "9 years experience",
    availability: "Mon–Fri, 8AM–1PM EST",
    isExistingTeacher: false,
    isVerified: true,
  },
]

/* ─── Filter options ─── */
const SUBJECT_OPTIONS = ["All Subjects", "Mathematics", "Physics", "Chemistry", "Biology", "English", "AP Calculus", "AP Physics", "SAT Prep", "ACT Prep", "Coding"]
const GRADE_OPTIONS   = ["All Grades", "Grade 1–5", "Grade 6–8", "Grade 9–12"]
const RATING_OPTIONS  = ["All Ratings", "4.5+ Stars", "4.0+ Stars", "3.5+ Stars"]
const AVAIL_OPTIONS   = ["Any Day", "Weekdays", "Weekends", "Mornings", "Afternoons", "Evenings"]

/* ─── Teacher Card ─── */
function TeacherGridCard({ teacher }: { teacher: TeacherEntry }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Top color bar */}
      <div className="h-2 bg-[#0D9488]" />

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Avatar */}
        <div className="flex justify-center -mt-8 mb-3">
          <div className={`w-16 h-16 rounded-full ${teacher.avatarBg} flex items-center justify-center border-4 border-white shadow-sm`}>
            <span className="text-white text-xl font-bold">{teacher.initials}</span>
          </div>
        </div>

        {/* Name + qualification */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h3 className="text-base font-bold text-[#1E293B]">{teacher.name}</h3>
            {teacher.isVerified && (
              <ShieldCheck className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{teacher.qualification}</p>
        </div>

        {/* Subject tags */}
        <div className="flex flex-wrap justify-center gap-1 mb-3">
          {teacher.subjects.map((sub, i) => (
            <span
              key={sub}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${teacher.subjectColors[i] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {sub}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="flex justify-center mb-3">
          <RatingStars rating={teacher.rating} count={teacher.reviews} size="sm" />
        </div>

        {/* Price */}
        <p className="text-center text-xl font-bold text-[#0D9488] mb-1">{teacher.price}</p>

        {/* Experience + Availability */}
        <p className="text-center text-xs text-gray-500 mb-0.5">{teacher.experience}</p>
        <p className="text-center text-xs text-gray-400 mb-4">{teacher.availability}</p>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-4" />

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <Link
            href={`/parent/teachers/${teacher.id}`}
            className="w-full text-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
          >
            View Profile
          </Link>
          {teacher.isExistingTeacher ? (
            <button className="w-full px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
              Book Class
            </button>
          ) : (
            <button className="w-full px-4 py-2 rounded-lg bg-[#F59E0B] text-[#1E293B] text-sm font-semibold hover:bg-amber-400 transition-colors shadow-sm">
              Book Trial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Filter Select ─── */
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
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

/* ─── Page ─── */
export default function BrowseTeachersPage() {
  const [subject,  setSubject]  = useState("All Subjects")
  const [grade,    setGrade]    = useState("All Grades")
  const [rating,   setRating]   = useState("All Ratings")
  const [avail,    setAvail]    = useState("Any Day")
  const [search,   setSearch]   = useState("")

  function clearFilters() {
    setSubject("All Subjects")
    setGrade("All Grades")
    setRating("All Ratings")
    setAvail("Any Day")
    setSearch("")
  }

  const hasFilters = subject !== "All Subjects" || grade !== "All Grades" || rating !== "All Ratings" || avail !== "Any Day" || search !== ""

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Browse Teachers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find the perfect tutor for your child</p>
      </div>

      {/* ── Filter Row ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input
              type="text"
              placeholder="Search by name or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <FilterSelect value={subject} onChange={setSubject} options={SUBJECT_OPTIONS} />
          <FilterSelect value={grade}   onChange={setGrade}   options={GRADE_OPTIONS}   />
          <FilterSelect value={rating}  onChange={setRating}  options={RATING_OPTIONS}  />
          <FilterSelect value={avail}   onChange={setAvail}   options={AVAIL_OPTIONS}   />

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

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              &quot;{search}&quot;
              <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {subject !== "All Subjects" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              {subject}
              <button onClick={() => setSubject("All Subjects")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {grade !== "All Grades" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              {grade}
              <button onClick={() => setGrade("All Grades")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {rating !== "All Ratings" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              <Star className="w-3 h-3" />{rating}
              <button onClick={() => setRating("All Ratings")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {avail !== "Any Day" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
              {avail}
              <button onClick={() => setAvail("Any Day")}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Teacher Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {TEACHERS.map((teacher) => (
          <TeacherGridCard key={teacher.id} teacher={teacher} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <p className="text-sm text-gray-500">Showing 9 of 124 teachers</p>
        <button className="px-8 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors">
          Load More
        </button>
      </div>
    </div>
  )
}
