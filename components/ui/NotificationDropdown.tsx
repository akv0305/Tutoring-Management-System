"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Bell,
  Calendar,
  CreditCard,
  Settings,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: "class" | "payment" | "system"
  title: string
  message: string
  timestamp: string
  isUnread: boolean
}

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ElementType; bg: string; color: string }
> = {
  class: { icon: Calendar, bg: "bg-blue-100", color: "text-blue-600" },
  payment: { icon: CreditCard, bg: "bg-green-100", color: "text-green-600" },
  system: { icon: Settings, bg: "bg-gray-100", color: "text-gray-600" },
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silently fail — don't break the UI
    }
  }, [])

  // Fetch unread count only (lightweight poll)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1&unreadOnly=true")
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silently fail
    }
  }, [])

  // Initial load + poll every 30 seconds for unread count
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchNotifications().finally(() => setLoading(false))
    }
  }, [isOpen, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Mark all as read
  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })))
        setUnreadCount(0)
      }
    } catch {
      // Silently fail
    }
    setMarkingAll(false)
  }

  // Mark one as read
  const markOneRead = async (id: string) => {
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
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#1E293B] text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="text-xs text-[#0D9488] hover:text-teal-700 font-medium transition-colors disabled:opacity-50"
                >
                  {markingAll ? "Marking..." : "Mark all as read"}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                const Icon = config.icon

                return (
                  <div
                    key={notif.id}
                    onClick={() => notif.isUnread && markOneRead(notif.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer",
                      notif.isUnread && "bg-blue-50/60"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        config.bg
                      )}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            notif.isUnread ? "text-[#1E293B]" : "text-gray-600"
                          )}
                        >
                          {notif.title}
                        </p>
                        {notif.isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{notif.timestamp}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <a
              href="/parent/notifications"
              className="block w-full text-xs text-center text-[#1E3A5F] hover:text-[#162d4a] font-medium transition-colors"
            >
              View All Notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
