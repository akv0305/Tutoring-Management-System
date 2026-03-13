"use client"

import React, { useState, useMemo } from "react"
import { Download, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Payment = {
  id: string
  paymentId: string
  student: string
  packageName: string
  amount: string
  amountNum: number
  method: string
  status: string
  date: string
  confirmedBy: string | null
}

type KPIs = {
  totalCollected: number
  pending: number
  pendingCount: number
  refunded: number
  total: number
}

function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

export function PaymentsClient({
  payments: initialPayments,
  kpis: initialKpis,
}: {
  payments: Payment[]
  kpis: KPIs
}) {
  const [payments, setPayments] = useState(initialPayments)
  const [kpis, setKpis] = useState(initialKpis)
  const [filter, setFilter] = useState<"all" | "pending">("all")
  const [processing, setProcessing] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === "pending") return payments.filter((p) => p.status === "pending")
    return payments
  }, [filter, payments])

  async function handleAction(paymentId: string, action: "confirm" | "reject") {
    setProcessing(paymentId)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        const payment = payments.find((p) => p.id === paymentId)
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? { ...p, status: action === "confirm" ? "confirmed" : "failed" }
              : p
          )
        )
        setKpis((prev) => ({
          ...prev,
          pendingCount: prev.pendingCount - 1,
          pending: prev.pending - (payment?.amountNum ?? 0),
          ...(action === "confirm"
            ? { totalCollected: prev.totalCollected + (payment?.amountNum ?? 0) }
            : {}),
        }))
      } else {
        alert(data.error || "Failed to process payment")
      }
    } catch {
      alert("Network error")
    } finally {
      setProcessing(null)
    }
  }

  const columns = [
    {
      key: "paymentId",
      label: "Payment ID",
      render: (r: Payment) => (
        <span className="font-mono text-xs font-semibold text-[#1E3A5F]">
          {r.paymentId}
        </span>
      ),
    },
    {
      key: "student",
      label: "Student",
      sortable: true,
      render: (r: Payment) => (
        <span className="font-medium text-[#1E293B]">{r.student}</span>
      ),
    },
    {
      key: "packageName",
      label: "Package",
      render: (r: Payment) => (
        <span className="text-sm text-gray-600">{r.packageName}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (r: Payment) => (
        <span className="font-bold text-[#1E293B]">{r.amount}</span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (r: Payment) => (
        <span className="text-sm text-gray-600">{r.method}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r: Payment) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (r: Payment) => (
        <span className="text-xs text-gray-500">{r.date}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: Payment) => (
        <div className="flex items-center gap-1">
          <button
            title="View"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {r.status === "pending" && (
            <>
              <button
                title="Confirm"
                disabled={processing === r.id}
                onClick={() => handleAction(r.id, "confirm")}
                className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {processing === r.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                title="Reject"
                disabled={processing === r.id}
                onClick={() => handleAction(r.id, "reject")}
                className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Payment Management
        </h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filter === "all"
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filter === "pending"
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Pending
          {kpis.pendingCount > 0 && (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                filter === "pending"
                  ? "bg-white text-[#1E3A5F]"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {kpis.pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI
          label="Total Collected"
          value={`$${kpis.totalCollected.toLocaleString()}`}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI label="Total Payments" value={kpis.total} />
        <MiniKPI
          label="Pending Confirmation"
          value={`$${kpis.pending.toLocaleString()}`}
          valueClass="text-[#F59E0B]"
        />
        <MiniKPI
          label="Refunded"
          value={`$${kpis.refunded.toLocaleString()}`}
          valueClass="text-[#EF4444]"
        />
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search payments..."
        pageSize={10}
      />
    </div>
  )
}
