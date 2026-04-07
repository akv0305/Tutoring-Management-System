"use client"

import React, { useState } from "react"
import { Calendar, Lock, Save, AlertCircle, TrendingUp } from "lucide-react"

/* ─── Types ─── */
type ClassStat = {
  month: string
  scheduled: number
  completed: number
  cancelled: number
  noShow: number
  rate: string
}

type ActiveStudent = {
  name: string
  subject: string
  classesLeft: number
  teacher: string
}

type AttentionStudent = {
  name: string
  issue: string
  color: string
}

type BucketSummary = {
  total: number
  active: number
  trial: number
  trialScheduled: number
  inactive: number
  converted: number
  conversionRate: string
}

type Note = { id: string; text: string; date: string; author: string }

export type ReportsData = {
  coordinatorName: string
  bucket: BucketSummary
  classStats: ClassStat[]
  activeStudents: ActiveStudent[]
  attentionStudents: AttentionStudent[]
}

/* ─── Stat Box ─── */
function StatBox({
  label,
  value,
  sublabel,
  valueColor = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  sublabel?: string
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
      {sublabel && (
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}

/* ─── Page ─── */
export function CoordinatorReportsClient({ data }: { data: ReportsData }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")

  function handleSaveNote() {
    if (!newNote.trim()) return
    const now = new Date()
    const note: Note = {
      id: `n${Date.now()}`,
      text: newNote.trim(),
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      author: data.coordinatorName,
    }
    setNotes([note, ...notes])
    setNewNote("")
  }

  /* Totals row for class stats */
  const totals = data.classStats.reduce(
    (acc, r) => ({
      scheduled: acc.scheduled + r.scheduled,
      completed: acc.completed + r.completed,
      cancelled: acc.cancelled + r.cancelled,
      noShow: acc.noShow + r.noShow,
    }),
    { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 }
  )
  const totalRate =
    totals.scheduled > 0
      ? ((totals.completed / totals.scheduled) * 100).toFixed(1) + "%"
      : "0%"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bucket performance and student activity overview
          </p>
        </div>
      </div>

      {/* Bucket Summary */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Bucket Summary
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatBox
            label="Active Students"
            value={data.bucket.active}
            sublabel={`of ${data.bucket.total} total`}
            valueColor="text-[#22C55E]"
          />
          <StatBox
            label="Trial Phase"
            value={data.bucket.trial}
            sublabel={`${data.bucket.trialScheduled} trials scheduled`}
            valueColor="text-[#F59E0B]"
          />
          <StatBox
            label="Inactive"
            value={data.bucket.inactive}
            sublabel="Need follow-up"
            valueColor="text-gray-400"
          />
          <StatBox
            label="Conversion Rate"
            value={data.bucket.conversionRate}
            sublabel="Trial → Package"
            valueColor="text-[#0D9488]"
          />
        </div>
      </section>

      {/* Class Statistics */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#0D9488]" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Class Statistics
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Month",
                    "Scheduled",
                    "Completed",
                    "Cancelled",
                    "No-Show",
                    "Completion Rate",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.classStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-400 text-sm"
                    >
                      No class data available yet.
                    </td>
                  </tr>
                ) : (
                  <>
                    {data.classStats.map((row) => (
                      <tr
                        key={row.month}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#1E293B]">
                          {row.month}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {row.scheduled}
                        </td>
                        <td className="px-4 py-3 text-[#22C55E] font-semibold">
                          {row.completed}
                        </td>
                        <td className="px-4 py-3 text-[#F97316]">
                          {row.cancelled}
                        </td>
                        <td className="px-4 py-3 text-[#EF4444]">
                          {row.noShow}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#0D9488]"
                                style={{ width: row.rate }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#0D9488]">
                              {row.rate}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="bg-[#1E3A5F]/5 border-t-2 border-[#1E3A5F]/10">
                      <td className="px-4 py-3 font-bold text-[#1E293B]">
                        Total
                      </td>
                      <td className="px-4 py-3 font-bold text-[#1E293B]">
                        {totals.scheduled}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#22C55E]">
                        {totals.completed}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#F97316]">
                        {totals.cancelled}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#EF4444]">
                        {totals.noShow}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#0D9488]">
                        {totalRate}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Student Activity */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Student Activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
              Active Students
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({data.activeStudents.length})
              </span>
            </h3>
            <div className="space-y-3">
              {data.activeStudents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No active students.
                </p>
              ) : (
                data.activeStudents.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-xs font-bold text-[#0D9488]">
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.subject} · {s.teacher}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        s.classesLeft <= 2
                          ? "bg-red-50 text-red-600"
                          : s.classesLeft <= 4
                          ? "bg-amber-50 text-amber-600"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {s.classesLeft} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Needs Attention
              <span className="ml-1 text-xs font-normal text-gray-400">
                ({data.attentionStudents.length})
              </span>
            </h3>
            <div className="space-y-3">
              {data.attentionStudents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  All good! No students need attention.
                </p>
              ) : (
                data.attentionStudents.map((s, idx) => (
                  <div
                    key={`${s.name}-${idx}`}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${s.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <p className="text-sm font-medium">{s.name}</p>
                    </div>
                    <span className="text-xs font-semibold">{s.issue}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Internal Notes */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Internal Notes
          </h2>
          <span className="text-xs text-gray-400">
            (visible to coordinator and admin only)
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              placeholder="Add an internal note about a student, teacher, or situation…"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNote}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#1E3A5F]/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Note
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 border-t border-gray-100">
              No notes yet. Add one above.
            </p>
          ) : (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg bg-gray-50 border border-gray-100 p-4"
                >
                  <p className="text-sm text-[#1E293B] leading-relaxed">
                    {note.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {note.author}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
