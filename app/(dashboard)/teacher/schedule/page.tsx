"use client"

import React, { useState } from "react"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"

/* ─── Types ─── */
type Block = {
  id: string
  label: string
  sublabel: string
  startSlot: number  // index into TIME_SLOTS (0 = 8 AM)
  duration: number   // in slots (1 slot = 1 hr)
  dayIndex: number   // 0=Mon…6=Sun
  colorClass: string
  isTrial?: boolean
}

/* ─── Constants ─── */
const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DATES = ["10",  "11",  "12",  "13",  "14",  "15",  "16"]
const SLOT_H = 56  // px per hour slot

const TIME_SLOTS = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM",
  "4:00 PM","5:00 PM","6:00 PM",
]

/* ─── Class blocks for Dr. Ananya's schedule ─── */
const BLOCKS: Block[] = [
  // Monday Mar 10
  { id:"b1",  label:"Alex Smith",    sublabel:"Math G8",    startSlot:1, duration:1, dayIndex:0, colorClass:"bg-[#0D9488]/90 text-white border-teal-600"   },
  { id:"b2",  label:"Ryan Chen",     sublabel:"Math G6",    startSlot:2, duration:1, dayIndex:0, colorClass:"bg-[#0D9488]/90 text-white border-teal-600",   },
  { id:"b3",  label:"Priya Patel",   sublabel:"AP Calc",    startSlot:6, duration:1, dayIndex:0, colorClass:"bg-[#1E3A5F] text-white border-blue-800"       },
  { id:"b4",  label:"Noah Martinez", sublabel:"Math TRIAL", startSlot:8, duration:1, dayIndex:0, colorClass:"bg-[#F59E0B] text-[#1E293B] border-amber-600", isTrial:true },
  // Tuesday Mar 11
  { id:"b5",  label:"Alex Smith",    sublabel:"Math G8",    startSlot:1, duration:1, dayIndex:1, colorClass:"bg-[#0D9488]/90 text-white border-teal-600"   },
  { id:"b6",  label:"Aiden Brown",   sublabel:"AP Calc",    startSlot:3, duration:1, dayIndex:1, colorClass:"bg-[#1E3A5F] text-white border-blue-800"       },
  // Wednesday Mar 12
  { id:"b7",  label:"Alex Smith",    sublabel:"Math G8",    startSlot:1, duration:1, dayIndex:2, colorClass:"bg-[#0D9488]/90 text-white border-teal-600"   },
  { id:"b8",  label:"Ryan Chen",     sublabel:"Math G6",    startSlot:6, duration:1, dayIndex:2, colorClass:"bg-[#0D9488]/90 text-white border-teal-600"   },
  // Thursday Mar 13
  { id:"b9",  label:"Alex Smith",    sublabel:"Math G8",    startSlot:1, duration:1, dayIndex:3, colorClass:"bg-[#0D9488]/90 text-white border-teal-600"   },
  { id:"b10", label:"Priya Patel",   sublabel:"AP Calc",    startSlot:2, duration:1, dayIndex:3, colorClass:"bg-[#1E3A5F] text-white border-blue-800"       },
  // Friday Mar 14
  { id:"b11", label:"Ryan Chen",     sublabel:"Math G6",    startSlot:1, duration:1, dayIndex:4, colorClass:"bg-[#0D9488]/90 text-white border-teal-600"   },
  { id:"b12", label:"Maya Johnson",  sublabel:"SAT Prep",   startSlot:6, duration:1, dayIndex:4, colorClass:"bg-[#F59E0B] text-[#1E293B] border-amber-600" },
]

/* ─── Block component ─── */
function ClassBlock({ block }: { block: Block }) {
  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-2 py-1 shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${block.colorClass}`}
      style={{ top: `${block.startSlot * SLOT_H + 2}px`, height: `${block.duration * SLOT_H - 4}px` }}
    >
      <p className="text-[10px] font-bold leading-tight truncate">{block.label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <p className="text-[9px] opacity-80 truncate">{block.sublabel}</p>
        {block.isTrial && (
          <span className="flex-shrink-0 px-1 py-0.5 rounded bg-white/30 text-[8px] font-bold uppercase">
            TRIAL
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function TeacherSchedulePage() {
  const [view, setView] = useState<"day" | "week" | "month">("week")

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">My Schedule</h1>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* ── Week grid ── */}
      {view === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <h2 className="text-sm font-semibold text-[#1E293B]">Week of Mar 10–16, 2026</h2>
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button className="text-xs text-[#0D9488] font-medium hover:underline">Today</button>
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Day headers */}
              <div className="flex border-b border-gray-100">
                <div className="w-16 flex-shrink-0" />
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`flex-1 py-2 text-center border-l border-gray-100 ${i === 0 ? "bg-[#0D9488]/5" : ""}`}
                  >
                    <p className={`text-[11px] font-medium ${i === 0 ? "text-[#0D9488]" : "text-gray-400"}`}>{day}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <p className={`text-base font-bold ${i === 0 ? "text-[#0D9488]" : "text-[#1E293B]"}`}>{DATES[i]}</p>
                      {i === 0 && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#0D9488] text-white uppercase">Today</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time slots + blocks */}
              <div className="flex">
                {/* Time labels */}
                <div className="w-16 flex-shrink-0">
                  {TIME_SLOTS.map((t) => (
                    <div key={t} className="flex items-start justify-end pr-2 pt-1" style={{ height: SLOT_H }}>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{t}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day, dayIdx) => {
                  const dayBlocks = BLOCKS.filter((b) => b.dayIndex === dayIdx)
                  return (
                    <div
                      key={day}
                      className={`flex-1 relative border-l border-gray-100 ${dayIdx === 0 ? "bg-[#0D9488]/3" : ""}`}
                      style={{ height: TIME_SLOTS.length * SLOT_H }}
                    >
                      {TIME_SLOTS.map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-t border-gray-50"
                          style={{ top: i * SLOT_H }}
                        />
                      ))}
                      {dayBlocks.map((block) => (
                        <ClassBlock key={block.id} block={block} />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Placeholder for day / month ── */}
      {view !== "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {view.charAt(0).toUpperCase() + view.slice(1)} view coming soon.{" "}
            <button onClick={() => setView("week")} className="text-[#0D9488] font-medium hover:underline">
              Switch to Week
            </button>
          </p>
        </div>
      )}

      {/* ── Action row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-[#1E293B] hover:bg-gray-50 transition-colors">
          Reschedule Class
        </button>
        <button className="px-4 py-2 rounded-lg border border-[#EF4444] text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-colors">
          Cancel Class
        </button>
        <button className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          Mark Completed
        </button>
      </div>

      {/* ── Timezone info ── */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-4">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          All times shown in <strong>EST</strong> (your timezone: <strong>IST +10:30 ahead</strong>).
          Students see your availability converted to their local timezone (EST/CST/MST/PST).
          All class times are stored in UTC and displayed in each user&apos;s timezone.{" "}
          <strong>Cancellation limit: 3/month.</strong>
        </p>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-4 items-center">
        <span className="text-xs text-gray-500 font-medium">Legend:</span>
        {[
          { label: "Mathematics / General", cls: "bg-[#0D9488]/90 border-teal-600" },
          { label: "AP Calculus",           cls: "bg-[#1E3A5F] border-blue-800" },
          { label: "SAT Prep / Trial",      cls: "bg-[#F59E0B] border-amber-600" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-l-2 ${l.cls}`} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
