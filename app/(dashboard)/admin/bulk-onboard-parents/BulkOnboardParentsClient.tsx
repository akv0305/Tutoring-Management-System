"use client"

import React, { useState } from "react"
import {
  Upload,
  Plus,
  Trash2,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

type Subject = { id: string; name: string }
type Coordinator = { id: string; name: string }

type StudentEntry = {
  firstName: string
  lastName: string
  grade: string
  subjects: string[]
}

type ParentEntry = {
  firstName: string
  lastName: string
  email: string
  phone: string
  timezone: string
  coordinatorId: string
  students: StudentEntry[]
  expanded: boolean
}

type ResultRow = {
  row: number
  email: string
  name: string
  status: "created" | "skipped" | "error"
  message: string
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
]

const EMPTY_STUDENT: StudentEntry = {
  firstName: "",
  lastName: "",
  grade: "",
  subjects: [],
}

const EMPTY_PARENT: ParentEntry = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  timezone: "America/New_York",
  coordinatorId: "",
  students: [{ ...EMPTY_STUDENT }],
  expanded: true,
}

export default function BulkOnboardParentsClient({
  subjects,
  coordinators,
}: {
  subjects: Subject[]
  coordinators: Coordinator[]
}) {
  const [rows, setRows] = useState<ParentEntry[]>([{ ...EMPTY_PARENT, students: [{ ...EMPTY_STUDENT }] }])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ResultRow[] | null>(null)
  const [summary, setSummary] = useState<{
    total: number
    created: number
    skipped: number
    errors: number
  } | null>(null)

  // ── Parent field update ──
  function updateParent(idx: number, field: keyof ParentEntry, value: any) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    )
  }

  // ── Student field update ──
  function updateStudent(
    parentIdx: number,
    studentIdx: number,
    field: keyof StudentEntry,
    value: any
  ) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === parentIdx
          ? {
              ...r,
              students: r.students.map((s, j) =>
                j === studentIdx ? { ...s, [field]: value } : s
              ),
            }
          : r
      )
    )
  }

  // ── Toggle subject for a student ──
  function toggleSubject(
    parentIdx: number,
    studentIdx: number,
    subjectName: string
  ) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === parentIdx
          ? {
              ...r,
              students: r.students.map((s, j) =>
                j === studentIdx
                  ? {
                      ...s,
                      subjects: s.subjects.includes(subjectName)
                        ? s.subjects.filter((x) => x !== subjectName)
                        : [...s.subjects, subjectName],
                    }
                  : s
              ),
            }
          : r
      )
    )
  }

  function addParent() {
    setRows((prev) => [
      ...prev,
      { ...EMPTY_PARENT, students: [{ ...EMPTY_STUDENT }], expanded: true },
    ])
  }

  function removeParent(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  function addStudent(parentIdx: number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === parentIdx
          ? { ...r, students: [...r.students, { ...EMPTY_STUDENT }] }
          : r
      )
    )
  }

  function removeStudent(parentIdx: number, studentIdx: number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === parentIdx
          ? { ...r, students: r.students.filter((_, j) => j !== studentIdx) }
          : r
      )
    )
  }

  function toggleExpand(idx: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, expanded: !r.expanded } : r))
    )
  }

  // ── CSV Template Download ──
  function downloadTemplate() {
    const headers =
      "ParentFirstName,ParentLastName,ParentEmail,ParentPhone,Timezone,CoordinatorName,StudentFirstName,StudentLastName,Grade,Subjects(semicolon-separated)"
    const sample =
      'John,Doe,john@example.com,+1234567890,America/New_York,Jane Coordinator,Alex,Doe,Grade 5,Math;English'
    const blob = new Blob([headers + "\n" + sample], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "parent_onboard_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── CSV Upload ──
  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
      if (lines.length < 2) return alert("CSV must have a header + at least 1 row.")

      // Group by parent email
      const parentMap = new Map<string, ParentEntry>()

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim())
        if (cols.length < 9) continue

        const [
          pFirst,
          pLast,
          pEmail,
          pPhone,
          tz,
          coordName,
          sFirst,
          sLast,
          grade,
          subjectsRaw,
        ] = cols

        const email = pEmail.toLowerCase()
        const coordMatch = coordinators.find(
          (c) => c.name.toLowerCase() === coordName?.toLowerCase()
        )

        if (!parentMap.has(email)) {
          parentMap.set(email, {
            firstName: pFirst,
            lastName: pLast,
            email,
            phone: pPhone || "",
            timezone: tz || "America/New_York",
            coordinatorId: coordMatch?.id || "",
            students: [],
            expanded: false,
          })
        }

        const parent = parentMap.get(email)!
        parent.students.push({
          firstName: sFirst,
          lastName: sLast,
          grade,
          subjects: subjectsRaw
            ? subjectsRaw.split(";").map((s) => s.trim()).filter(Boolean)
            : [],
        })
      }

      setRows(Array.from(parentMap.values()))
      setResults(null)
      setSummary(null)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  // ── Validation ──
  function validate(): boolean {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.firstName.trim() || !r.lastName.trim() || !r.email.trim()) {
        alert(`Row ${i + 1}: Parent first name, last name and email are required.`)
        return false
      }
      if (r.students.length === 0) {
        alert(`Row ${i + 1}: At least one student is required.`)
        return false
      }
      for (let j = 0; j < r.students.length; j++) {
        const s = r.students[j]
        if (!s.firstName.trim() || !s.lastName.trim() || !s.grade.trim()) {
          alert(
            `Row ${i + 1}, Student ${j + 1}: first name, last name and grade are required.`
          )
          return false
        }
      }
    }
    return true
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    setResults(null)
    setSummary(null)

    try {
      const payload = rows.map((r) => ({
        firstName: r.firstName.trim(),
        lastName: r.lastName.trim(),
        email: r.email.trim(),
        phone: r.phone.trim() || undefined,
        timezone: r.timezone,
        coordinatorId: r.coordinatorId || undefined,
        students: r.students.map((s) => ({
          firstName: s.firstName.trim(),
          lastName: s.lastName.trim(),
          grade: s.grade.trim(),
          subjects: s.subjects.length > 0 ? s.subjects : undefined,
        })),
      }))

      const res = await fetch("/api/parents/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parents: payload }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.results)
        setSummary(data.summary)
      } else {
        alert(data.error || "Failed to process bulk onboarding.")
      }
    } catch {
      alert("Network error")
    } finally {
      setLoading(false)
    }
  }

  // ── Results view ──
  if (results && summary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Bulk Onboard — Results
        </h1>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-green-600">Created</p>
            <p className="text-2xl font-bold text-green-700">
              {summary.created}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-amber-600">Skipped</p>
            <p className="text-2xl font-bold text-amber-700">
              {summary.skipped}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-red-600">Errors</p>
            <p className="text-2xl font-bold text-red-700">
              {summary.errors}
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Row
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.row} className="border-t">
                  <td className="px-4 py-2">{r.row}</td>
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-gray-500">{r.email}</td>
                  <td className="px-4 py-2">
                    {r.status === "created" && (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Created
                      </span>
                    )}
                    {r.status === "skipped" && (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" /> Skipped
                      </span>
                    )}
                    {r.status === "error" && (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        <XCircle className="w-3 h-3" /> Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {r.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => {
            setResults(null)
            setSummary(null)
            setRows([{ ...EMPTY_PARENT, students: [{ ...EMPTY_STUDENT }] }])
          }}
          className="px-5 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#15304F] transition-colors"
        >
          Onboard More Parents
        </button>
      </div>
    )
  }

  // ── Form view ──
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Bulk Onboard Parents & Students
        </h1>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV Template
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#15304F] transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((parent, pIdx) => (
          <div
            key={pIdx}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Parent header bar */}
            <div
              className="flex items-center justify-between px-5 py-3 bg-gray-50 cursor-pointer"
              onClick={() => toggleExpand(pIdx)}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-[#1E3A5F]" />
                <span className="text-sm font-semibold text-[#1E293B]">
                  {parent.firstName && parent.lastName
                    ? `${parent.firstName} ${parent.lastName}`
                    : `Parent ${pIdx + 1}`}
                  {parent.email && (
                    <span className="text-gray-400 font-normal ml-2">
                      ({parent.email})
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {parent.students.length} student(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {rows.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeParent(pIdx)
                    }}
                    className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors"
                    title="Remove parent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {parent.expanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded content */}
            {parent.expanded && (
              <div className="px-5 py-4 space-y-4">
                {/* Parent fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={parent.firstName}
                      onChange={(e) =>
                        updateParent(pIdx, "firstName", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={parent.lastName}
                      onChange={(e) =>
                        updateParent(pIdx, "lastName", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={parent.email}
                      onChange={(e) =>
                        updateParent(pIdx, "email", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Phone
                    </label>
                    <input
                      value={parent.phone}
                      onChange={(e) =>
                        updateParent(pIdx, "phone", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Timezone
                    </label>
                    <select
                      value={parent.timezone}
                      onChange={(e) =>
                        updateParent(pIdx, "timezone", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Coordinator
                    </label>
                    <select
                      value={parent.coordinatorId}
                      onChange={(e) =>
                        updateParent(pIdx, "coordinatorId", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="">— None —</option>
                      {coordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Students */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1E293B]">
                      Students (Children)
                    </h3>
                    <button
                      onClick={() => addStudent(pIdx)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Student
                    </button>
                  </div>

                  {parent.students.map((student, sIdx) => (
                    <div
                      key={sIdx}
                      className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">
                          Student {sIdx + 1}
                        </span>
                        {parent.students.length > 1 && (
                          <button
                            onClick={() => removeStudent(pIdx, sIdx)}
                            className="p-1 rounded text-red-400 hover:bg-red-50 text-xs"
                            title="Remove student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={student.firstName}
                            onChange={(e) =>
                              updateStudent(
                                pIdx,
                                sIdx,
                                "firstName",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={student.lastName}
                            onChange={(e) =>
                              updateStudent(
                                pIdx,
                                sIdx,
                                "lastName",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Grade <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={student.grade}
                            onChange={(e) =>
                              updateStudent(
                                pIdx,
                                sIdx,
                                "grade",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Grade 5"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Subjects
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {subjects.map((sub) => (
                            <label
                              key={sub.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
                                student.subjects.includes(sub.name)
                                  ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={student.subjects.includes(sub.name)}
                                onChange={() =>
                                  toggleSubject(pIdx, sIdx, sub.name)
                                }
                              />
                              {sub.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <button
          onClick={addParent}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Another Parent
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {rows.length} parent(s),{" "}
            {rows.reduce((s, r) => s + r.students.length, 0)} student(s)
          </span>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#15304F] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit All
          </button>
        </div>
      </div>
    </div>
  )
}
