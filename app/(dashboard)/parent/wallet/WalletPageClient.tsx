"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  CreditCard,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────
interface WalletData {
  wallet: { id: string; balance: number }
  summary: {
    totalCredited: number
    totalDebited: number
    referralEarnings: number
    monthlyUsage: number
  }
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

interface Transaction {
  id: string
  amount: number
  type: string
  typeLabel: string
  description: string | null
  referenceId: string | null
  createdAt: string
  timestamp: string
}

interface GatewayInfo {
  gateways: string[]
  default: string
  topupMinAmount: number
  topupPresets: number[]
}

// ─── Gateway display metadata (same pattern as TeacherProfileClient) ──
const GATEWAY_META: Record<string, {
  label: string
  description: string
  icon: React.ReactNode
  color: string
  borderColor: string
  bgHover: string
  iconBg: string
}> = {
  PAYPAL: {
    label: "Pay with PayPal",
    description: "PayPal account, credit or debit card via PayPal",
    icon: <DollarSign className="w-5 h-5 text-[#003087]" />,
    color: "text-[#003087]",
    borderColor: "border-[#003087]",
    bgHover: "hover:bg-blue-50",
    iconBg: "bg-[#003087]/10",
  },
  CCAVENUE: {
    label: "Pay with Credit / Debit Card",
    description: "Credit card, debit card, net banking & UPI via CCAvenue",
    icon: <CreditCard className="w-5 h-5 text-[#0D9488]" />,
    color: "text-[#0D9488]",
    borderColor: "border-[#0D9488]",
    bgHover: "hover:bg-teal-50",
    iconBg: "bg-[#0D9488]/10",
  },
}

// ─── Component ────────────────────────────────────────────────────────
export default function WalletPageClient() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Top-up modal state
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [topUpGateway, setTopUpGateway] = useState("")
  const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo | null>(null)
  const [topUpLoading, setTopUpLoading] = useState(false)
  const [topUpError, setTopUpError] = useState("")

