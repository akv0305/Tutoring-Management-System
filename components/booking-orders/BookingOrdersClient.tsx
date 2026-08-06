"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  Calendar,
  User,
  BookOpen,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

/* ──────────────────── Types ──────────────────── */

interface ClassDetail {
  id: string
  status: string
  scheduledAt: string
  completedAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  isTrial: boolean
}

interface ClassBreakdown {
  total: number
  completed: number
  scheduled: number
  cancelledStudent: number
  cancelledTeacher: number
  noShowStudent: number
  noShowTeacher: number
  cancelledTotal: number
}

interface OrderRow {
  id: string
  orderRef: string
  studentName: string
  parentName: string
  teacherName: string
  subject: string
  packageName: string
  totalClasses: number
  totalAmount: number
  walletDeduction: number
  couponDiscount: number
  paidViaGateway: number
  paymentStatus: string
  paymentMethod: string
  orderStatus: string
  createdAt: string
  classBreakdown: ClassBreakdown
  delivered: number
  owed: number
  health: "on_track" | "attention" | "credit_owed" | "fulfilled"
  classes: ClassDetail[]
}

interface KPIs {
  totalOrders: number
  totalRevenue: number
  totalClassesPurchased: number
  totalClassesDelivered: number
  totalOwed: number
  ordersNeedingAttention: number
}

/* ──────────────────── Mini KPI ──────────────────── */

function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
  icon,
  iconBg,
}: {
  label: string
  value: string | number
  valueClass?: string
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ──────────────────── Health Badge ──────────────────── */

function HealthBadge({ health }: { health: string }) {
  const map: Record<string, { label: string; className: string }> = {
    fulfilled: { label: "Fulfilled", className: "bg-green-50 text-green-700 border-green-200" },
    on_track: { label: "On Track", className: "bg-blue-50 text-blue-700 border-blue-200" },
    attention: { label: "Needs Attention", className: "bg-amber-50 text-amber-700 border-amber-200" },
    credit_owed: { label: "Credit Owed", className: "bg-red-50 text-red-700 border-red-200" },
  }
  const cfg = map[health] || map.on_track
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

/* ──────────────────── Class Status Icon ──────────────────── */

function ClassStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "SCHEDULED":
    case "CONFIRMED":
    case "PENDING_PAYMENT":
      return <Clock className="w-4 h-4 text-blue-500" />
    case "CANCELLED_STUDENT":
    case "CANCELLED_TEACHER":
      return <XCircle className="w-4 h-4 text-red-500" />
    case "NO_SHOW_STUDENT":
    case "NO_SHOW_TEACHER":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-400" />
  }
}

/* ──────────────────── Order Detail Modal ──────────────────── */

