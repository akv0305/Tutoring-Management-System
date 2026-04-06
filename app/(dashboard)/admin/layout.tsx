"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  Package,
  CreditCard,
  Wallet,
  RotateCcw,
  BarChart3,
  Settings,
} from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [pendingPayments, setPendingPayments] = useState(0)
  const [pendingRefunds, setPendingRefunds] = useState(0)

  // Fetch live badge counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/admin/badge-counts")
        if (res.ok) {
          const data = await res.json()
          setPendingPayments(data.pendingPayments ?? 0)
          setPendingRefunds(data.pendingRefunds ?? 0)
        }
      } catch {
        // silent — badges just stay at 0
      }
    }
    fetchCounts()
    // Refresh every 60 seconds
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: "Dashboard",       icon: LayoutDashboard, href: "/admin" },
    { label: "Students",        icon: Users,           href: "/admin/students" },
    { label: "Teachers",        icon: GraduationCap,   href: "/admin/teachers" },
    { label: "Coordinators",    icon: UserCog,         href: "/admin/coordinators" },
    { label: "Subjects",        icon: BookOpen,        href: "/admin/subjects" },
    { label: "Packages",        icon: Package,         href: "/admin/packages" },
    { label: "Payments",        icon: CreditCard,      href: "/admin/payments",      ...(pendingPayments > 0 && { badge: pendingPayments }) },
    { label: "Payouts",         icon: Wallet,          href: "/admin/payouts" },
    { label: "Refund Requests", icon: RotateCcw,       href: "/admin/refunds",       ...(pendingRefunds > 0 && { badge: pendingRefunds }) },
    { label: "Reports",         icon: BarChart3,       href: "/admin/reports" },
    { label: "Settings",        icon: Settings,        href: "/admin/settings" },
  ]

  const userName = session?.user
    ? `${session.user.firstName} ${session.user.lastName}`
    : "Admin"
  const userEmail = session?.user?.email || "admin@expertguru.net"

  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar
        role="admin"
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
      />

      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 260 }}>
        <TopBar
          title="Admin Dashboard"
          userName={userName}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
