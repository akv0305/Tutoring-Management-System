"use client"

import React, { useState } from "react"
import { Calculator, Download, CheckCircle, XCircle, DollarSign, Eye, Lock, Loader2, RotateCcw } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Payout = Record<string, unknown> & {
  id: string
  payoutId: string
  teacher: string
  period: string
  classesCompleted: number
  compRate: string
  grossAmount: string
  grossNum: number
  deductions: string
  deductionsNum: number
  netAmount: string
  netNum: number
  status: string
}

type KPIs = {
  totalPaid: number
  pendingAmount: number
  teachersToPay: number
  avgPayout: number
}

type ActionModal = {
  payout: Payout
  action: string
  label: string
} | null

function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

export function PayoutsClient({ payouts: initialPayouts, kpis }: { payouts: Payout[]; kpis: KPIs }) {
  const [payouts, setPayouts] = useState(initialPayouts)
  const [actionModal, setActionModal] = useState<ActionModal>(null)
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState("")

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
      if (!res.ok) {
        setActionError(data.error || "Action failed")
        return
      }

      // Update local state
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === actionModal.payout.id
            ? { ...p, status: data.payout.status.toLowerCase().replace("_", " ") }
            : p
        )
      )
      setActionModal(null)
    } catch {
      setActionError("Network error. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const columns = [
    {
      key: "payoutId",
      label: "Payout ID",
      render: (row: Payout) => (
        <span className="font-mono text-xs font-semibold text-[#1E3A5F]">{row.payoutId}</span>
      ),
    },
    {
      key: "teacher",
      label: "Teacher",
      sortable: true,
      render: (row: Payout) => (
        <span className="font-medium text-[#1E293B]">{row.teacher}</span>
      ),
    },
    {
      key: "period",
      label: "Period",
      sortable: true,
      render: (row: Payout) => (
        <span className="text-sm text-gray-600">{row.period}</span>
      ),
    },
    {
      key: "classesCompleted",
      label: "Classes",
      sortable: true,
      render: (row: Payout) => (
        <span className="font-semibold text-[#1E293B]">{row.classesCompleted}</span>
      ),
    },
    {
      key: "compRate",
      label: "Comp. Rate 🔒",
      render: (row: Payout) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <Lock className="w-3 h-3" />
          {row.compRate}
        </span>
      ),
    },
    {
      key: "grossAmount",
      label: "Gross",
      render: (row: Payout) => (
        <span className="text-sm text-gray-600">{row.grossAmount}</span>
      ),
    },
    {
      key: "deductions",
      label: "Deductions",
      render: (row: Payout) => (
        <span className={`text-sm ${row.deductions === "$0" ? "text-gray-400" : "text-[#EF4444] font-medium"}`}>
          {row.deductions}
        </span>
      ),
    },
    {
      key: "netAmount",
      label: "Net Amount",
      sortable: true,
      render: (row: Payout) => (
        <span className="font-bold text-[#1E3A5F]">{row.netAmount}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: Payout) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Payout) => {
        if (row.status === "pending") {
          return (
            <div className="flex items-center gap-1">
              <button
                title="Mark Paid"
                onClick={() => openAction(row, "pay", "Mark as Paid")}
                className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
              <button
                title="Put On Hold"
                onClick={() => openAction(row, "hold", "Put On Hold")}
                className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        }
        if (row.status === "processing") {
          return (
            <button
              title="Mark Paid"
              onClick={() => openAction(row, "pay", "Mark as Paid")}
              className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
            </button>
          )
        }
        if (row.status === "on hold") {
          return (
            <button
              title="Release (back to Pending)"
              onClick={() => openAction(row, "release", "Release Hold")}
              className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )
        }
        return (
          <button title="View Details" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Teacher Payouts</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <Calculator className="w-4 h-4" />
            Generate Monthly Payout
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Paid (All Time)" value={`$${kpis.totalPaid.toLocaleString()}`} />
        <MiniKPI label="Pending Amount" value={`$${kpis.pendingAmount.toLocaleString()}`} valueClass="text-[#F59E0B]" />
        <MiniKPI label="Teachers to Pay" value={kpis.teachersToPay.toString()} valueClass="text-[#1E3A5F]" />
        <MiniKPI label="Avg Payout" value={`$${kpis.avgPayout.toLocaleString()}`} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={payouts as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search payouts..."
        pageSize={10}
      />

      {/* Confidentiality note */}
      <div className="flex items-start gap-3 px-5 py-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">Comp. Rate column is confidential.</span>{" "}
          Only Admin can view this page. Teacher dashboard shows only the total payout amount — not the hourly rate.
        </p>
      </div>

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Confirm Action</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">{actionModal.label}</span> for:
            </p>
            <p className="text-sm text-gray-800 font-medium mb-1">
              {actionModal.payout.teacher} — {actionModal.payout.period}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Net amount: <span className="font-bold text-[#1E3A5F]">{actionModal.payout.netAmount}</span>
            </p>

            {actionError && (
              <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActionModal(null)}
                disabled={processing}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className="px-5 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 flex items-center gap-2"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                {processing ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
