"use client"

import React from "react"
import {
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Plus,
  BookOpen,
  MessageCircle,
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
}: {
  childName: string
  activePackages: ActivePkg[]
  pastPackages: PastPkg[]
  kpis: KPIs
}) {
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors">
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
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                    Renew Package
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    <Calendar className="w-4 h-4" />
                    View Schedule
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
              <button className="px-4 py-2 border border-white/40 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                Browse All Packages
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#F59E0B]/90 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Contact Coordinator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
