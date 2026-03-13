"use client"

import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react"
import { BookClassModal } from "@/components/modals/BookClassModal"

type ClassBlock = {
  id: string
  student: string
  teacher: string
  subject: string
  subjectColor: string
  startHour: number
  duration: number
  dayIndex: number
  isTrial: boolean
  status: string
}

type LegendItem = { label: string; cls: string }

type Student = { id: string; name: string }
type Teacher = { id: string; name: string; subjects: { id: string; name: string }[] }
type PackageOption = { id: string; label: string; remaining: number; subjectId: string; teacherId: string }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_SLOTS = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM",
  "4:00 PM","5:00 PM","6:00 PM","7:00 PM",
]

function Block({ block }: { block: ClassBlock }) {
  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 text-[10px] leading-tight shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${block.subjectColor}`}
      style={{ top: `${block.startHour * 52}px`, height: `${block.duration * 50}px` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold truncate">{block.subject}</span>
        {block.isTrial && (
          <span className="flex-shrink-0 px-1 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold uppercase">
            Trial
          </span>
        )}
      </div>
      <div className="truncate text-[9px] mt-0.5 opacity-80">{block.student}</div>
      <div className="truncate text-[9px] opacity-70">
        {block.teacher.split(" ").slice(-1)[0]}
      </div>
    </div>
  )
}

export function CoordinatorScheduleClient({
  classBlocks,
  dates,
  monthYear,
  legend,
  hasTrial,
}: {
  classBlocks: ClassBlock[]
  dates: string[]
  monthYear: string
  legend: LegendItem[]
  hasTrial: boolean
}) {
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookingData, setBookingData] = useState<{
    students: Student[]
    teachers: Teacher[]
    packages: PackageOption[]
  } | null>(null)

  const todayJs = new Date().getDay()
  const todayIdx = todayJs === 0 ? 6 : todayJs - 1

  // Fetch booking dropdown data when modal opens
  useEffect(() => {
    if (showBookModal && !bookingData) {
      fetch("/api/classes/booking-data")
        .then((r) => r.json())
        .then((d) => setBookingData(d))
        .catch(() => {})
    }
  }, [showBookModal, bookingData])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and view all classes for your students
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 capitalize transition-colors ${
                  view === v ? "bg-[#1E3A5F] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            Schedule on Behalf of Student
          </button>
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E3A5F] text-[#1E3A5F] text-sm font-medium hover:bg-[#1E3A5F]/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Class
          </button>
        </div>
      </div>

      {/* Week Calendar */}
      {view === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h2 className="text-base font-semibold text-[#1E293B]">
                Week of Mon, {monthYear.split(" ")[0]} {dates[0]} – {dates[6]}
              </h2>
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <button className="text-sm text-[#0D9488] font-medium hover:underline">Today</button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="flex border-b border-gray-100">
                <div className="w-20 flex-shrink-0" />
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`flex-1 text-center py-3 border-l border-gray-100 ${i === todayIdx ? "bg-[#1E3A5F]/5" : ""}`}
                  >
                    <p className={`text-xs font-medium ${i === todayIdx ? "text-[#1E3A5F]" : "text-gray-500"}`}>{day}</p>
                    <p className={`text-lg font-bold mt-0.5 ${i === todayIdx ? "text-[#1E3A5F]" : "text-[#1E293B]"}`}>{dates[i]}</p>
                  </div>
                ))}
              </div>

              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  {TIME_SLOTS.map((t) => (
                    <div key={t} className="h-[52px] flex items-start justify-end pr-3 pt-1">
                      <span className="text-[10px] text-gray-400">{t}</span>
                    </div>
                  ))}
                </div>
                {DAYS.map((day, dayIdx) => {
                  const blocksForDay = classBlocks.filter((b) => b.dayIndex === dayIdx)
                  return (
                    <div
                      key={day}
                      className={`flex-1 relative border-l border-gray-100 ${dayIdx === todayIdx ? "bg-[#1E3A5F]/[0.02]" : ""}`}
                      style={{ height: `${TIME_SLOTS.length * 52}px` }}
                    >
                      {TIME_SLOTS.map((_, i) => (
                        <div key={i} className="absolute left-0 right-0 border-t border-gray-50" style={{ top: `${i * 52}px` }} />
                      ))}
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-xs text-gray-500 font-medium">Legend:</span>
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-l-2 ${l.cls}`} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
        {hasTrial && (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold">TRIAL</span>
            <span className="text-xs text-gray-600">Trial class</span>
          </div>
        )}
      </div>

      {/* Book Class Modal */}
      {bookingData && (
        <BookClassModal
          open={showBookModal}
          onClose={() => setShowBookModal(false)}
          onSuccess={() => window.location.reload()}
          role="COORDINATOR"
          students={bookingData.students}
          teachers={bookingData.teachers}
          packages={bookingData.packages}
        />
      )}
    </div>
  )
}
