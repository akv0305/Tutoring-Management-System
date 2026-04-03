"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  Bell,
  Calendar,
  CreditCard,
  Settings,
  CheckCircle,
  AlertCircle,
  BookOpen,
  X,
  Loader2,
} from "lucide-react"

/* ─── Types ─── */
type NotifType = "class" | "payment" | "system"

type Notification = {
  id: string
  type: NotifType
  title: string
  message: string
  timestamp: string
  isUnread: boolean
}

/* ─── Icon & style config per type ─── */
const TYPE_CONFIG: Record<NotifType, { icon: React.ComponentType<{ className?: string }>; borderColor: string; iconBg: string; iconColor: string }> = {
  class: {
    icon: Calendar,
    borderColor: "border-l-[#0D9488]",
    iconBg: "bg-[#0D9488]/10",
    iconColor: "text-[#0D9488]",
  },
  payment: {
    icon: CreditCard,
    borderColor: "border-l-[#22C55E]",
    iconBg: "bg-[#22C55E]/10",
    iconColor: "text-[#22C55E]",
  },
  system: {
    icon: Settings,
    borderColor: "border-l-[#1E3A5F]",
    iconBg: "bg-[#1E3A5F]/10",
    iconColor: "text-[#1E3A5F]",
  },
}

type FilterTab = "all" | "unread" | "class" | "payment" | "system"

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "class", label: "Classes" },
  { key: "payment", label: "Payments" },
  { key: "system", label: "System" },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=100")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  const unreadCount = useMemo(() => notifications.filter(n => n.isUnread).length, [notifications])

  // Mark all as read
  async function markAllRead() {
    setActionLoading("mark_all")
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })))
      }
    } catch {
      // Silently fail
    }
    setActionLoading(null)
  }

  // Mark one as read
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
      // Silently fail
    }
    setActionLoading(null)
  }

  // Dismiss one notification
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
      // Silently fail
    }
    setActionLoading(null)
  }

  // Filter logic
  const filtered = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => n.isUnread)
      case "class":
        return notifications.filter((n) => n.type === "class")
      case "payment":
        return notifications.filter((n) => n.type === "payment")
      case "system":
        return notifications.filter((n) => n.type === "system")
      default:
        return notifications
    }
  }, [notifications, activeTab])

  const tabCounts: Record<FilterTab, number> = {
    all: notifications.length,
    unread: unreadCount,
    class: notifications.filter((n) => n.type === "class").length,
    payment: notifications.filter((n) => n.type === "payment").length,
    system: notifications.filter((n) => n.type === "system").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0 || actionLoading === "mark_all"}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#0D9488] text-[#0D9488] rounded-xl text-sm font-medium hover:bg-[#0D9488]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {actionLoading === "mark_all" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Mark All Read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 overflow-x-auto">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === t.key
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {t.label}
            <span
              className={[
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                activeTab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {tabCounts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">No notifications here</p>
            <p className="text-xs text-gray-300 mt-1">Check back later for updates</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
              const TypeIcon = cfg.icon
              return (
                <div
                  key={notif.id}
                  className={[
                    "flex items-start gap-4 px-5 py-4 border-l-4 transition-colors group relative",
                    cfg.borderColor,
                    notif.isUnread ? "bg-blue-50/40 hover:bg-blue-50/60" : "hover:bg-gray-50/50",
                  ].join(" ")}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <TypeIcon className={`w-4 h-4 ${cfg.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm font-semibold ${notif.isUnread ? "text-[#1E293B]" : "text-gray-600"}`}>
                        {notif.title}
                        {notif.isUnread && (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#0D9488] ml-2 align-middle" />
                        )}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{notif.timestamp}</span>
                        {/* Dismiss button */}
                        <button
                          onClick={() => dismissOne(notif.id)}
                          disabled={actionLoading === notif.id}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all ml-1"
                          title="Dismiss"
                        >
                          {actionLoading === notif.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>

                    {/* Mark as read if unread */}
                    {notif.isUnread && (
                      <button
                        onClick={() => markOneRead(notif.id)}
                        disabled={actionLoading === notif.id}
                        className="mt-1.5 text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80 transition-colors disabled:opacity-50"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="flex items-center gap-3 p-4 bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 rounded-xl">
        <AlertCircle className="w-5 h-5 text-[#1E3A5F] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1E293B]">Notification Preferences</p>
          <p className="text-xs text-gray-500 mt-0.5">
            To update how you receive notifications, visit your{" "}
            <span className="text-[#0D9488] font-medium cursor-pointer hover:underline">
              Account Settings
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Classes</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CreditCard className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Payments</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Settings className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>System</span>
          </div>
        </div>
      </div>
    </div>
  )
}
