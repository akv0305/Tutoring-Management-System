"use client"

import React, { useState, useMemo } from "react"
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Star,
  UserPlus,
  XCircle,
  CheckCheck,
} from "lucide-react"

/* ─── Types ─── */
type FilterKey = "all" | "unread" | "classes" | "payments"

type Notification = {
  id: string
  unread: boolean
  borderColor: string
  bgColor: string
  iconBg: string
  icon: React.ReactNode
  text: string
  time: string
  category: "classes" | "payments" | "general"
}

/* ─── Icon wrapper ─── */
function NotifIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
      {children}
    </div>
  )
}

/* ─── Notification data ─── */
const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    unread: true,
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-50",
    iconBg: "bg-blue-100",
    icon: <NotifIcon bg="bg-blue-100"><Calendar className="w-4 h-4 text-blue-600" /></NotifIcon>,
    text: "New class scheduled: Noah Martinez — Math Trial, Mar 10, 4:30 PM EST",
    time: "30 minutes ago",
    category: "classes",
  },
  {
    id: "n2",
    unread: true,
    borderColor: "border-l-green-500",
    bgColor: "bg-blue-50",
    iconBg: "bg-green-100",
    icon: <NotifIcon bg="bg-green-100"><CheckCircle className="w-4 h-4 text-green-600" /></NotifIcon>,
    text: "Class completed confirmation: Alex Smith — Math, Mar 10, 9:00 AM",
    time: "2 hours ago",
    category: "classes",
  },
  {
    id: "n3",
    unread: true,
    borderColor: "border-l-amber-500",
    bgColor: "bg-blue-50",
    iconBg: "bg-amber-100",
    icon: <NotifIcon bg="bg-amber-100"><AlertTriangle className="w-4 h-4 text-amber-600" /></NotifIcon>,
    text: "Reminder: Priya Patel — AP Calculus class at 2:00 PM EST today",
    time: "4 hours ago",
    category: "classes",
  },
  {
    id: "n4",
    unread: true,
    borderColor: "border-l-green-500",
    bgColor: "bg-blue-50",
    iconBg: "bg-green-100",
    icon: <NotifIcon bg="bg-green-100"><DollarSign className="w-4 h-4 text-green-600" /></NotifIcon>,
    text: "February 2026 payout of $1,050 has been processed and sent to your account",
    time: "1 day ago",
    category: "payments",
  },
  {
    id: "n5",
    unread: false,
    borderColor: "border-l-gray-300",
    bgColor: "bg-white",
    iconBg: "bg-gray-100",
    icon: <NotifIcon bg="bg-gray-100"><Calendar className="w-4 h-4 text-gray-500" /></NotifIcon>,
    text: "Class rescheduled: Maya Johnson — SAT Prep moved from Mar 12 to Mar 14, 2:00 PM",
    time: "2 days ago",
    category: "classes",
  },
  {
    id: "n6",
    unread: false,
    borderColor: "border-l-gray-300",
    bgColor: "bg-white",
    iconBg: "bg-gray-100",
    icon: <NotifIcon bg="bg-gray-100"><Star className="w-4 h-4 text-gray-500" /></NotifIcon>,
    text: "New feedback received: Alex Smith's parent rated you 5/5 stars",
    time: "3 days ago",
    category: "general",
  },
  {
    id: "n7",
    unread: false,
    borderColor: "border-l-gray-300",
    bgColor: "bg-white",
    iconBg: "bg-gray-100",
    icon: <NotifIcon bg="bg-gray-100"><UserPlus className="w-4 h-4 text-gray-500" /></NotifIcon>,
    text: "New trial student assigned: Emma Wilson — Science, Grade 9",
    time: "3 days ago",
    category: "classes",
  },
  {
    id: "n8",
    unread: false,
    borderColor: "border-l-red-400",
    bgColor: "bg-white",
    iconBg: "bg-red-100",
    icon: <NotifIcon bg="bg-red-100"><XCircle className="w-4 h-4 text-red-500" /></NotifIcon>,
    text: "Class cancelled by student: Alex Smith — Math, Mar 4, 9:00 AM (within free window)",
    time: "6 days ago",
    category: "classes",
  },
  {
    id: "n9",
    unread: false,
    borderColor: "border-l-gray-300",
    bgColor: "bg-white",
    iconBg: "bg-gray-100",
    icon: <NotifIcon bg="bg-gray-100"><CheckCircle className="w-4 h-4 text-gray-500" /></NotifIcon>,
    text: "Class completed: Priya Patel — AP Calculus, Mar 3",
    time: "7 days ago",
    category: "classes",
  },
  {
    id: "n10",
    unread: false,
    borderColor: "border-l-gray-300",
    bgColor: "bg-white",
    iconBg: "bg-gray-100",
    icon: <NotifIcon bg="bg-gray-100"><DollarSign className="w-4 h-4 text-gray-500" /></NotifIcon>,
    text: "January 2026 payout of $980 processed",
    time: "Feb 1, 2026",
    category: "payments",
  },
]

const FILTERS: { key: FilterKey; label: string; badge?: number }[] = [
  { key: "all",      label: "All" },
  { key: "unread",   label: "Unread", badge: 4 },
  { key: "classes",  label: "Classes" },
  { key: "payments", label: "Payments" },
]

/* ─── Page ─── */
export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS)

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === "all")      return true
      if (activeFilter === "unread")   return n.unread
      if (activeFilter === "classes")  return n.category === "classes"
      if (activeFilter === "payments") return n.category === "payments"
      return true
    })
  }, [activeFilter, notifications])

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          Mark All Read
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
            {f.badge !== undefined && unreadCount > 0 && (
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  activeFilter === f.key
                    ? "bg-white text-[#1E3A5F]"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No notifications in this category.
          </div>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border border-gray-100 border-l-4 ${n.borderColor} p-4 flex items-start gap-4 transition-colors ${
              n.unread ? "bg-blue-50" : "bg-white"
            }`}
          >
            {/* Icon */}
            {n.icon}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${n.unread ? "font-semibold text-[#1E293B]" : "text-gray-600"}`}>
                {n.text}
              </p>
              <p className="text-xs text-gray-400 mt-1">{n.time}</p>
            </div>

            {/* Unread dot */}
            {n.unread && (
              <div className="w-2 h-2 rounded-full bg-[#0D9488] flex-shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
