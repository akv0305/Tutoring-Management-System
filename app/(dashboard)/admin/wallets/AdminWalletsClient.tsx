"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Wallet,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Minus,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronLeft,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Types ────────────────────────────────────────────────── */

type WalletSummary = Record<string, unknown> & {
  id: string
  parentProfileId: string
  parentName: string
  parentEmail: string
  parentStatus: string
  balance: number
  totalCredited: number
  totalDebited: number
  monthlyUsage: number
  transactionCount: number
  lastActivity: string | null
}

type KPIs = {
  totalWallets: number
  activeWallets: number
  totalWalletBalance: number
  totalCredited: number
  totalDebited: number
}

type Transaction = {
  id: string
  amount: number
  type: string
  typeLabel: string
  description: string | null
  bookingInfo: string | null
  referenceId: string | null
  createdAt: string
}

type WalletDetail = {
  id: string
  balance: number
  parentProfileId: string
  parentName: string
  parentEmail: string
  totalCredited: number
  totalDebited: number
  transactionCount: number
}

/* ─── MiniKPI ──────────────────────────────────────────────── */

function MiniKPI({
  label,
  value,
  icon: Icon,
  valueClass = "text-[#1E293B]",
  iconClass = "text-gray-400",
}: {
  label: string
  value: string | number
  icon: React.ElementType
  valueClass?: string
  iconClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */

export default function AdminWalletsClient() {
  const [wallets, setWallets] = useState<WalletSummary[]>([])
  const [kpis, setKpis] = useState<KPIs>({
    totalWallets: 0, activeWallets: 0, totalWalletBalance: 0, totalCredited: 0, totalDebited: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Detail view
  const [selectedWallet, setSelectedWallet] = useState<WalletDetail | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Adjust modal
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<WalletSummary | null>(null)
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit")
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustNote, setAdjustNote] = useState("")
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustError, setAdjustError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Fetch all wallets
  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch("/api/admin/wallets")
      if (!res.ok) throw new Error("Failed to load wallets")
      const data = await res.json()
      setWallets(data.wallets)
      setKpis(data.kpis)
    } catch (err: any) {
      setError(err.message || "Failed to load wallets")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch wallet detail
  const fetchDetail = async (parentProfileId: string) => {
    try {
      setDetailLoading(true)
      const res = await fetch(`/api/admin/wallets?parentProfileId=${parentProfileId}`)
      if (!res.ok) throw new Error("Failed to load wallet details")
      const data = await res.json()
      setSelectedWallet(data.wallet)
      setTransactions(data.transactions)
    } catch {
      setError("Failed to load wallet details")
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  // Handle adjust wallet
  const handleAdjust = async () => {
    setAdjustError("")
    const amount = parseFloat(adjustAmount)
    if (!amount || amount <= 0) {
      setAdjustError("Enter a valid amount greater than 0")
      return
    }
    if (!adjustNote.trim()) {
      setAdjustError("A note is required for audit trail")
      return
    }
    if (!adjustTarget) return

    try {
      setAdjustLoading(true)
      const finalAmount = adjustType === "credit" ? amount : -amount
      const res = await fetch("/api/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentProfileId: adjustTarget.parentProfileId,
          amount: finalAmount,
          description: adjustNote.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Adjustment failed")

      setSuccessMsg(
        `${adjustType === "credit" ? "Credited" : "Debited"} $${amount.toFixed(2)} to ${adjustTarget.parentName}'s wallet. New balance: $${data.newBalance.toFixed(2)}`
      )
      setShowAdjust(false)
      setAdjustTarget(null)
      setAdjustAmount("")
      setAdjustNote("")
      setTimeout(() => setSuccessMsg(""), 5000)

      // Refresh
      fetchWallets()
      if (selectedWallet?.parentProfileId === adjustTarget.parentProfileId) {
        fetchDetail(adjustTarget.parentProfileId)
      }
    } catch (err: any) {
      setAdjustError(err.message || "Adjustment failed")
    } finally {
      setAdjustLoading(false)
    }
  }

  // Open adjust modal
  const openAdjust = (wallet: WalletSummary, type: "credit" | "debit") => {
    setAdjustTarget(wallet)
    setAdjustType(type)
    setAdjustAmount("")
    setAdjustNote("")
    setAdjustError("")
    setShowAdjust(true)
  }

  // Format date
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  // ─── Detail View ────────────────────────────────────────────
  if (selectedWallet) {
    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedWallet(null)
              setTransactions([])
            }}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{selectedWallet.parentName}</h1>
            <p className="text-sm text-gray-500">{selectedWallet.parentEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const w = wallets.find((wl) => wl.parentProfileId === selectedWallet.parentProfileId)
                if (w) openAdjust(w, "credit")
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Credit
            </button>
            <button
              onClick={() => {
                const w = wallets.find((wl) => wl.parentProfileId === selectedWallet.parentProfileId)
                if (w) openAdjust(w, "debit")
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Minus className="h-4 w-4" /> Debit
            </button>
          </div>
        </div>

        {/* Wallet summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniKPI label="Current Balance" value={`$${selectedWallet.balance.toFixed(2)}`} icon={Wallet} valueClass="text-[#1E3A5F]" iconClass="text-blue-400" />
          <MiniKPI label="Total Credited" value={`$${selectedWallet.totalCredited.toFixed(2)}`} icon={TrendingUp} valueClass="text-green-600" iconClass="text-green-400" />
          <MiniKPI label="Total Debited" value={`$${selectedWallet.totalDebited.toFixed(2)}`} icon={TrendingDown} valueClass="text-red-600" iconClass="text-red-400" />
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1E293B]">
              Transaction History ({selectedWallet.transactionCount})
            </h2>
            <button
              onClick={() => fetchDetail(selectedWallet.parentProfileId)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${detailLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No transactions found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.amount > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{tx.typeLabel}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          tx.amount > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {tx.amount > 0 ? "Credit" : "Debit"}
                      </span>
                    </div>
                    {(tx.bookingInfo || tx.description) && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {tx.bookingInfo || tx.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.amount > 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adjust modal (reused) */}
        {showAdjust && renderAdjustModal()}
      </div>
    )
  }

  // ─── Table columns ──────────────────────────────────────────
  const columns = [
    {
      key: "parentName",
      label: "Parent",
      sortable: true,
      render: (row: WalletSummary) => (
        <div>
          <p className="text-sm font-medium text-[#1E293B]">{row.parentName}</p>
          <p className="text-[11px] text-gray-400">{row.parentEmail}</p>
        </div>
      ),
    },
    {
      key: "parentStatus",
      label: "Status",
      sortable: true,
      render: (row: WalletSummary) => <StatusBadge status={row.parentStatus.toLowerCase()} />,
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      render: (row: WalletSummary) => (
        <span className={`text-sm font-bold ${row.balance > 0 ? "text-[#1E3A5F]" : "text-gray-400"}`}>
          ${row.balance.toFixed(2)}
        </span>
      ),
    },
    {
      key: "totalCredited",
      label: "Credited",
      sortable: true,
      render: (row: WalletSummary) => (
        <span className="text-sm text-green-600">${row.totalCredited.toFixed(2)}</span>
      ),
    },
    {
      key: "totalDebited",
      label: "Debited",
      sortable: true,
      render: (row: WalletSummary) => (
        <span className="text-sm text-red-600">${row.totalDebited.toFixed(2)}</span>
      ),
    },
    {
      key: "transactionCount",
      label: "Txns",
      sortable: true,
      render: (row: WalletSummary) => (
        <span className="text-sm text-gray-600">{row.transactionCount}</span>
      ),
    },
    {
      key: "lastActivity",
      label: "Last Activity",
      sortable: true,
      render: (row: WalletSummary) => (
        <span className="text-xs text-gray-500">
          {row.lastActivity
            ? new Date(row.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: WalletSummary) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchDetail(row.parentProfileId)}
            className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openAdjust(row, "credit")}
            className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Credit wallet"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => openAdjust(row, "debit")}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Debit wallet"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  // ─── Adjust Modal renderer (shared) ─────────────────────────
  function renderAdjustModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">
              {adjustType === "credit" ? "Credit" : "Debit"} Wallet
            </h3>
            <button
              onClick={() => {
                setShowAdjust(false)
                setAdjustTarget(null)
                setAdjustError("")
              }}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Target */}
          {adjustTarget && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{adjustTarget.parentName}</p>
              <p className="text-xs text-gray-500">{adjustTarget.parentEmail}</p>
              <p className="text-xs text-gray-400 mt-1">
                Current balance: <span className="font-medium text-[#1E3A5F]">${adjustTarget.balance.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* Error */}
          {adjustError && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {adjustError}
            </div>
          )}

          {/* Type toggle */}
          <div className="mb-4">
            <label className="text-sm text-gray-500 mb-2 block">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustType("credit")}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  adjustType === "credit"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <Plus className="h-4 w-4" /> Credit
              </button>
              <button
                onClick={() => setAdjustType("debit")}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  adjustType === "debit"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <Minus className="h-4 w-4" /> Debit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="text-sm text-gray-500 mb-1 block">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => {
                  setAdjustAmount(e.target.value)
                  setAdjustError("")
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Note */}
          <div className="mb-5">
            <label className="text-sm text-gray-500 mb-1 block">Note (required)</label>
            <textarea
              value={adjustNote}
              onChange={(e) => {
                setAdjustNote(e.target.value)
                setAdjustError("")
              }}
              rows={3}
              placeholder="Reason for adjustment (visible to parent)..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAdjust(false)
                setAdjustTarget(null)
                setAdjustError("")
              }}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjust}
              disabled={adjustLoading || !adjustAmount || !adjustNote.trim()}
              className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
                adjustType === "credit"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {adjustLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : adjustType === "credit" ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {adjustLoading ? "Processing..." : `${adjustType === "credit" ? "Credit" : "Debit"} $${adjustAmount || "0.00"}`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main List View ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Wallet Management</h1>
        <p className="text-sm text-gray-500 mt-1">View all parent wallets, balances, and transaction history</p>
      </div>

      {/* Banners */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MiniKPI label="Total Wallets" value={kpis.totalWallets} icon={Users} iconClass="text-blue-400" />
        <MiniKPI label="Active Wallets" value={kpis.activeWallets} icon={Wallet} valueClass="text-[#0D9488]" iconClass="text-[#0D9488]" />
        <MiniKPI label="Total Balance" value={`$${kpis.totalWalletBalance.toFixed(2)}`} icon={DollarSign} valueClass="text-[#1E3A5F]" iconClass="text-[#1E3A5F]" />
        <MiniKPI label="Total Credited" value={`$${kpis.totalCredited.toFixed(2)}`} icon={TrendingUp} valueClass="text-green-600" iconClass="text-green-400" />
        <MiniKPI label="Total Debited" value={`$${kpis.totalDebited.toFixed(2)}`} icon={TrendingDown} valueClass="text-red-600" iconClass="text-red-400" />
      </div>

      {/* Wallets table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={wallets}
          searchable
          searchPlaceholder="Search by parent name or email..."
          pageSize={25}
        />
      )}

      {/* Adjust modal */}
      {showAdjust && renderAdjustModal()}
    </div>
  )
}
