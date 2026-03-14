"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, UserCheck, Loader2, AlertTriangle, CheckCircle, Package, Sparkles } from "lucide-react"

type Teacher = { id: string; name: string; rate: number; subjects: { id: string; name: string }[] }
type Template = { id: string; name: string; subjectId: string; subjectName: string; classesIncluded: number; validityDays: number; suggestedPrice: number; isPopular: boolean }
type StudentSubject = { id: string; name: string }

export function ConvertStudentModal({
  open,
  onClose,
  onSuccess,
  studentId,
  studentName,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  studentId: string
  studentName: string
}) {
  const [data, setData] = useState<{ teachers: Teacher[]; templates: Template[]; studentSubjects: StudentSubject[] } | null>(null)
  const [subjectId, setSubjectId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [packageName, setPackageName] = useState("")
  const [classesIncluded, setClassesIncluded] = useState<number>(0)
  const [pricePerClass, setPricePerClass] = useState<number>(0)
  const [validityDays, setValidityDays] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSubjectId("")
      setTeacherId("")
      setTemplateId("")
      setPackageName("")
      setClassesIncluded(0)
      setPricePerClass(0)
      setValidityDays(0)
      setError("")
      setSuccess(false)
      fetch(`/api/students/convert/data?studentId=${studentId}`)
        .then((r) => r.json())
        .then((d) => {
          setData(d)
          if (d.studentSubjects?.length === 1) setSubjectId(d.studentSubjects[0].id)
        })
        .catch(() => {})
    }
  }, [open, studentId])

  // All subjects from teachers
  const allSubjects = useMemo(() => {
    if (!data) return []
    return Array.from(new Map(data.teachers.flatMap((t) => t.subjects).map((s) => [s.id, s])).values())
  }, [data])

  // Teachers filtered by subject
  const filteredTeachers = useMemo(() => {
    if (!data) return []
    return subjectId ? data.teachers.filter((t) => t.subjects.some((s) => s.id === subjectId)) : data.teachers
  }, [data, subjectId])

  // Templates filtered by subject
  const filteredTemplates = useMemo(() => {
    if (!data) return []
    return subjectId ? data.templates.filter((t) => t.subjectId === subjectId) : data.templates
  }, [data, subjectId])

  // Auto-fill from template
  useEffect(() => {
    if (templateId && data) {
      const tmpl = data.templates.find((t) => t.id === templateId)
      if (tmpl) {
        setPackageName(tmpl.name)
        setClassesIncluded(tmpl.classesIncluded)
        setPricePerClass(Math.round(tmpl.suggestedPrice / tmpl.classesIncluded * 100) / 100)
        setValidityDays(tmpl.validityDays)
        if (!subjectId) setSubjectId(tmpl.subjectId)
      }
    }
  }, [templateId, data, subjectId])

  const totalPrice = classesIncluded * pricePerClass

  async function handleConvert() {
    setError("")
    if (!subjectId) return setError("Please select a subject.")
    if (!teacherId) return setError("Please select a teacher.")
    if (!classesIncluded || classesIncluded < 1) return setError("Please enter number of classes.")
    if (!pricePerClass || pricePerClass <= 0) return setError("Please enter price per class.")
    if (!validityDays || validityDays < 1) return setError("Please enter validity days.")

    setLoading(true)
    try {
      const res = await fetch("/api/students/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          teacherId,
          subjectId,
          templateId: templateId || null,
          classesIncluded,
          pricePerClass,
          validityDays,
          packageName: packageName || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || "Conversion failed")
        return
      }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 2000)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Convert Student</h2>
              <p className="text-xs text-gray-500">Create a package for {studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto" />
            <p className="text-lg font-semibold text-[#1E293B] mt-3">Student Converted!</p>
            <p className="text-sm text-gray-500 mt-1">
              {studentName} is now an active student with a package worth ${totalPrice.toFixed(2)}.
            </p>
            <p className="text-xs text-gray-400 mt-2">A pending payment of ${totalPrice.toFixed(2)} has been created.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {!data && <p className="text-sm text-gray-400 text-center py-4">Loading…</p>}

            {data && (
              <>
                {/* Quick pick from template */}
                {filteredTemplates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Package className="w-4 h-4 inline mr-1" />Quick Pick — Package Template
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredTemplates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => setTemplateId(tmpl.id)}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            templateId === tmpl.id
                              ? "border-[#0D9488] bg-[#0D9488]/5 ring-2 ring-[#0D9488]/20"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#1E293B]">{tmpl.name}</span>
                            {tmpl.isPopular && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                                <Sparkles className="w-3 h-3" />POPULAR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tmpl.classesIncluded} classes · {tmpl.validityDays} days · ${tmpl.suggestedPrice} total · {tmpl.subjectName}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 mb-3 uppercase font-medium tracking-wide">
                    {templateId ? "Customize or confirm details" : "Or configure manually"}
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTeacherId(""); setTemplateId(""); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                    <option value="">Select subject…</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {data.studentSubjects.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Student&apos;s subjects: {data.studentSubjects.map((s) => s.name).join(", ")}</p>
                  )}
                </div>

                {/* Teacher */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                  <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none">
                    <option value="">Select teacher…</option>
                    {filteredTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} — ${t.rate}/hr</option>
                    ))}
                  </select>
                </div>

                {/* Package name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                  <input type="text" value={packageName} onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. 8-Class Mathematics Pack"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none" />
                </div>

                {/* Classes, price, validity */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Classes *</label>
                    <input type="number" min={1} value={classesIncluded || ""} onChange={(e) => setClassesIncluded(Number(e.target.value))}
                      placeholder="8"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">$/class *</label>
                    <input type="number" min={0} step={0.01} value={pricePerClass || ""} onChange={(e) => setPricePerClass(Number(e.target.value))}
                      placeholder="55"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validity *</label>
                    <input type="number" min={1} value={validityDays || ""} onChange={(e) => setValidityDays(Number(e.target.value))}
                      placeholder="60 days"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none" />
                  </div>
                </div>

                {/* Summary */}
                {classesIncluded > 0 && pricePerClass > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-teal-700">Total Package Value</span>
                      <span className="text-lg font-bold text-[#0D9488]">${totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-teal-600 mt-1">
                      {classesIncluded} classes × ${pricePerClass}/class · Valid for {validityDays} days
                    </p>
                    <p className="text-xs text-teal-500 mt-1">
                      A pending payment of ${totalPrice.toFixed(2)} will be created automatically.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {!success && data && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleConvert} disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Converting…</> : <><UserCheck className="w-4 h-4" />Convert & Create Package</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
