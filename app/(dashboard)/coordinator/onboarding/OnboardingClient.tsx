"use client"

import React, { useState, useMemo } from "react"
import { Info, Eye, Phone, Mail, UserCheck } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ConvertStudentModal } from "@/components/modals/ConvertStudentModal"

type OnboardingStudent = {
  id: string
  studentName: string
  parentName: string
  email: string
  phone: string
  grade: string
  subjects: string[]
  timezone: string
  status: string
  registered: string
  trialDate: string | null
  trialRating: number | null
}

type Counts = {
  total: number
  newLead: number
  trialScheduled: number
  trialCompleted: number
  converted: number
}

const TABS = [
  { key: "all", label: "All", countKey: "total" as const },
  { key: "new_lead", label: "New Leads", countKey: "newLead" as const },
  { key: "trial_scheduled", label: "Trial Scheduled", countKey: "trialScheduled" as const },
  { key: "trial_completed", label: "Trial Completed", countKey: "trialCompleted" as const },
  { key: "converted", label: "Converted", countKey: "converted" as const },
]

export function OnboardingClient({
  students,
  counts,
}: {
  students: OnboardingStudent[]
  counts: Counts
}) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [convertStudent, setConvertStudent] = useState<OnboardingStudent | null>(null)

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchTab = activeTab === "all" || s.status === activeTab
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.subjects.join(" ").toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [activeTab, search, students])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Student Onboarding</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage your student onboarding pipeline
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-0">
        {TABS.map((tab) => {
          const count = counts[tab.countKey]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#0D9488] text-[#0D9488]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && count > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? "bg-[#0D9488] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search students, parents, email…"
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Student", "Parent", "Email / Phone", "Grade", "Subjects", "Timezone", "Status", "Registered", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No students found.</td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1E293B]">{s.studentName}</p>
                    {s.trialDate && (
                      <p className="text-[10px] text-gray-400">
                        Trial: {s.trialDate}{s.trialRating ? ` · ${s.trialRating}★` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.parentName}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600 text-xs">{s.email}</p>
                    <p className="text-gray-400 text-xs">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.grade}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.subjects.map((sub) => (
                        <span key={sub} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">{sub}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.timezone}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} size="sm" /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{s.registered}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="View" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button title="Call" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button title="Email" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      {s.status !== "converted" && (
                        <button
                          title="Convert to Active Student"
                          onClick={() => setConvertStudent(s)}
                          className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Showing {filtered.length} of {students.length} students
        </div>
      </div>

      {/* Onboarding Workflow Info Card */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Onboarding Workflow</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li><span className="font-medium">New Lead</span> – Student registers on the platform. Contact the family within 24 hours.</li>
              <li><span className="font-medium">Trial Scheduled</span> – A trial class is booked with a suitable teacher. Confirm date/time with the family.</li>
              <li><span className="font-medium">Trial Completed</span> – Trial class done. Collect feedback and rating; follow up on conversion.</li>
              <li><span className="font-medium">Converted</span> – Student purchases a package and becomes an active student in your bucket.</li>
            </ol>
            <p className="text-xs text-blue-500 mt-3">
              Auto-assignment rule: New registrations are distributed to coordinators with available slots (bucket size &lt; 50). Students are sorted by registration date.
            </p>
          </div>
        </div>
      </div>

      {/* Convert Student Modal */}
      {convertStudent && (
        <ConvertStudentModal
          open={!!convertStudent}
          onClose={() => setConvertStudent(null)}
          onSuccess={() => window.location.reload()}
          studentId={convertStudent.id}
          studentName={convertStudent.studentName}
        />
      )}
    </div>
  )
}
