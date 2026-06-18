"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Plus, Trash2, Upload, Search, X, Loader2, AlertCircle,
  Download, Users, Mail, Phone, UserCheck,
} from "lucide-react"

type ExistingParentRecord = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  createdAt: string
}

export default function ExistingParentsPage() {
  const [records, setRecords] = useState<ExistingParentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState("")
  const [addEmail, setAddEmail] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")

  // CSV import state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch records
  async function fetchRecords() {
    setLoading(true)
    try {
      const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""
      const res = await fetch(`/api/existing-parents${params}`)
      const data = await res.json()
      if (res.ok) setRecords(data.records)
    } catch {
      // silent
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [debouncedSearch])

  // Add single record
  async function handleAdd() {
    setAddError("")
    if (!addEmail.trim() && !addPhone.trim()) {
      setAddError("At least email or phone is required.")
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch("/api/existing-parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim() || undefined,
          email: addEmail.trim() || undefined,
          phone: addPhone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || "Failed to add")
        setAddLoading(false)
        return
      }
      setAddName("")
      setAddEmail("")
      setAddPhone("")
      setShowAddForm(false)
      fetchRecords()
    } catch {
      setAddError("Network error")
    }
    setAddLoading(false)
  }

  // Delete record
  async function handleDelete(id: string) {
    if (!confirm("Remove this parent from the existing parents list? They will become eligible for trial classes.")) return
    setDeleteLoading(id)
    try {
      const res = await fetch(`/api/existing-parents?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchRecords()
      else {
        const data = await res.json()
        alert(data.error || "Delete failed")
      }
    } catch {
      alert("Network error")
    }
    setDeleteLoading(null)
  }

  // CSV import
  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

      if (lines.length < 2) {
        setImportResult("CSV must have a header row and at least one data row.")
        setImporting(false)
        return
      }

      // Parse header
      const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""))
      const nameIdx = header.findIndex((h) => h === "name")
      const emailIdx = header.findIndex((h) => h === "email")
      const phoneIdx = header.findIndex((h) => h === "phone" || h === "ph number" || h === "phone number")

      if (emailIdx === -1 && phoneIdx === -1) {
        setImportResult("CSV must have at least an 'email' or 'phone' column in the header.")
        setImporting(false)
        return
      }

      // Parse rows
      const bulk = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""))
        return {
          name: nameIdx >= 0 ? cols[nameIdx] || undefined : undefined,
          email: emailIdx >= 0 ? cols[emailIdx] || undefined : undefined,
          phone: phoneIdx >= 0 ? cols[phoneIdx] || undefined : undefined,
        }
      })

      const res = await fetch("/api/existing-parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult(data.message)
        fetchRecords()
      } else {
        setImportResult(data.error || "Import failed")
      }
    } catch {
      setImportResult("Failed to read CSV file")
    }
    setImporting(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Download sample CSV
  function downloadSampleCSV() {
    const csv = "name,email,phone\nJohn Doe,john@example.com,+1234567890\nJane Smith,jane@example.com,"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "existing-parents-sample.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Existing Parents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Parents in this list are not eligible for trial classes. Remove a record to re-enable trials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Sample CSV
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            {importing ? "Importing…" : "Import CSV"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVImport}
              disabled={importing}
            />
          </label>
          <button
            onClick={() => { setShowAddForm(true); setAddError("") }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Parent
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="flex items-center justify-between gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <span>{importResult}</span>
          <button onClick={() => setImportResult(null)} className="p-1 hover:bg-blue-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Records</p>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">{records.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">With Email</p>
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">
            {records.filter((r) => r.email).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">With Phone</p>
            <Phone className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-[#1E293B]">
            {records.filter((r) => r.phone).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Add Form (inline) */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1E293B]">Add Existing Parent</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 rounded hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name (optional)</label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="e.g. +1234567890"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
          </div>
          {addError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={addLoading}
              className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {addLoading ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search ? "No records match your search." : "No existing parents added yet."}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Add parents via the form above or import a CSV file.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Added</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#1E293B]">
                    {r.name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{r.email || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3 text-gray-600">{r.phone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleteLoading === r.id}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Remove (re-enables trial for this parent)"
                    >
                      {deleteLoading === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
