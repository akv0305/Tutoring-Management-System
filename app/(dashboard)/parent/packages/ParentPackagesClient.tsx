// app/(dashboard)/parent/packages/ParentPackagesClient.tsx

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  BookOpen,
  MessageCircle,
  Loader2,
  X,
  ShoppingCart,
  Star,
  Filter,
  ArrowRight,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"

type ActivePkg = {
  id: string
  name: string
  subject: string
  teacher: string
  teacherInitials: string
  total: number
  used: number
  remaining: number
  expiry: string
  expiresInDays: number
  pct: number
  barColor: string
  status: string
}

type PastPkg = {
  id: string
  name: string
  purchaseDate: string
  classCount: number
  totalPaid: string
  status: string
}

type KPIs = {
  activeCount: number
  totalPurchased: number
  totalUsed: number
  totalRemaining: number
}

type TemplatePkg = {
  id: string
  name: string
  subjectId: string
  subjectName: string
  classesIncluded: number
  validityDays: number
  price: string
  priceNum: number
  description: string
  isPopular: boolean
}

type CatalogSubject = {
  id: string
  name: string
}

function ProgressBar({
  used,
  total,
  colorClass,
}: {
  used: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">
          {used} used · {total - used} remaining
        </span>
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ParentPackagesClient({
  childName,
  activePackages,
  pastPackages,
  kpis,
  packageTemplates = [],
  catalogSubjects = [],
}: {
  childName: string
  activePackages: ActivePkg[]
  pastPackages: PastPkg[]
  kpis: KPIs
  packageTemplates?: TemplatePkg[]
  catalogSubjects?: CatalogSubject[]
}) {
  const router = useRouter()

  // Subject filter for catalog
  const [selectedSubject, setSelectedSubject] = useState<string>("all")

  const filteredTemplates =
    selectedSubject === "all"
      ? packageTemplates
      : packageTemplates.filter((t) => t.subjectId === selectedSubject)

  // Coordinator message modal state
  const [showCoordModal, setShowCoordModal] = useState(false)
  const [coordMessage, setCoordMessage] = useState("")
  const [coordSending, setCoordSending] = useState(false)
  const [coordSuccess, setCoordSuccess] = useState("")
  const [coordError, setCoordError] = useState("")

  async function handleSendCoordinatorMessage() {
    if (!coordMessage.trim()) {
      setCoordError("Please enter a message.")
      return
    }
    setCoordSending(true)
    setCoordError("")
    setCoordSuccess("")
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "coordinator",
          title: "Message from Parent",
          message: coordMessage.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCoordError(data.error || "Failed to send message.")
      } else {
        setCoordSuccess(`Message sent to ${data.coordinatorName || "your coordinator"}.`)
        setCoordMessage("")
        setTimeout(() => {
          setShowCoordModal(false)
          setCoordSuccess("")
        }, 2000)
      }
    } catch {
      setCoordError("Network error. Please try again.")
    }
    setCoordSending(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Packages</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage {childName}&apos;s learning packages and sessions
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Packages"
          value={String(kpis.activeCount)}
          subtitle="Currently running"
          change=""
          changeType="neutral"
          icon={Package}
        />
        <KPICard
          title="Total Classes Purchased"
          value={String(kpis.totalPurchased)}
          subtitle="Across all packages"
          change=""
          changeType="neutral"
          icon={BookOpen}
        />
        <KPICard
          title="Classes Used"
          value={String(kpis.totalUsed)}
          subtitle="Sessions completed"
          change=""
          changeType="neutral"
          icon={CheckCircle}
        />
        <KPICard
          title="Classes Remaining"
          value={String(kpis.totalRemaining)}
          subtitle="Across active packs"
          change={kpis.totalRemaining <= 3 ? "Renew soon" : ""}
          changeType={kpis.totalRemaining <= 3 ? "negative" : "neutral"}
          icon={Clock}
        />
      </div>

      {/* Active Packages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">
              Active Packages
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {activePackages.length} package{activePackages.length !== 1 ? "s" : ""} currently active
            </p>
          </div>
          <button
            onClick={() => router.push("/parent/teachers")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buy New Package
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {activePackages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No active packages. Purchase one to get started.
            </p>
          ) : (
            activePackages.map((pkg) => (
              <div key={pkg.id} className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#1E3A5F]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1E293B]">
                          {pkg.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white text-[9px] font-bold">
                            {pkg.teacherInitials}
                          </div>
                          <span className="text-xs text-gray-500">
                            {pkg.teacher}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={pkg.status} />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                    {pkg.subject}
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    used={pkg.used}
                    total={pkg.total}
                    colorClass={pkg.barColor}
                  />
                </div>

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    Expires: {pkg.expiry}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    {pkg.remaining} of {pkg.total} classes remaining
                  </span>
                </div>

                {pkg.expiresInDays <= 20 && (
                  <div className="flex items-center gap-1.5 mt-2.5 px-3 py-2 bg-[#F59E0B]/10 rounded-lg border border-[#F59E0B]/20">
                    <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                    <p className="text-xs font-medium text-[#B45309]">
                      Expires soon — {pkg.expiresInDays} days left. Consider
                      renewing.
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 mt-4 pt-4 flex items-center gap-3">
                  <button
                    onClick={() => router.push("/parent/classes")}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    View Schedule
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Available Packages Catalog (NEW) ──────────────────────── */}
      {packageTemplates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#1E293B]">
                Available Packages
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Browse our package catalog and choose the best fit for {childName}
              </p>
            </div>
            {catalogSubjects.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
                >
                  <option value="all">All Subjects</option>
                  {catalogSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-5">
            {filteredTemplates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No packages available for the selected subject.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={[
                      "relative rounded-xl border p-5 flex flex-col justify-between transition-all hover:shadow-md",
                      tpl.isPopular
                        ? "border-[#F59E0B]/40 bg-[#F59E0B]/5"
                        : "border-gray-100 bg-gray-50/30",
                    ].join(" ")}
                  >
                    {/* Popular badge */}
                    {tpl.isPopular && (
                      <div className="absolute -top-2.5 left-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F59E0B] text-white text-xs font-bold rounded-full shadow-sm">
                          <Star className="w-3 h-3" />
                          Popular
                        </span>
                      </div>
                    )}

                    <div className={tpl.isPopular ? "mt-2" : ""}>
                      {/* Subject badge */}
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 mb-3">
                        {tpl.subjectName}
                      </span>

                      {/* Package name */}
                      <h3 className="text-sm font-semibold text-[#1E293B] leading-snug">
                        {tpl.name}
                      </h3>

                      {/* Description */}
                      {tpl.description && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                          {tpl.description}
                        </p>
                      )}

                      {/* Details row */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
                          {tpl.classesIncluded} classes
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                          {tpl.validityDays} days validity
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mt-3">
                        <span className="text-lg font-bold text-[#1E3A5F]">
                          {tpl.price}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          / package
                        </span>
                      </div>
                    </div>

                    {/* Buy button */}
                    <button
                      onClick={() => router.push("/parent/teachers")}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy Package
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Package History */}
      {pastPackages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-[#1E293B]">
              Package History
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Past packages and purchases
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {pastPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">
                    {pkg.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Purchased {pkg.purchaseDate} · {pkg.classCount} classes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-600">
                    {pkg.totalPaid}
                  </p>
                  <StatusBadge status={pkg.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA card */}
      <div className="rounded-xl overflow-hidden">
        <div
          className="p-6"
          style={{
            background: "linear-gradient(135deg, #0D9488 0%, #1E3A5F 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Ready to add more sessions?
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Explore our packages and keep {childName}&apos;s learning
                momentum going strong.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push("/parent/teachers")}
                className="px-4 py-2 border border-white/40 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Browse All Packages
              </button>
              <button
                onClick={() => {
                  setCoordMessage("")
                  setCoordError("")
                  setCoordSuccess("")
                  setShowCoordModal(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#F59E0B]/90 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Coordinator
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coordinator Message Modal */}
      {showCoordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1E293B]">Contact Coordinator</h3>
              <button
                onClick={() => setShowCoordModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Send a message to your assigned education coordinator. They will be notified and respond as soon as possible.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Message *</label>
              <textarea
                value={coordMessage}
                onChange={(e) => setCoordMessage(e.target.value)}
                rows={4}
                placeholder="e.g., I'd like to discuss package options for my child..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none resize-none"
              />
            </div>

            {coordError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{coordError}
              </div>
            )}

            {coordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />{coordSuccess}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCoordModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCoordinatorMessage}
                disabled={coordSending || !!coordSuccess}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {coordSending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
