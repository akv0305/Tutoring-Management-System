"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserPlus,
  CreditCard,
  GraduationCap,
  BarChart3,
  Bell,
} from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [totalStudents, setTotalStudents] = useState(0)
  const [pendingOnboarding, setPendingOnboarding] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)

  // Fetch live badge counts on mount and every 60 seconds
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/coordinators/badge-counts")
        if (!res.ok) return
        const data = await res.json()
        setTotalStudents(data.totalStudents || 0)
        setPendingOnboarding(data.pendingOnboarding || 0)
        setPendingPayments(data.pendingPayments || 0)
      } catch {
        // silently fail
      }
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: "Dashboard",   icon: LayoutDashboard, href: "/coordinator" },
    { label: "My Students", icon: Users,           href: "/coordinator/students",   ...(totalStudents > 0 ? { badge: totalStudents } : {}) },
    { label: "Schedule",    icon: Calendar,        href: "/coordinator/schedule" },
    { label: "Onboarding",  icon: UserPlus,        href: "/coordinator/onboarding", ...(pendingOnboarding > 0 ? { badge: pendingOnboarding } : {}) },
    { label: "Payments",    icon: CreditCard,      href: "/coordinator/payments",   ...(pendingPayments > 0 ? { badge: pendingPayments } : {}) },
    { label: "Teachers",    icon: GraduationCap,   href: "/coordinator/teachers" },
    { label: "Reports",     icon: BarChart3,       href: "/coordinator/reports" },
    { label: "Notifications", icon: Bell,          href: "/coordinator/notifications" },
  ]

  const userName = session?.user
    ? `${session.user.firstName} ${session.user.lastName}`
    : "Coordinator"
  const userEmail = session?.user?.email || ""

  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar
        role="coordinator"
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
      />

      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: 260 }}
      >
        <TopBar
          title="Coordinator Dashboard"
          userName={userName}
          notificationsHref="/coordinator/notifications"
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
