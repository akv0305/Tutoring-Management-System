"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  Calendar,
  CreditCard,
  Settings,
  CheckCheck,
  Bell,
  Loader2,
  X,
} from "lucide-react"

/* ——— Types ——— */
type FilterKey = "all" | "unread" | "class" | "payment" | "system"

type Notification = {
  id: string
  type: "class" | "payment" | "system"
  title: string
  message: string
  timestamp: string
  isUnread: boolean
}

/* ——— Type config ——— */
const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ElementType; borderColor: string; bgUnread: string; iconBg: string; iconColor: string }
> = {
  class: {
    icon: Calendar,
    borderColor: "border-l-blue-500",
    bgUnread: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  payment: {
    icon: CreditCard,
    borderColor: "border-l-green-500",
    bgUnread: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  system: {
    icon: Settings,
    borderColor: "border-l-gray-400",
    bgUnread: "bg-gray-50",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
}

/* ——— Filter tabs ——— */
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "unread",  label: "Unread" },
  { key: "class",   label: "Classes" },
  { key: "payment", label: "Payments" },
  { key: "system",  label: "System" },
]

/* ——— Page ——— */
export default function TeacherNotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  /* Fetch notifications from API */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=100")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {
      /* silently fail */
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  /* Computed values */
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.isUnread).length,
    [notifications]
  )

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notifications.length,
      unread: notifications.filter((n) => n.isUnread).length,
      class: notifications.filter((n) => n.type === "class").length,
      payment: notifications.filter((n) => n.type === "payment").length,
      system: notifications.filter((n) => n.type === "system").length,
    }
    return counts
  }, [notifications])

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === "all") return true
      if (activeFilter === "unread") return n.isUnread
      return n.type === activeFilter
    })
  }, [activeFilter, notifications])

  /* Actions */
  async function markAllRead() {
    setMarkingAll(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isUnread: false }))
        )
      }
    } catch {
      /* silently fail */
    } finally {
      setMarkingAll(false)
    }
  }

  async function markOneRead(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
        )
      }
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null)
    }
  }

  async function dismissOne(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", id }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null)
    }
  }

  /* ——— Loading state ——— */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0 || markingAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          {markingAll ? "Marking..." : "Mark All Read"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeFilter === f.key
                ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {filterCounts[f.key] > 0 && (
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  activeFilter === f.key
                    ? "bg-white text-[#1E3A5F]"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filterCounts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-10 flex flex-col items-center justify-center text-center">
            <Bell className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">
              No notifications in this category.
            </p>
          </div>
        )}
        {filtered.map((n) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
          const Icon = cfg.icon
          const isActioning = actionLoading === n.id

          return (
            <div
              key={n.id}
              className={`rounded-lg border border-gray-100 border-l-4 ${cfg.borderColor} p-4 flex items-start gap-4 transition-colors ${
                n.isUnread ? cfg.bgUnread : "bg-white"
              }`}
            >
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  n.isUnread ? cfg.iconBg : "bg-gray-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    n.isUnread ? cfg.iconColor : "text-gray-500"
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-relaxed ${
                    n.isUnread
                      ? "font-semibold text-[#1E293B]"
                      : "text-gray-600"
                  }`}
                >
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.timestamp}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {n.isUnread && (
                  <button
                    onClick={() => markOneRead(n.id)}
                    disabled={isActioning}
                    className="text-xs text-[#0D9488] hover:text-teal-700 font-medium disabled:opacity-40"
                  >
                    {isActioning ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Mark read"
                    )}
                  </button>
                )}
                <button
                  onClick={() => dismissOne(n.id)}
                  disabled={isActioning}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-40"
                  title="Dismiss"
                >
                  {isActioning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Unread dot */}
              {n.isUnread && (
                <div className="w-2 h-2 rounded-full bg-[#0D9488] flex-shrink-0 mt-1.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Info strip */}
      <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 text-xs text-gray-400 text-center">
        Notifications are generated automatically when classes are booked, completed, cancelled, or when payments are processed.
      </div>
    </div>
  )
}