  // Fetch wallet data
  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const params = new URLSearchParams({ page: String(page), limit: "15" })
      if (typeFilter) params.set("type", typeFilter)
      const res = await fetch(`/api/wallet?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load wallet")
      }
      const data = await res.json()
      setWalletData(data)
    } catch (err: any) {
      setError(err.message || "Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  // Fetch gateways
  const fetchGateways = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/gateways")
      if (!res.ok) return
      const data = await res.json()
      setGatewayInfo(data)
      if (data.default) setTopUpGateway(data.default)
    } catch {
      // silent — gateways are optional until top-up
    }
  }, [])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  useEffect(() => {
    fetchGateways()
  }, [fetchGateways])

  // Handle top-up
  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount)
    setTopUpError("")

    if (!amount || amount <= 0) {
      setTopUpError("Enter a valid amount")
      return
    }
    if (gatewayInfo && amount < gatewayInfo.topupMinAmount) {
      setTopUpError(`Minimum top-up amount is $${gatewayInfo.topupMinAmount}`)
      return
    }

    try {
      setTopUpLoading(true)
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, gateway: topUpGateway }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Top-up failed")

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        setSuccessMsg("Top-up initiated successfully")
        setShowTopUp(false)
        setTopUpAmount("")
        setTimeout(() => setSuccessMsg(""), 4000)
      }
    } catch (err: any) {
      setTopUpError(err.message || "Top-up failed. Please try again.")
    } finally {
      setTopUpLoading(false)
    }
  }

  // Get current month name
  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" })

  if (loading && !walletData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const { wallet, summary, transactions, pagination } = walletData || {
    wallet: { id: "", balance: 0 },
    summary: { totalCredited: 0, totalDebited: 0, referralEarnings: 0, monthlyUsage: 0 },
    transactions: [],
    pagination: { page: 1, limit: 15, totalCount: 0, totalPages: 0, hasMore: false },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your wallet balance and view transactions</p>
        </div>
        <button
          onClick={() => {
            setShowTopUp(true)
            setTopUpError("")
            setTopUpAmount("")
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Top Up Wallet
        </button>
      </div>

      {/* Global error / success banners */}
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

      {/* ─── Summary Cards (4 cards) ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Available Balance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Available Balance</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${wallet.balance.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Current wallet balance</p>
        </div>

        {/* 2. Total Credited */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Credited</span>
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">${summary.totalCredited.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">All-time credits received</p>
        </div>

        {/* 3. Total Debited */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Debited</span>
            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">${summary.totalDebited.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">All-time wallet usage</p>
        </div>

        {/* 4. This Month's Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">{currentMonthName} Usage</span>
            <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">${summary.monthlyUsage.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Debited this month</p>
        </div>
      </div>

      {/* ─── Transaction History ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="REFERRAL_REWARD">Referral Reward</option>
                <option value="BOOKING_DISCOUNT">Wallet Used</option>
                <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
                <option value="SELF_TOP_UP">Wallet Top-Up</option>
                <option value="WELCOME_OFFER">Welcome Offer</option>
              </select>
            </div>
            {/* Refresh */}
            <button
              onClick={() => fetchWallet()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="divide-y divide-gray-50">
          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No transactions found</p>
              {typeFilter && (
                <button
                  onClick={() => setTypeFilter("")}
                  className="text-blue-600 text-sm mt-2 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                {/* Icon */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.amount > 0
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {tx.amount > 0 ? (
                    <ArrowDownRight className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.typeLabel}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.amount > 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {tx.amount > 0 ? "Credit" : "Debit"}
                    </span>
                  </div>
                  {tx.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {tx.description}
                    </p>
                  )}
                </div>

                {/* Amount & Time */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
              {pagination.totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasMore}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Top-Up Modal ─────────────────────────────────────────── */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Top Up Wallet</h3>
              <button
                onClick={() => {
                  setShowTopUp(false)
                  setTopUpAmount("")
                  setTopUpError("")
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Top-up error */}
            {topUpError && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {topUpError}
              </div>
            )}

            {/* Preset amounts */}
            {gatewayInfo?.topupPresets && gatewayInfo.topupPresets.length > 0 && (
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-2 block">Quick select</label>
                <div className="grid grid-cols-4 gap-2">
                  {gatewayInfo.topupPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setTopUpAmount(String(preset))
                        setTopUpError("")
                      }}
                      className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                        topUpAmount === String(preset)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom amount */}
            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-1 block">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min={gatewayInfo?.topupMinAmount || 15}
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => {
                    setTopUpAmount(e.target.value)
                    setTopUpError("")
                  }}
                  placeholder={`Min $${gatewayInfo?.topupMinAmount || 15}`}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment method — styled like TeacherProfileClient gateway buttons */}
            {gatewayInfo && gatewayInfo.gateways.length > 0 && (
              <div className="mb-5">
                <label className="text-sm text-gray-500 mb-2 block">Payment method</label>
                <div className="space-y-2">
                  {gatewayInfo.gateways.map((gw) => {
                    const meta = GATEWAY_META[gw]
                    if (!meta) return null
                    const isSelected = topUpGateway === gw
                    return (
                      <button
                        key={gw}
                        onClick={() => setTopUpGateway(gw)}
                        className={`group w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `${meta.borderColor} bg-white shadow-sm`
                            : `border-gray-200 ${meta.bgHover}`
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${meta.iconBg} flex items-center justify-center flex-shrink-0`}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? meta.color : "text-gray-900"}`}>
                            {meta.label}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{meta.description}</p>
                        </div>
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? meta.borderColor : "border-gray-300"
                        }`}>
                          {isSelected && (
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              gw === "PAYPAL" ? "bg-[#003087]" : "bg-[#0D9488]"
                            }`} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopUp(false)
                  setTopUpAmount("")
                  setTopUpError("")
                }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={topUpLoading || !topUpAmount || !topUpGateway}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {topUpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {topUpLoading ? "Processing..." : "Add Money"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
