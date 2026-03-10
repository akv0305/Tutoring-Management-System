"use client"

import React, { useState, useMemo } from "react"
import { Info, Eye, Phone, Mail, UserCheck } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Types ─── */
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
}

/* ─── Data ─── */
const STUDENTS: OnboardingStudent[] = [
  {
    id: "OB001",
    studentName: "Sophia Lee",
    parentName: "Janet Lee",
    email: "janet.lee@email.com",
    phone: "+1 (555) 201-4321",
    grade: "Grade 7",
    subjects: ["Math", "Coding"],
    timezone: "EST",
    status: "new_lead",
    registered: "Mar 8, 2026",
  },
  {
    id: "OB002",
    studentName: "Olivia Davis",
    parentName: "Mark Davis",
    email: "mark.davis@email.com",
    phone: "+1 (555) 202-8765",
    grade: "Grade 5",
    subjects: ["Reading", "Math"],
    timezone: "CST",
    status: "new_lead",
    registered: "Mar 9, 2026",
  },
  {
    id: "OB003",
    studentName: "Aiden Brown",
    parentName: "Maria Brown",
    email: "maria.brown@email.com",
    phone: "+1 (555) 203-1122",
    grade: "Grade 12",
    subjects: ["ACT Prep"],
    timezone: "EST",
    status: "trial_scheduled",
    registered: "Mar 5, 2026",
  },
  {
    id: "OB004",
    studentName: "Emma Wilson",
    parentName: "Kate Wilson",
    email: "kate.wilson@email.com",
    phone: "+1 (555) 204-3344",
    grade: "Grade 9",
    subjects: ["Science"],
    timezone: "PST",
    status: "trial_scheduled",
    registered: "Mar 6, 2026",
  },
  {
    id: "OB005",
    studentName: "Noah Martinez",
    parentName: "Carlos Martinez",
    email: "carlos.m@email.com",
    phone: "+1 (555) 205-5566",
    grade: "Grade 10",
    subjects: ["Math"],
    timezone: "EST",
    status: "trial_completed",
    registered: "Mar 1, 2026",
  },
  {
    id: "OB006",
    studentName: "Isabella Clark",
    parentName: "Susan Clark",
    email: "susan.clark@email.com",
    phone: "+1 (555) 206-7788",
    grade: "Grade 8",
    subjects: ["English", "History"],
    timezone: "MST",
    status: "converted",
    registered: "Feb 25, 2026",
  },
]

/* ─── Tab config ─── */
const TABS = [
  { key: "all",              label: "All",             badge: null },
  { key: "new_lead",         label: "New Leads",       badge: 2 },
  { key: "trial_scheduled",  label: "Trial Scheduled", badge: 2 },
  { key: "trial_completed",  label: "Trial Completed", badge: 1 },
  { key: "converted",        label: "Converted",       badge: null },
] as const

/* ─── Page ─── */
export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return STUDENTS.filter((s) => {
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
  }, [activeTab, search])

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Student Onboarding</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage your student onboarding pipeline</p>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-0">
        {TABS.map((tab) => (
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
            {tab.badge !== null && (
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-[#0D9488] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search students, parents, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Student", "Parent", "Email / Phone", "Grade", "Subjects", "Timezone", "Status", "Registered", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">
                    No students found.
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1E293B]">{s.studentName}</p>
                    <p className="text-[10px] text-gray-400">{s.id}</p>
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
                        <span key={sub} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.timezone}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
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
                      {(s.status === "trial_completed") && (
                        <button title="Convert" className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors">
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
        {/* Footer row count */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Showing {filtered.length} of {STUDENTS.length} students
        </div>
      </div>

      {/* ── Onboarding Workflow Info Card ── */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Onboarding Workflow</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>
                <span className="font-medium">New Lead</span> – Student registers on the platform. Contact the family within 24 hours.
              </li>
              <li>
                <span className="font-medium">Trial Scheduled</span> – A trial class is booked with a suitable teacher. Confirm date/time with the family.
              </li>
              <li>
                <span className="font-medium">Trial Completed</span> – Trial class done. Collect feedback and rating; follow up on conversion.
              </li>
              <li>
                <span className="font-medium">Converted</span> – Student purchases a package and becomes an active student in your bucket.
              </li>
            </ol>
            <p className="text-xs text-blue-500 mt-3">
              Auto-assignment rule: New registrations are distributed to coordinators with available slots (bucket size &lt; 50). Students are sorted by registration date.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
