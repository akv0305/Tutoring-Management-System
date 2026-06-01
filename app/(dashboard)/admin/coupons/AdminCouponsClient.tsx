"use client"

import React, { useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  ToggleRight,
  ToggleLeft,
  Tag,
  Percent,
  DollarSign,
  Users,
  User,
  Globe,
  Copy,
  Check,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Ticket,
  TrendingUp,
  Search,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ─── Types ──────────────────────────────────────────────── */

type AssignedParent = {
  parentProfileId: string
  name: string
  email: string
}

type UsageEntry = {
  parentName: string
  parentEmail: string
  discountApplied: number
  usedAt: string
}

type Coupon = Record<string, unknown> & {
  id: string
  code: string
  name: string
  description: string | null
  discountType: string
  discountValue: number
  scope: string
  maxUsesTotal: number | null
  maxUsesPerUser: number
  usedCount: number
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  validFrom: string
  validUntil: string
  status: string
  createdAt: string
  totalAssignments: number
  totalUsages: number
  assignedParents: AssignedParent[]
  recentUsages: UsageEntry[]
}

type KPIs = {
  totalCoupons: number
  activeCoupons: number
  expiredCoupons: number
  disabledCoupons: number
  totalUsages: number
  totalDiscountGiven: number
}

type ParentOption = {
  parentProfileId: string
  name: string
  email: string
}

/* ─── MiniKPI ────────────────────────────────────────────── */

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

/* ─── Scope Badge ────────────────────────────────────────── */

function ScopeBadge({ scope }: { scope: string }) {
  const config: Record<string, { icon: React.ElementType; label: string; bg: string; text: string; border: string }> = {
    ALL_USERS: { icon: Globe, label: "All Users", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    MULTI_USER: { icon: Users, label: "Multi User", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    SINGLE_USER: { icon: User, label: "Single User", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  }
  const c = config[scope] || config.ALL_USERS
  const IconComp = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${c.bg} ${c.text} border ${c.border}`}>
      <IconComp className="w-3 h-3" />
      {c.label}
    </span>
  )
}

/* ─── Discount Label ─────────────────────────────────────── */

function DiscountLabel({ type, value, maxDiscount }: { type: string; value: number; maxDiscount: number | null }) {
  if (type === "PERCENTAGE") {
    return (
      <div>
        <span className="font-bold text-[#0D9488]">{value}%</span>
        <span className="text-gray-400 text-[10px] ml-1">off</span>
        {maxDiscount && (
          <p className="text-[10px] text-gray-400">max ${maxDiscount.toFixed(2)}</p>
        )}
      </div>
    )
  }
  return (
    <div>
      <span className="font-bold text-[#0D9488]">${value.toFixed(2)}</span>
      <span className="text-gray-400 text-[10px] ml-1">off</span>
    </div>
  )
}

/* ─── Parent Multi-Select ────────────────────────────────── */

function ParentMultiSelect({
  parents,
  selected,
  onChange,
  singleOnly,
}: {
  parents: ParentOption[]
  selected: string[]
  onChange: (ids: string[]) => void
  singleOnly?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = parents.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleParent = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      if (singleOnly) {
        onChange([id])
      } else {
        onChange([...selected, id])
      }
    }
  }

  const selectedParents = parents.filter((p) => selected.includes(p.parentProfileId))

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selectedParents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedParents.map((p) => (
            <span
              key={p.parentProfileId}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20"
            >
              {p.name}
              <button
                type="button"
                onClick={() => toggleParent(p.parentProfileId)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search parents by name or email..."
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        />
      </div>

      {/* List */}
      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-400 text-center">No parents found</p>
        ) : (
          filtered.slice(0, 50).map((p) => {
            const isSelected = selected.includes(p.parentProfileId)
            return (
              <button
                key={p.parentProfileId}
                type="button"
                onClick={() => toggleParent(p.parentProfileId)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-[#0D9488]/5" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{p.name}</p>
                  <p className="text-[11px] text-gray-400">{p.email}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#0D9488] flex-shrink-0" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─── Create / Edit Coupon Modal ─────────────────────────── */

function CouponModal({
  coupon,
  parents,
  onClose,
  onSuccess,
}: {
  coupon: Coupon | null // null = create mode
  parents: ParentOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!coupon

  const [name, setName] = useState(coupon?.name || "")
  const [description, setDescription] = useState(coupon?.description || "")
  const [discountType, setDiscountType] = useState(coupon?.discountType || "PERCENTAGE")
  const [discountValue, setDiscountValue] = useState(coupon ? String(coupon.discountValue) : "")
  const [scope, setScope] = useState(coupon?.scope || "ALL_USERS")
  const [maxUsesTotal, setMaxUsesTotal] = useState(coupon?.maxUsesTotal ? String(coupon.maxUsesTotal) : "")
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(coupon ? String(coupon.maxUsesPerUser) : "1")
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.minOrderAmount ? String(coupon.minOrderAmount) : "")
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(coupon?.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "")
  const [validFrom, setValidFrom] = useState(
    coupon ? new Date(coupon.validFrom).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  )
  const [validUntil, setValidUntil] = useState(
    coupon ? new Date(coupon.validUntil).toISOString().slice(0, 16) : ""
  )
  const [assignedParentIds, setAssignedParentIds] = useState<string[]>(
    coupon?.assignedParents?.map((p) => p.parentProfileId) || []
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")

    if (!name.trim()) { setError("Coupon name is required."); return }
    if (!discountValue || Number(discountValue) <= 0) { setError("Discount value must be greater than 0."); return }
    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) { setError("Percentage cannot exceed 100%."); return }
    if (!validUntil) { setError("Expiry date is required."); return }
    if (new Date(validUntil) <= new Date()) { setError("Expiry date must be in the future."); return }
    if ((scope === "SINGLE_USER" || scope === "MULTI_USER") && assignedParentIds.length === 0) {
      setError(`Please assign at least one parent for ${scope === "SINGLE_USER" ? "single" : "multi"} user scope.`)
      return
    }
    if (scope === "SINGLE_USER" && assignedParentIds.length > 1) {
      setError("Single user scope allows only one parent.")
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        discountType,
        discountValue: Number(discountValue),
        scope,
        maxUsesTotal: maxUsesTotal ? Number(maxUsesTotal) : null,
        maxUsesPerUser: Number(maxUsesPerUser) || 1,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        assignedParentIds: scope === "ALL_USERS" ? [] : assignedParentIds,
      }

      let res: Response
      if (isEdit) {
        res = await fetch("/api/admin/coupons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponId: coupon!.id, action: "update", ...payload }),
        })
      } else {
        res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0D9488]/10 rounded-lg">
              <Ticket className="w-5 h-5 text-[#0D9488]" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              {isEdit ? "Edit Coupon" : "Create Coupon"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Coupon Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Special 20% Off"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Internal notes about this coupon..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType("PERCENTAGE")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    discountType === "PERCENTAGE"
                      ? "bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  Percent
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("FIXED_AMOUNT")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    discountType === "FIXED_AMOUNT"
                      ? "bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Fixed
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Discount Value * {discountType === "PERCENTAGE" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                min="0"
                max={discountType === "PERCENTAGE" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 25.00"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Access Scope *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "ALL_USERS", icon: Globe, label: "All Users" },
                { value: "MULTI_USER", icon: Users, label: "Multi User" },
                { value: "SINGLE_USER", icon: User, label: "Single User" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setScope(opt.value)
                    if (opt.value === "ALL_USERS") setAssignedParentIds([])
                    if (opt.value === "SINGLE_USER" && assignedParentIds.length > 1) {
                      setAssignedParentIds([assignedParentIds[0]])
                    }
                  }}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    scope === opt.value
                      ? "bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parent Assignment (for SINGLE_USER / MULTI_USER) */}
          {scope !== "ALL_USERS" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Assign to Parent{scope === "MULTI_USER" ? "s" : ""} *
              </label>
              <ParentMultiSelect
                parents={parents}
                selected={assignedParentIds}
                onChange={setAssignedParentIds}
                singleOnly={scope === "SINGLE_USER"}
              />
            </div>
          )}

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Uses Limit</label>
              <input
                type="number"
                min="1"
                value={maxUsesTotal}
                onChange={(e) => setMaxUsesTotal(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Leave blank for unlimited</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Uses Per User</label>
              <input
                type="number"
                min="1"
                value={maxUsesPerUser}
                onChange={(e) => setMaxUsesPerUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
          </div>

          {/* Amount Constraints */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="No minimum"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            {discountType === "PERCENTAGE" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount Cap ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="No cap"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid From</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid Until *</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── View Coupon Detail Modal ───────────────────────────── */

function CouponDetailModal({
  coupon,
  onClose,
}: {
  coupon: Coupon
  onClose: () => void
}) {
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(coupon.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const discountLabel =
    coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}% off${coupon.maxDiscountAmount ? ` (max $${coupon.maxDiscountAmount.toFixed(2)})` : ""}`
      : `$${coupon.discountValue.toFixed(2)} off`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0D9488]/10 rounded-lg">
              <Tag className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">{coupon.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{coupon.code}</code>
                <button onClick={handleCopyCode} className="text-gray-400 hover:text-[#0D9488] transition-colors">
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status + Scope */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={coupon.status.toLowerCase()} size="sm" />
            <ScopeBadge scope={coupon.scope} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Discount</p>
              <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{discountLabel}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Usage</p>
              <p className="text-sm font-semibold text-[#1E293B] mt-0.5">
                {coupon.usedCount} / {coupon.maxUsesTotal ?? "∞"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Per User</p>
              <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{coupon.maxUsesPerUser} use{coupon.maxUsesPerUser !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Min Order</p>
              <p className="text-sm font-semibold text-[#1E293B] mt-0.5">
                {coupon.minOrderAmount ? `$${coupon.minOrderAmount.toFixed(2)}` : "None"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Valid From</p>
              <p className="text-xs font-medium text-[#1E293B] mt-0.5">{formatDate(coupon.validFrom)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Valid Until</p>
              <p className="text-xs font-medium text-[#1E293B] mt-0.5">{formatDate(coupon.validUntil)}</p>
            </div>
          </div>

          {coupon.description && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Description</p>
              <p className="text-sm text-gray-600">{coupon.description}</p>
            </div>
          )}

          {/* Assigned Parents */}
          {coupon.assignedParents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Assigned Parents ({coupon.assignedParents.length})
              </p>
              <div className="space-y-1.5">
                {coupon.assignedParents.map((p) => (
                  <div
                    key={p.parentProfileId}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.email}</p>
                    </div>
                    <User className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Usages */}
          {coupon.recentUsages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Recent Usages ({coupon.totalUsages})
              </p>
              <div className="space-y-1.5">
                {coupon.recentUsages.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{u.parentName}</p>
                      <p className="text-[11px] text-gray-400">{u.parentEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0D9488]">-${u.discountApplied.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(u.usedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export function AdminCouponsClient({
  coupons: initialCoupons,
  kpis,
  parents,
}: {
  coupons: Coupon[]
  kpis: KPIs
  parents: ParentOption[]
}) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)
  const [viewCoupon, setViewCoupon] = useState<Coupon | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = statusFilter === "all"
    ? coupons
    : coupons.filter((c) => c.status === statusFilter)

  const handleSuccess = () => {
    window.location.reload()
  }

  const handleToggleStatus = async (coupon: Coupon) => {
    const action = coupon.status === "ACTIVE" ? "disable" : "enable"
    setActionLoading(coupon.id)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: coupon.id, action }),
      })
      const data = await res.json()
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id
              ? { ...c, status: action === "disable" ? "DISABLED" : "ACTIVE" }
              : c
          )
        )
      } else {
        alert(data.error || "Failed to update coupon status.")
      }
    } catch {
      alert("Network error.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return
    setActionLoading(coupon.id)
    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
      } else {
        alert(data.error || "Failed to delete coupon.")
      }
    } catch {
      alert("Network error.")
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (row: Coupon) => (
        <div>
          <code className="text-xs font-mono font-bold text-[#1E3A5F] bg-gray-50 px-2 py-0.5 rounded">
            {row.code}
          </code>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[140px]">{row.name}</p>
        </div>
      ),
    },
    {
      key: "discountType",
      label: "Discount",
      sortable: true,
      render: (row: Coupon) => (
        <DiscountLabel
          type={row.discountType}
          value={row.discountValue}
          maxDiscount={row.maxDiscountAmount}
        />
      ),
    },
    {
      key: "scope",
      label: "Scope",
      render: (row: Coupon) => <ScopeBadge scope={row.scope} />,
    },
    {
      key: "usedCount",
      label: "Usage",
      sortable: true,
      render: (row: Coupon) => (
        <span className="font-semibold text-[#1E293B]">
          {row.usedCount}
          <span className="text-gray-400 font-normal">
            {" "}/ {row.maxUsesTotal ?? "∞"}
          </span>
        </span>
      ),
    },
    {
      key: "totalAssignments",
      label: "Assigned",
      sortable: true,
      render: (row: Coupon) => {
        if (row.scope === "ALL_USERS") {
          return <span className="text-xs text-gray-400">Everyone</span>
        }
        return (
          <span className="text-sm font-medium text-[#1E293B]">
            {row.totalAssignments} parent{row.totalAssignments !== 1 ? "s" : ""}
          </span>
        )
      },
    },
    {
      key: "validUntil",
      label: "Expires",
      sortable: true,
      render: (row: Coupon) => {
        const date = new Date(row.validUntil)
        const isExpiringSoon =
          row.status === "ACTIVE" && date.getTime() - Date.now() < 7 * 24 * 3600 * 1000
        return (
          <div>
            <span className={`text-xs ${isExpiringSoon ? "text-amber-600 font-medium" : "text-gray-500"}`}>
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {isExpiringSoon && row.status === "ACTIVE" && (
              <p className="text-[10px] text-amber-500">Expiring soon</p>
            )}
          </div>
        )
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: Coupon) => <StatusBadge status={row.status.toLowerCase()} size="sm" />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Coupon) => {
        const isLoading = actionLoading === row.id
        return (
          <div className="flex items-center gap-0.5">
            <button
              title="View Details"
              onClick={() => setViewCoupon(row)}
              disabled={isLoading}
              className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              title="Edit"
              onClick={() => setEditCoupon(row)}
              disabled={isLoading}
              className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              title={row.status === "ACTIVE" ? "Disable" : "Enable"}
              onClick={() => handleToggleStatus(row)}
              disabled={isLoading || row.status === "EXPIRED"}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                row.status === "ACTIVE"
                  ? "text-[#0D9488] hover:bg-teal-50"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : row.status === "ACTIVE" ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              title="Delete"
              onClick={() => handleDelete(row)}
              disabled={isLoading || row.usedCount > 0}
              className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Discount Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage promotional discount codes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <MiniKPI label="Total Coupons" value={kpis.totalCoupons} icon={Ticket} />
        <MiniKPI label="Active" value={kpis.activeCoupons} icon={ToggleRight} valueClass="text-[#22C55E]" iconClass="text-green-400" />
        <MiniKPI label="Expired" value={kpis.expiredCoupons} icon={Calendar} valueClass="text-amber-600" iconClass="text-amber-400" />
        <MiniKPI label="Disabled" value={kpis.disabledCoupons} icon={ToggleLeft} valueClass="text-gray-400" iconClass="text-gray-300" />
        <MiniKPI label="Total Uses" value={kpis.totalUsages} icon={Users} valueClass="text-[#1E3A5F]" iconClass="text-blue-400" />
        <MiniKPI
          label="Discounts Given"
          value={`$${kpis.totalDiscountGiven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          valueClass="text-[#0D9488]"
          iconClass="text-teal-400"
        />
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-l-4 border-[#F59E0B] rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Note:</span> Coupons cannot be combined with wallet balance. Parents must choose either a coupon discount or wallet balance during booking, not both.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "all", label: `All (${coupons.length})` },
          { key: "ACTIVE", label: `Active (${kpis.activeCoupons})` },
          { key: "EXPIRED", label: `Expired (${kpis.expiredCoupons})` },
          { key: "DISABLED", label: `Disabled (${kpis.disabledCoupons})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-white text-[#1E3A5F] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search by code or name..."
        pageSize={10}
      />

      {/* Modals */}
      {showCreateModal && (
        <CouponModal
          coupon={null}
          parents={parents}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      {editCoupon && (
        <CouponModal
          coupon={editCoupon}
          parents={parents}
          onClose={() => setEditCoupon(null)}
          onSuccess={handleSuccess}
        />
      )}
      {viewCoupon && (
        <CouponDetailModal
          coupon={viewCoupon}
          onClose={() => setViewCoupon(null)}
        />
      )}
    </div>
  )
}
