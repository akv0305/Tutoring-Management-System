"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Bell,
  Calendar,
  CreditCard,
  CheckCircle2,
  Star,
  Package,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: "booking" | "payment" | "completed" | "feedback" | "expiry"
  title: string
  message: string
  time: string
  unread: boolean
}

const HARDCODED_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "booking",
    title: "New class booked",
    message: "Arjun's Math class scheduled for Tuesday 5PM",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    type: "payment",
    title: "Payment received",
    message: "$240 confirmed for Ms. Priya package",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    type: "completed",
    title: "Class completed",
    message: "Science class with Mr. Raj marked complete",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: "4",
    type: "feedback",
    title: "Trial feedback",
    message: "Mrs. Sharma rated the trial class 5 stars",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "5",
    type: "expiry",
    title: "Package expiring",
    message: "Arjun's Math package expires in 3 days",
    time: "Yesterday",
    unread: false,
  },
]

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ElementType; bg: string; color: string }
> = {
  booking: { icon: Calendar, bg: "bg-blue-100", color: "text-blue-600" },
  payment: { icon: CreditCard, bg: "bg-green-100", color: "text-green-600" },
  completed: { icon: CheckCircle2, bg: "bg-teal-100", color: "text-teal-600" },
  feedback: { icon: Star, bg: "bg-amber-100", color: "text-amber-500" },
  expiry: { icon: Package, bg: "bg-orange-100", color: "text-orange-500" },
}

type NotificationDropdownProps = {
  count: number
}

export function NotificationDropdown({ count }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(HARDCODED_NOTIFICATIONS)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => n.unread).length

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

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
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
                  className="text-xs text-[#0D9488] hover:text-teal-700 font-medium transition-colors"
                >
                  Mark all as read
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
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type]
              const Icon = config.icon

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer",
                    notif.unread && "bg-blue-50/60"
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
                          notif.unread ? "text-[#1E293B]" : "text-gray-600"
                        )}
                      >
                        {notif.title}
                      </p>
                      {notif.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button className="w-full text-xs text-center text-[#1E3A5F] hover:text-[#162d4a] font-medium transition-colors">
              View All Notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
