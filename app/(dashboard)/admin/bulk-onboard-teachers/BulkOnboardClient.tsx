"use client"

import { useState, useRef, useCallback, useEffect  } from "react"
import { createPortal } from "react-dom"
import {
  Upload,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  UserPlus,
  ChevronDown,
} from "lucide-react"

type Subject = { id: string; name: string; category: string }

interface TeacherRow {
  firstName: string
  lastName: string
  email: string
  phone: string
  qualification: string
  bio: string
  experience: string
  compensationRate: string
  studentFacingRate: string
  subjects: string[]
  timezone: string
}

interface ResultRow {
  row: number
  email: string
  name: string
  status: "created" | "skipped" | "error"
  message: string
}

interface ApiResponse {
  message: string
  summary: { total: number; created: number; skipped: number; errors: number }
  results: ResultRow[]
}

const EMPTY_ROW: TeacherRow = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  qualification: "",
  bio: "",
  experience: "",
  compensationRate: "",
  studentFacingRate: "",
  subjects: [],
  timezone: "America/New_York",
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
]

export default function BulkOnboardClient({ subjects }: { subjects: Subject[] }) {
  const [mode, setMode] = useState<"excel" | "form">("excel")
  const [rows, setRows] = useState<TeacherRow[]>([{ ...EMPTY_ROW }])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ApiResponse | null>(null)
  const [parseError, setParseError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // ---------- Excel / CSV parsing ----------
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setParseError("")
      setResults(null)
      const file = e.target.files?.[0]
      if (!file) return

      const isCSV = file.name.endsWith(".csv")
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")

      if (!isCSV && !isExcel) {
        setParseError("Please upload a .csv or .xlsx file.")
        return
      }

      try {
        if (isCSV) {
          const text = await file.text()
          const parsed = parseCSV(text)
          if (parsed.length === 0) {
            setParseError("No valid rows found. Check the CSV format and column headers.")
            return
          }
          setRows(parsed)
          setMode("form") // Switch to form view to review
        } else {
          // For Excel, we need to read it client-side with a lightweight parser
          // Using a simple approach: read as ArrayBuffer and parse
          setParseError(
            "For Excel (.xlsx), please save as CSV first, then upload. CSV is the recommended format."
          )
        }
      } catch (err) {
        console.error("File parse error:", err)
        setParseError("Failed to parse the file. Check the format.")
      }

      // Reset file input
      if (fileRef.current) fileRef.current.value = ""
    },
    []
  )

  function parseCSV(text: string): TeacherRow[] {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return [] // Need header + at least 1 row

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""))

    // Map header names to expected fields (flexible matching)
    const headerMap: Record<string, string> = {}
    const fieldAliases: Record<string, string[]> = {
      firstName: ["firstname", "first_name", "first"],
      lastName: ["lastname", "last_name", "last"],
      email: ["email", "emailaddress", "email_address"],
      phone: ["phone", "phonenumber", "phone_number", "mobile"],
      qualification: ["qualification", "qualifications", "degree"],
      bio: ["bio", "biography", "about"],
      experience: ["experience", "years", "yearsexperience", "years_experience", "exp"],
      compensationRate: ["compensationrate", "compensation_rate", "compensation", "comprate", "comp_rate"],
      studentFacingRate: ["studentfacingrate", "student_facing_rate", "studentrate", "student_rate", "hourlyrate", "hourly_rate", "rate"],
      subjects: ["subjects", "subject", "subjectnames", "subject_names"],
      timezone: ["timezone", "time_zone", "tz"],
    }

    for (const [field, aliases] of Object.entries(fieldAliases)) {
      const idx = headers.findIndex((h) => aliases.includes(h))
      if (idx !== -1) headerMap[field] = headers[idx]
    }

    // Must have at least firstName, lastName, email
    if (!headerMap.firstName || !headerMap.lastName || !headerMap.email) {
      return []
    }

    const parsed: TeacherRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0) continue

      const getVal = (field: string) => {
        const header = headerMap[field]
        if (!header) return ""
        const idx = headers.indexOf(header)
        return idx >= 0 && idx < values.length ? values[idx].trim() : ""
      }

      const subjectsRaw = getVal("subjects")
      const subjectsList = subjectsRaw
        ? subjectsRaw.split(";").map((s) => s.trim()).filter(Boolean)
        : []

      const row: TeacherRow = {
        firstName: getVal("firstName"),
        lastName: getVal("lastName"),
        email: getVal("email"),
        phone: getVal("phone"),
        qualification: getVal("qualification"),
        bio: getVal("bio"),
        experience: getVal("experience"),
        compensationRate: getVal("compensationRate"),
        studentFacingRate: getVal("studentFacingRate"),
        subjects: subjectsList,
        timezone: getVal("timezone") || "America/New_York",
      }

      // Skip completely empty rows
      if (row.firstName || row.lastName || row.email) {
        parsed.push(row)
      }
    }

    return parsed
  }

  // Handle CSV fields with commas inside quotes
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  // ---------- Form row management ----------
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }])

  const removeRow = (index: number) => {
    setRows((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
  }

  const updateRow = (index: number, field: keyof TeacherRow, value: string | string[]) => {
    setRows((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const toggleSubject = (rowIndex: number, subjectName: string) => {
    setRows((prev) => {
      const updated = [...prev]
      const row = { ...updated[rowIndex] }
      if (row.subjects.includes(subjectName)) {
        row.subjects = row.subjects.filter((s) => s !== subjectName)
      } else {
        row.subjects = [...row.subjects, subjectName]
      }
      updated[rowIndex] = row
      return updated
    })
  }

  // ---------- Submit ----------
  const handleSubmit = async () => {
    setLoading(true)
    setResults(null)

    const payload = rows.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone || undefined,
      qualification: r.qualification || undefined,
      bio: r.bio || undefined,
      experience: r.experience ? Number(r.experience) : 0,
      compensationRate: Number(r.compensationRate),
      studentFacingRate: Number(r.studentFacingRate),
      subjects: r.subjects,
      timezone: r.timezone || "America/New_York",
    }))

    try {
      const res = await fetch("/api/teachers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachers: payload }),
      })
      const data: ApiResponse = await res.json()
      setResults(data)
    } catch (err) {
      console.error("Bulk submit error:", err)
      setResults({
        message: "Failed to submit. Please try again.",
        summary: { total: 0, created: 0, skipped: 0, errors: 0 },
        results: [],
      })
    } finally {
      setLoading(false)
    }
  }

  // ---------- Download template ----------
  const downloadTemplate = () => {
    const headers = [
      "FirstName",
      "LastName",
      "Email",
      "Phone",
      "Qualification",
      "Bio",
      "Experience",
      "CompensationRate",
      "StudentFacingRate",
      "Subjects",
      "Timezone",
    ]
    const sampleRow = [
      "Ananya",
      "Sharma",
      "ananya@example.com",
      "+1-555-000-0001",
      "Ph.D. Mathematics",
      "15 years teaching experience",
      "15",
      "25",
      "55",
      "Mathematics;AP Calculus;SAT Prep",
      "America/New_York",
    ]
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "teacher_onboard_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- Validation summary ----------
  const validRows = rows.filter(
    (r) =>
      r.firstName.trim() &&
      r.lastName.trim() &&
      r.email.trim() &&
      Number(r.compensationRate) > 0 &&
      Number(r.studentFacingRate) > 0
  )

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/admin" className="hover:text-gray-700">
            Admin
          </a>
          <span>/</span>
          <span className="text-gray-900">Bulk Onboard Teachers</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-teal-600" />
          Bulk Teacher Onboarding
        </h1>
        <p className="text-gray-600 mt-1">
          Upload a CSV file or manually add teachers below. This page is for one-time
          bulk onboarding — it is not linked from the navigation menu.
        </p>
      </div>

      {/* Mode tabs */}
      {!results && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("excel")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "excel"
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <button
            onClick={() => setMode("form")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "form"
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Manual Entry
          </button>
        </div>
      )}

      {/* ========== RESULTS VIEW ========== */}
      {results && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Onboarding Results
            </h2>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {results.summary.total}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total Rows</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">
                  {results.summary.created}
                </div>
                <div className="text-xs text-emerald-600 mt-1">Created</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {results.summary.skipped}
                </div>
                <div className="text-xs text-amber-600 mt-1">Skipped</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {results.summary.errors}
                </div>
                <div className="text-xs text-red-600 mt-1">Errors</div>
              </div>
            </div>

            {/* Detailed results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600">Row</th>
                    <th className="text-left p-3 font-medium text-gray-600">Name</th>
                    <th className="text-left p-3 font-medium text-gray-600">Email</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-left p-3 font-medium text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r) => (
                    <tr key={r.row} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-500">#{r.row}</td>
                      <td className="p-3 font-medium text-gray-900">{r.name}</td>
                      <td className="p-3 text-gray-600">{r.email}</td>
                      <td className="p-3">
                        {r.status === "created" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Created
                          </span>
                        )}
                        {r.status === "skipped" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" /> Skipped
                          </span>
                        )}
                        {r.status === "error" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setResults(null)
                setRows([{ ...EMPTY_ROW }])
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Onboard More Teachers
            </button>
            <a
              href="/admin"
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      )}

      {/* ========== UPLOAD CSV VIEW ========== */}
      {!results && mode === "excel" && (
        <div className="bg-white border rounded-xl p-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Teacher CSV
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload a CSV file with teacher details. Download the template below for
              the correct format. Multiple subjects should be separated by semicolons
              (;).
            </p>

            <div className="space-y-4">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CSV Template
              </button>

              <div>
                <label className="block">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {parseError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {parseError}
              </div>
            )}

            {/* Expected columns reference */}
            <div className="mt-8 text-left bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Expected CSV Columns
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Required:</strong> FirstName, LastName, Email,
                  CompensationRate, StudentFacingRate
                </p>
                <p>
                  <strong>Optional:</strong> Phone, Qualification, Bio, Experience,
                  Subjects (semicolon-separated), Timezone
                </p>
                <p className="mt-2">
                  <strong>Available subjects:</strong>{" "}
                  {subjects.map((s) => s.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MANUAL FORM VIEW ========== */}
      {!results && mode === "form" && (
        <div className="space-y-4">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {rows.length} teacher{rows.length !== 1 ? "s" : ""} ·{" "}
                <span className="text-teal-600">{validRows.length} valid</span>
              </span>
              <button
                onClick={addRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600 w-8">#</th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[120px]">
                      First Name*
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[120px]">
                      Last Name*
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[180px]">
                      Email*
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[130px]">
                      Phone
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[150px]">
                      Qualification
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 w-16">
                      Exp (yrs)
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 w-20">
                      Comp $/hr*
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 w-20">
                      Rate $/hr*
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[200px]">
                      Subjects
                    </th>
                    <th className="text-left p-3 font-medium text-gray-600 min-w-[160px]">
                      Timezone
                    </th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.firstName}
                          onChange={(e) => updateRow(idx, "firstName", e.target.value)}
                          placeholder="First"
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.lastName}
                          onChange={(e) => updateRow(idx, "lastName", e.target.value)}
                          placeholder="Last"
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => updateRow(idx, "email", e.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(e) => updateRow(idx, "phone", e.target.value)}
                          placeholder="+1-555-..."
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.qualification}
                          onChange={(e) =>
                            updateRow(idx, "qualification", e.target.value)
                          }
                          placeholder="Ph.D., M.Sc., etc."
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={row.experience}
                          onChange={(e) =>
                            updateRow(idx, "experience", e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.compensationRate}
                          onChange={(e) =>
                            updateRow(idx, "compensationRate", e.target.value)
                          }
                          placeholder="25"
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.studentFacingRate}
                          onChange={(e) =>
                            updateRow(idx, "studentFacingRate", e.target.value)
                          }
                          placeholder="55"
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <SubjectPicker
                          subjects={subjects}
                          selected={row.subjects}
                          onToggle={(name) => toggleSubject(idx, name)}
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.timezone}
                          onChange={(e) =>
                            updateRow(idx, "timezone", e.target.value)
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => removeRow(idx)}
                          disabled={rows.length === 1}
                          className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Note:</strong> A random temporary password is generated for each
            teacher. The welcome email instructs them to use "Forgot Password" or
            contact the admin for their credentials. Subjects must match existing
            subject names exactly. Duplicate emails (existing or within this batch) are
            automatically skipped.
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading || validRows.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Onboard {validRows.length} Teacher{validRows.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
            {validRows.length < rows.length && (
              <span className="text-sm text-amber-600">
                {rows.length - validRows.length} row{rows.length - validRows.length !== 1 ? "s" : ""}{" "}
                incomplete (missing required fields)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Subject picker sub-component ----------
function SubjectPicker({
    subjects,
    selected,
    onToggle,
  }: {
    subjects: Subject[]
    selected: string[]
    onToggle: (name: string) => void
  }) {
    const [open, setOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
  
    // Position dropdown using fixed positioning relative to viewport
    // This avoids being clipped by overflow-x-auto on the table container
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  
    useEffect(() => {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const dropdownHeight = 220 // max-h-[220px]
  
        // Open above if not enough space below
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          setDropdownStyle({
            position: "fixed",
            left: rect.left,
            bottom: window.innerHeight - rect.top + 4,
            width: 240,
            zIndex: 50,
          })
        } else {
          setDropdownStyle({
            position: "fixed",
            left: rect.left,
            top: rect.bottom + 4,
            width: 240,
            zIndex: 50,
          })
        }
      }
    }, [open])
  
    // Close on outside click
    useEffect(() => {
      if (!open) return
      function handleClick(e: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(e.target as Node)
        ) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }, [open])
  
    // Close on scroll of any parent (table container scrolls)
    useEffect(() => {
      if (!open) return
      function handleScroll() {
        setOpen(false)
      }
      // Capture scroll on any ancestor — handles the table overflow scroll
      window.addEventListener("scroll", handleScroll, true)
      return () => window.removeEventListener("scroll", handleScroll, true)
    }, [open])
  
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-2 py-1.5 border rounded text-sm text-left flex items-center justify-between gap-1 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
        >
          <span className="truncate text-gray-600">
            {selected.length > 0 ? `${selected.length} selected` : "Select subjects"}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
  
        {/* Portal-style fixed dropdown — not clipped by table overflow */}
        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="bg-white border rounded-lg shadow-xl py-1 max-h-[220px] overflow-y-auto"
            >
              {subjects.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(s.name)}
                    onChange={() => onToggle(s.name)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="text-gray-700">{s.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{s.category}</span>
                </label>
              ))}
              {subjects.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">No subjects found</div>
              )}
            </div>,
            document.body
          )}
  
        {/* Selected tags */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {selected.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium"
              >
                {name}
                <button
                  type="button"
                  onClick={() => onToggle(name)}
                  className="text-teal-400 hover:text-teal-600 ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }
  
