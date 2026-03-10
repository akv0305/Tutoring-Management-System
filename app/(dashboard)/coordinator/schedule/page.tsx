"use client"

import React, { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react"

/* ─── Types ─── */
type ClassBlock = {
  id: string
  student: string
  teacher: string
  subject: string
  subjectColor: string
  startHour: number   // 0-based index into TIME_SLOTS
  duration: number    // number of slots (each slot = 1 hr)
  dayIndex: number    // 0=Mon … 6=Sun
  isTrial?: boolean
  zoom?: string
}

/* ─── Constants ─── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DATES = ["10", "11", "12", "13", "14", "15", "16"]
const MONTH_YEAR = "March 2026"

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
]

/* ─── Hard-coded class blocks ─── */
const CLASS_BLOCKS: ClassBlock[] = [
  // Monday Mar 10
  { id: "c1", student: "Alex Smith",   teacher: "Dr. Ananya Sharma", subject: "Mathematics", subjectColor: "bg-teal-100 border-teal-400 text-teal-800",  startHour: 1, duration: 1, dayIndex: 0 },
  { id: "c2", student: "Maya Johnson", teacher: "Prof. Vikram Rao",   subject: "Physics",     subjectColor: "bg-blue-100 border-blue-400 text-blue-800",   startHour: 2, duration: 1, dayIndex: 0 },
  { id: "c3", student: "Ryan Chen",    teacher: "Dr. Ananya Sharma",  subject: "Mathematics", subjectColor: "bg-teal-100 border-teal-400 text-teal-800",  startHour: 6, duration: 1, dayIndex: 0 },
  { id: "c4", student: "Priya Patel",  teacher: "Mr. Suresh Iyer",    subject: "Chemistry",   subjectColor: "bg-purple-100 border-purple-400 text-purple-800", startHour: 8, duration: 1, dayIndex: 0 },
  // Tuesday Mar 11
  { id: "c5", student: "Emma Wilson",  teacher: "Mr. Suresh Iyer",    subject: "Science",     subjectColor: "bg-emerald-100 border-emerald-400 text-emerald-800", startHour: 8, duration: 1, dayIndex: 1, isTrial: true },
  { id: "c6", student: "Ethan Williams", teacher: "Ms. Deepika Nair", subject: "English",    subjectColor: "bg-amber-100 border-amber-400 text-amber-800",  startHour: 3, duration: 1, dayIndex: 1 },
  // Wednesday Mar 12
  { id: "c7", student: "Aiden Brown",  teacher: "Prof. Vikram Rao",   subject: "ACT Prep",    subjectColor: "bg-orange-100 border-orange-400 text-orange-800", startHour: 7, duration: 1, dayIndex: 2, isTrial: true },
  { id: "c8", student: "Alex Smith",   teacher: "Dr. Ananya Sharma",  subject: "Mathematics", subjectColor: "bg-teal-100 border-teal-400 text-teal-800",  startHour: 1, duration: 1, dayIndex: 2 },
  // Thursday Mar 13
  { id: "c9",  student: "Maya Johnson", teacher: "Prof. Vikram Rao",  subject: "Physics",     subjectColor: "bg-blue-100 border-blue-400 text-blue-800",   startHour: 2, duration: 1, dayIndex: 3 },
  { id: "c10", student: "Priya Patel",  teacher: "Mr. Suresh Iyer",   subject: "Chemistry",   subjectColor: "bg-purple-100 border-purple-400 text-purple-800", startHour: 5, duration: 1, dayIndex: 3 },
  // Friday Mar 14
  { id: "c11", student: "Ryan Chen",   teacher: "Dr. Ananya Sharma",  subject: "Mathematics", subjectColor: "bg-teal-100 border-teal-400 text-teal-800",  startHour: 6, duration: 1, dayIndex: 4 },
  { id: "c12", student: "Ethan Williams", teacher: "Ms. Deepika Nair", subject: "English",   subjectColor: "bg-amber-100 border-amber-400 text-amber-800",  startHour: 9, duration: 1, dayIndex: 4 },
  // Saturday Mar 15
  { id: "c13", student: "Noah Martinez", teacher: "Dr. Ananya Sharma", subject: "Mathematics",subjectColor: "bg-teal-100 border-teal-400 text-teal-800",  startHour: 2, duration: 1, dayIndex: 5 },
]

/* ─── Single class block cell ─── */
function Block({ block }: { block: ClassBlock }) {
  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 text-[10px] leading-tight shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${block.subjectColor}`}
      style={{ top: `${block.startHour * 52}px`, height: `${block.duration * 50}px` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold truncate">{block.subject}</span>
        {block.isTrial && (
          <span className="flex-shrink-0 px-1 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold uppercase">Trial</span>
        )}
      </div>
      <div className="truncate text-[9px] mt-0.5 opacity-80">{block.student}</div>
      <div className="truncate text-[9px] opacity-70">{block.teacher.split(" ").slice(-1)[0]}</div>
    </div>
  )
}

/* ─── Page ─── */
export default function SchedulePage() {
  const [view, setView] = useState<"day" | "week" | "month">("week")

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and view all classes for your students</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 capitalize transition-colors ${
                  view === v
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {/* Schedule on behalf */}
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <Users className="w-4 h-4" />
            Schedule on Behalf of Student
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E3A5F] text-[#1E3A5F] text-sm font-medium hover:bg-[#1E3A5F]/5 transition-colors">
            <Plus className="w-4 h-4" />
            New Class
          </button>
        </div>
      </div>

      {/* ── Week Calendar ── */}
      {view === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h2 className="text-base font-semibold text-[#1E293B]">
                Week of {DAYS[0]}, {MONTH_YEAR.split(" ")[0]} {DATES[0]} – {DATES[6]}
              </h2>
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <button className="text-sm text-[#0D9488] font-medium hover:underline">Today</button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Day headers */}
              <div className="flex border-b border-gray-100">
                <div className="w-20 flex-shrink-0" />
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`flex-1 text-center py-3 border-l border-gray-100 ${
                      i === 0 ? "bg-[#1E3A5F]/5" : ""
                    }`}
                  >
                    <p className={`text-xs font-medium ${i === 0 ? "text-[#1E3A5F]" : "text-gray-500"}`}>{day}</p>
                    <p className={`text-lg font-bold mt-0.5 ${i === 0 ? "text-[#1E3A5F]" : "text-[#1E293B]"}`}>
                      {DATES[i]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time rows + blocks */}
              <div className="flex">
                {/* Time labels */}
                <div className="w-20 flex-shrink-0">
                  {TIME_SLOTS.map((t) => (
                    <div key={t} className="h-[52px] flex items-start justify-end pr-3 pt-1">
                      <span className="text-[10px] text-gray-400">{t}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day, dayIdx) => {
                  const blocksForDay = CLASS_BLOCKS.filter((b) => b.dayIndex === dayIdx)
                  return (
                    <div
                      key={day}
                      className="flex-1 relative border-l border-gray-100"
                      style={{ height: `${TIME_SLOTS.length * 52}px` }}
                    >
                      {/* Hour lines */}
                      {TIME_SLOTS.map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-t border-gray-50"
                          style={{ top: `${i * 52}px` }}
                        />
                      ))}
                      {/* Class blocks */}
                      {blocksForDay.map((block) => (
                        <Block key={block.id} block={block} />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Day / Month placeholder ── */}
      {view !== "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {view === "day" ? "Day" : "Month"} view coming soon. Switch to{" "}
            <button onClick={() => setView("week")} className="text-[#0D9488] font-medium hover:underline">
              Week view
            </button>{" "}
            to see classes.
          </p>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-xs text-gray-500 font-medium">Legend:</span>
        {[
          { label: "Mathematics", cls: "bg-teal-100 border-teal-400" },
          { label: "Physics",     cls: "bg-blue-100 border-blue-400" },
          { label: "Chemistry",   cls: "bg-purple-100 border-purple-400" },
          { label: "English",     cls: "bg-amber-100 border-amber-400" },
          { label: "Science",     cls: "bg-emerald-100 border-emerald-400" },
          { label: "ACT Prep",    cls: "bg-orange-100 border-orange-400" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-l-2 ${l.cls}`} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold">TRIAL</span>
          <span className="text-xs text-gray-600">Trial class</span>
        </div>
      </div>
    </div>
  )
}
