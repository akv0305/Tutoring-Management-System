"use client"

import React, { useState } from "react"
import {
  Calculator,
  Download,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Lock,
  Loader2,
  RotateCcw,
  Pencil,
  AlertCircle,
  Clock,
  Plus,
  Minus,
  FileText,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Types ─── */

type Payout = {
  id: string
  payoutId: string
  teacher: string
  teacherId: string
  period: string
  periodMonth: number
  periodYear: number
  classesCompleted: number
  compRate: string
  grossAmount: string
  grossNum: number
  deductions: string
  deductionsNum: number
  bonus: string
  bonusNum: number
  adminNotes: string
  netAmount: string
  netNum: number
  status: string
  paidAt: string | null
}

type KPIs = {
  totalPaid: number
  pendingAmount: number
  teachersToPay: number
  avgPayout: number
}

type Teacher = { id: string; name: string; rate: number }
type FilterTab = "all" | "pending" | "processing" | "paid" | "on hold"

/* ─── Helpers ─── */

function MiniKPI({
  label,
  value,
  icon: Icon,
  valueClass = "text-[#1E293B]",
  bg = "bg-white",
  border = "border-gray-100",
}: {
  label: string
  value: string
  icon: React.ElementType
  valueClass?: string
  bg?: string
  border?: string
}) {
  return (
    <div className={`${bg} rounded-xl border ${border} shadow-sm px-5 py-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${valueClass}`} />
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Main ─── */

export function PayoutsClient({
  payouts: initialPayouts,
  kpis,
  teachers,
}: {
  payouts: Payout[]
  kpis: KPIs
  teachers: Teacher[]
}) {
  const [payouts, setPayouts] = useState(initialPayouts)
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  // Action modal
  const [actionModal, setActionModal] = useState<{
    payout: Payout; action: string; label: string
  } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState("")

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [genResults, setGenResults] = useState<{ teacher: string; status: string; message: string }[]>([])

  // Adjustments modal
  const [adjModal, setAdjModal] = useState<Payout | null>(null)
  const [adjDeductions, setAdjDeductions] = useState("")
  const [adjBonus, setAdjBonus] = useState("")
  const [adjNotes, setAdjNotes] = useState("")
  const [adjSaving, setAdjSaving] = useState(false)
  const [adjError, setAdjError] = useState("")

  /* ─── Filters ─── */

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: payouts.length },
    { key: "pending", label: "Pending", count: payouts.filter((p) => p.status === "pending").length },
    { key: "processing", label: "Processing", count: payouts.filter((p) => p.status === "processing").length },
    { key: "paid", label: "Paid", count: payouts.filter((p) => p.status === "paid").length },
    { key: "on hold", label: "On Hold", count: payouts.filter((p) => p.status === "on hold").length },
  ]

  const filtered = activeTab === "all" ? payouts : payouts.filter((p) => p.status === activeTab)

  /* ─── Action handler ─── */

  const openAction = (payout: Payout, action: string, label: string) => {
    setActionModal({ payout, action, label })
    setActionError("")
  }

  const handleAction = async () => {
    if (!actionModal) return
    setProcessing(true)
    setActionError("")
    try {
      const res = await fetch("/api/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionModal.payout.id, action: actionModal.action }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error || "Action failed"); return }
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === actionModal.payout.id
            ? { ...p, status: data.payout.status.toLowerCase().replace("_", " ") }
            : p
        )
      )
      setActionModal(null)
    } catch { setActionError("Network error") }
    finally { setProcessing(false) }
  }

  /* ─── Generate ─── */

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError("")
    setGenResults([])
    const results: { teacher: string; status: string; message: string }[] = []
    for (const t of teachers) {
      try {
        const res = await fetch("/api/payouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId: t.id, periodMonth: genMonth, periodYear: genYear }),
        })
        const data = await res.json()
        if (res.ok) {
          results.push({ teacher: t.name, status: "success", message: `${data.payout.classes} classes → $${data.payout.net}` })
        } else {
          results.push({
            teacher: t.name,
            status: data.error?.includes("already exists") || data.error?.includes("No completed") ? "skipped" : "error",
            message: data.error,
          })
        }
      } catch { results.push({ teacher: t.name, status: "error", message: "Network error" }) }
    }
    setGenResults(results)
    setGenerating(false)
    if (results.some((r) => r.status === "success")) setTimeout(() => window.location.reload(), 1500)
  }

  /* ─── Adjustments ─── */

  const openAdj = (payout: Payout) => {
    setAdjModal(payout)
    setAdjDeductions(String(payout.deductionsNum))
    setAdjBonus(String(payout.bonusNum))
    setAdjNotes(payout.adminNotes)
    setAdjError("")
  }

  const adjNetPreview = adjModal
    ? adjModal.grossNum - (Number(adjDeductions) || 0) + (Number(adjBonus) || 0)
    : 0

  const handleAdj = async () => {
    if (!adjModal) return
    setAdjSaving(true)
    setAdjError("")
    try {
      const res = await fetch("/api/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: adjModal.id,
          action: "update_adjustments",
          deductions: Number(adjDeductions) || 0,
          bonus: Number(adjBonus) || 0,
          adminNotes: adjNotes.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAdjError(data.error || "Update failed"); return }

      const newDed = Number(adjDeductions) || 0
      const newBon = Number(adjBonus) || 0
      const newNet = adjModal.grossNum - newDed + newBon
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === adjModal.id
            ? {
                ...p,
                deductionsNum: newDed,
                deductions: newDed === 0 ? "$0" : `-$${newDed.toLocaleString()}`,
                bonusNum: newBon,
                bonus: newBon === 0 ? "$0" : `+$${newBon.toLocaleString()}`,
                adminNotes: adjNotes.trim(),
                netNum: newNet,
                netAmount: `$${newNet.toLocaleString()}`,
              }
            : p
        )
      )
      setAdjModal(null)
    } catch { setAdjError("Network error") }
    finally { setAdjSaving(false) }
  }

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]

  /* ─── Render ─── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">Generate, review, adjust and process teacher payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setShowGenerate(true); setGenResults([]); setGenError("") }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <Calculator className="w-4 h-4" /> Generate Payout
          </button>
          <button type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Paid" value={`$${kpis.totalPaid.toLocaleString()}`} icon={CheckCircle} valueClass="text-[#22C55E]" bg="bg-green-50" border="border-green-100" />
        <MiniKPI label="Pending Amount" value={`$${kpis.pendingAmount.toLocaleString()}`} icon={Clock} valueClass="text-[#F59E0B]" bg="bg-amber-50" border="border-amber-100" />
        <MiniKPI label="Teachers to Pay" value={kpis.teachersToPay.toString()} icon={DollarSign} valueClass="text-[#1E3A5F]" />
        <MiniKPI label="Avg Payout" value={`$${kpis.avgPayout.toLocaleString()}`} icon={Calculator} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? "bg-[#1E3A5F] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1 ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No payouts found</p>
          <p className="text-gray-400 text-xs mt-1">Click &quot;Generate Payout&quot; to create payouts for active teachers</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Payout ID", "Teacher", "Period", "Classes", "Rate", "Gross", "Deductions", "Bonus", "Net Amount", "Notes", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs font-semibold text-[#1E3A5F] bg-[#1E3A5F]/5 px-2 py-1 rounded">{row.payoutId}</span>
                    </td>
                    <td className="px-3 py-3 font-medium text-[#1E293B] whitespace-nowrap">{row.teacher}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{row.period}</td>
                    <td className="px-3 py-3 font-semibold text-[#1E293B] text-center">{row.classesCompleted}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                        <Lock className="w-3 h-3" />{row.compRate}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{row.grossAmount}</td>
                    <td className="px-3 py-3">
                      <span className={`text-sm ${row.deductionsNum === 0 ? "text-gray-400" : "text-[#EF4444] font-medium"}`}>
                        {row.deductions}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm ${row.bonusNum === 0 ? "text-gray-400" : "text-[#22C55E] font-medium"}`}>
                        {row.bonus}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-[#1E3A5F]">{row.netAmount}</td>
                    <td className="px-3 py-3">
                      {row.adminNotes ? (
                        <span className="flex items-center gap-1 text-xs text-gray-500 max-w-[120px]" title={row.adminNotes}>
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">{row.adminNotes}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} size="sm" /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {(row.status === "pending" || row.status === "processing") && (
                          <button type="button" title="Adjust Deductions / Bonus" onClick={() => openAdj(row)}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {row.status === "pending" && (
                          <>
                            <button type="button" title="Mark Paid" onClick={() => openAction(row, "pay", "Mark as Paid")}
                              className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" title="Put On Hold" onClick={() => openAction(row, "hold", "Put On Hold")}
                              className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {row.status === "processing" && (
                          <button type="button" title="Mark Paid" onClick={() => openAction(row, "pay", "Mark as Paid")}
                            className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {row.status === "on hold" && (
                          <button type="button" title="Release" onClick={() => openAction(row, "release", "Release Hold")}
                            className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {row.status === "paid" && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 px-1.5">
                            <Eye className="w-3.5 h-3.5" />{row.paidAt ?? "Paid"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confidentiality note */}
      <div className="flex items-start gap-3 px-5 py-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">Comp. Rate is confidential.</span>{" "}
          Only Admin can view this page. Teachers see only total payout — not the hourly rate.
        </p>
      </div>

      {/* ─── Generate Modal ─── */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !generating) setShowGenerate(false) }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <h3 className="text-lg font-semibold text-[#1E293B]">Generate Payouts</h3>
              <button type="button" onClick={() => setShowGenerate(false)} disabled={generating} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">Generate payouts for <strong>{teachers.length} active teacher(s)</strong>. Existing payouts and teachers with no completed classes will be skipped.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                  <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} disabled={generating}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] outline-none">
                    {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                  <select value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} disabled={generating}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] outline-none">
                    {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teachers ({teachers.length})</label>
                <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                  {teachers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{t.name}</span>
                      <span className="text-xs text-gray-400 font-mono">${t.rate}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
              {genError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{genError}</span>
                </div>
              )}
              {genResults.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Results</p>
                  {genResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      r.status === "success" ? "bg-green-50 text-green-700" : r.status === "skipped" ? "bg-gray-50 text-gray-500" : "bg-red-50 text-red-700"
                    }`}>
                      {r.status === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : r.status === "skipped" ? <Clock className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span className="font-medium">{r.teacher}</span>
                      <span className="text-xs ml-auto">{r.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t px-5 py-4 shrink-0">
              {genResults.length > 0 ? (
                <button type="button" onClick={() => setShowGenerate(false)}
                  className="w-full py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#1E3A5F]/90">Done</button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowGenerate(false)} disabled={generating}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="button" onClick={handleGenerate} disabled={generating || teachers.length === 0}
                    className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {generating ? "Generating…" : `Generate for ${teachers.length} Teacher(s)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Action Modal ─── */}
      {actionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setActionModal(null) }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Confirm Action</h3>
            <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">{actionModal.label}</span> for:</p>
            <p className="text-sm text-gray-800 font-medium mb-1">{actionModal.payout.teacher} — {actionModal.payout.period}</p>
            <p className="text-sm text-gray-500 mb-4">Net amount: <span className="font-bold text-[#1E3A5F]">{actionModal.payout.netAmount}</span></p>
            {actionError && <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActionModal(null)} disabled={processing}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleAction} disabled={processing}
                className="px-5 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 flex items-center gap-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}{processing ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Adjustments Modal ─── */}
      {adjModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAdjModal(null) }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b shrink-0">
              <h3 className="text-lg font-bold text-[#1E293B]">Adjust Payout</h3>
              <p className="text-xs text-gray-500 mt-0.5">Correct mismatches, missing confirmations, or add performance bonuses</p>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Teacher</span>
                  <span className="font-medium">{adjModal.teacher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Period</span>
                  <span>{adjModal.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Classes</span>
                  <span className="font-medium">{adjModal.classesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross Amount</span>
                  <span className="font-semibold">{adjModal.grossAmount}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-[#EF4444]" />
                  <span className="text-sm font-semibold text-[#EF4444]">Deductions</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                  <input
                    type="number" step="0.01" min="0" max={adjModal.grossNum}
                    value={adjDeductions} onChange={(e) => setAdjDeductions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Bonus */}
              <div className="bg-green-50/50 border border-green-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm font-semibold text-[#22C55E]">Bonus / Extra Payment</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={adjBonus} onChange={(e) => setAdjBonus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin Notes <span className="text-gray-400 font-normal">(reason for adjustments)</span>
                </label>
                <textarea
                  value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Deducted $50 for 2 unconfirmed classes. Added $30 bonus for extra session on 3/10 not in system."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] resize-none outline-none"
                />
              </div>

              {/* Net preview */}
              <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross</span>
                  <span>{adjModal.grossAmount}</span>
                </div>
                {(Number(adjDeductions) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#EF4444]">Deductions</span>
                    <span className="text-[#EF4444]">-${(Number(adjDeductions) || 0).toLocaleString()}</span>
                  </div>
                )}
                {(Number(adjBonus) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#22C55E]">Bonus</span>
                    <span className="text-[#22C55E]">+${(Number(adjBonus) || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[#1E3A5F]/10 mt-2 pt-2 flex justify-between">
                  <span className="font-semibold text-[#1E3A5F]">Net Payout</span>
                  <span className="font-bold text-lg text-[#1E3A5F]">${adjNetPreview.toLocaleString()}</span>
                </div>
              </div>

              {adjError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{adjError}</span>
                </div>
              )}
            </div>

            <div className="border-t px-5 py-4 shrink-0 flex gap-2">
              <button type="button" onClick={() => setAdjModal(null)} disabled={adjSaving}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleAdj} disabled={adjSaving}
                className="flex-1 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 flex items-center justify-center gap-2">
                {adjSaving && <Loader2 className="w-4 h-4 animate-spin" />}Save Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