function OrderDetailModal({
  order,
  onClose,
}: {
  order: OrderRow
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">{order.orderRef}</h2>
            <p className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Student</p>
              <p className="text-sm font-semibold text-[#1E293B]">{order.studentName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Teacher</p>
              <p className="text-sm font-semibold text-[#1E293B]">{order.teacherName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Subject</p>
              <p className="text-sm font-semibold text-[#1E293B]">{order.subject}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Health</p>
              <HealthBadge health={order.health} />
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="text-right font-semibold">${order.totalAmount.toFixed(2)}</span>
              {order.walletDeduction > 0 && (
                <>
                  <span className="text-gray-500">Wallet Used</span>
                  <span className="text-right text-green-600">-${order.walletDeduction.toFixed(2)}</span>
                </>
              )}
              {order.couponDiscount > 0 && (
                <>
                  <span className="text-gray-500">Coupon Discount</span>
                  <span className="text-right text-green-600">-${order.couponDiscount.toFixed(2)}</span>
                </>
              )}
              <span className="text-gray-500">Paid via Gateway</span>
              <span className="text-right font-semibold">${order.paidViaGateway.toFixed(2)}</span>
              <span className="text-gray-500">Payment Status</span>
              <span className="text-right">
                <StatusBadge status={order.paymentStatus.toLowerCase()} size="sm" />
              </span>
            </div>
          </div>

          {/* Class Delivery Progress */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Class Delivery — {order.totalClasses} Purchased
            </h3>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(order.classBreakdown.completed / order.totalClasses) * 100}%` }}
                />
                <div
                  className="bg-blue-400 transition-all"
                  style={{ width: `${(order.classBreakdown.scheduled / order.totalClasses) * 100}%` }}
                />
                <div
                  className="bg-red-400 transition-all"
                  style={{ width: `${(order.classBreakdown.cancelledTotal / order.totalClasses) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Completed: {order.classBreakdown.completed}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                Scheduled: {order.classBreakdown.scheduled}
              </span>
              {order.classBreakdown.cancelledStudent > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  Cancelled (Student): {order.classBreakdown.cancelledStudent}
                </span>
              )}
              {order.classBreakdown.cancelledTeacher > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  Cancelled (Teacher): {order.classBreakdown.cancelledTeacher}
                </span>
              )}
              {order.classBreakdown.noShowStudent > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  No-Show (Student): {order.classBreakdown.noShowStudent}
                </span>
              )}
              {order.classBreakdown.noShowTeacher > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  No-Show (Teacher): {order.classBreakdown.noShowTeacher}
                </span>
              )}
            </div>

            {order.owed > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>{order.owed} class{order.owed > 1 ? "es" : ""}</strong> paid for but not delivered.
                  Parent is owed a credit or reschedule.
                </span>
              </div>
            )}
          </div>

          {/* Individual Classes Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class Timeline</h3>
            <div className="space-y-1.5">
              {order.classes.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 text-sm"
                >
                  <span className="text-xs text-gray-400 w-6 text-center font-medium">{i + 1}</span>
                  <ClassStatusIcon status={c.status} />
                  <span className="flex-1 text-gray-700">
                    {new Date(c.scheduledAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" · "}
                    {new Date(c.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                  <StatusBadge
                    status={c.status.toLowerCase().replace("_", " ")}
                    size="sm"
                  />
                  {c.cancelReason && (
                    <span className="text-[11px] text-gray-400 max-w-[150px] truncate" title={c.cancelReason}>
                      {c.cancelReason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── Main Component ──────────────────── */

export default function BookingOrdersClient({ role }: { role: "ADMIN" | "COORDINATOR" | "PARENT" }) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [kpis, setKpis] = useState<KPIs>({
    totalOrders: 0,
    totalRevenue: 0,
    totalClassesPurchased: 0,
    totalClassesDelivered: 0,
    totalOwed: 0,
    ordersNeedingAttention: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null)
  const [healthFilter, setHealthFilter] = useState<string>("all")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch("/api/booking-orders")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load booking orders")
      }
      const data = await res.json()
      setOrders(data.orders || [])
      setKpis(data.kpis || {})
    } catch (err: any) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const filtered = healthFilter === "all" ? orders : orders.filter((o) => o.health === healthFilter)

  const columns = [
    {
      key: "orderRef",
      label: "Order",
      sortable: true,
      render: (r: OrderRow) => (
        <button
          onClick={() => setDetailOrder(r)}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          {r.orderRef}
        </button>
      ),
    },
    ...(role !== "PARENT"
      ? [
          {
            key: "studentName",
            label: "Student",
            sortable: true,
            render: (r: OrderRow) => (
              <div>
                <p className="text-sm font-medium text-[#1E293B]">{r.studentName}</p>
                <p className="text-xs text-gray-400">{r.parentName}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "teacherName",
      label: "Teacher",
      sortable: true,
      render: (r: OrderRow) => <span className="text-sm text-gray-700">{r.teacherName}</span>,
    },
    {
      key: "subject",
      label: "Subject",
      sortable: true,
      render: (r: OrderRow) => <span className="text-sm text-gray-700">{r.subject}</span>,
    },
    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,
      render: (r: OrderRow) => <span className="text-sm font-bold text-[#1E293B]">${r.totalAmount.toFixed(2)}</span>,
    },
    {
      key: "totalClasses",
      label: "Classes",
      sortable: true,
      render: (r: OrderRow) => (
        <div className="text-center">
          <p className="text-sm font-bold text-[#1E293B]">{r.totalClasses}</p>
          <p className="text-[10px] text-gray-400">
            {r.classBreakdown.completed}✓ {r.classBreakdown.scheduled}⏳{" "}
            {r.classBreakdown.cancelledTotal > 0 && (
              <span className="text-red-500">{r.classBreakdown.cancelledTotal}✗</span>
            )}
          </p>
        </div>
      ),
    },
    {
      key: "owed",
      label: "Owed",
      sortable: true,
      render: (r: OrderRow) => (
        <span className={`text-sm font-bold ${r.owed > 0 ? "text-red-600" : "text-gray-400"}`}>
          {r.owed > 0 ? r.owed : "—"}
        </span>
      ),
    },
    {
      key: "health",
      label: "Health",
      sortable: true,
      render: (r: OrderRow) => <HealthBadge health={r.health} />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (r: OrderRow) => (
        <span className="text-xs text-gray-400">
          {new Date(r.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r: OrderRow) => (
        <button
          onClick={() => setDetailOrder(r)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="View details"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Booking Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track class delivery against what was purchased
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniKPI
          label="Total Orders"
          value={kpis.totalOrders}
          icon={<Package className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <MiniKPI
          label="Revenue"
          value={`$${kpis.totalRevenue.toFixed(2)}`}
          valueClass="text-green-600"
          icon={<CreditCard className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50"
        />
        <MiniKPI
          label="Purchased"
          value={kpis.totalClassesPurchased}
          icon={<BookOpen className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <MiniKPI
          label="Delivered"
          value={kpis.totalClassesDelivered}
          valueClass="text-green-600"
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50"
        />
        <MiniKPI
          label="Credits Owed"
          value={kpis.totalOwed}
          valueClass={kpis.totalOwed > 0 ? "text-red-600" : "text-gray-400"}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        <MiniKPI
          label="Needs Attention"
          value={kpis.ordersNeedingAttention}
          valueClass={kpis.ordersNeedingAttention > 0 ? "text-amber-600" : "text-gray-400"}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Health Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Orders" },
          { key: "fulfilled", label: "Fulfilled" },
          { key: "on_track", label: "On Track" },
          { key: "attention", label: "Needs Attention" },
          { key: "credit_owed", label: "Credit Owed" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setHealthFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              healthFilter === f.key
                ? "bg-[#1E293B] text-white border-[#1E293B]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({orders.filter((o) => f.key === "all" || o.health === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search by order ref, student, teacher, subject..."
        pageSize={10}
      />

      {/* Detail Modal */}
      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </div>
  )
}
