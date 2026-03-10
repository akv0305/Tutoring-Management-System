"use client"

import React from "react"
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

const navItems = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/admin" },
  { label: "Students",         icon: Users,           href: "/admin/students" },
  { label: "Teachers",         icon: GraduationCap,   href: "/admin/teachers" },
  { label: "Coordinators",     icon: UserCog,         href: "/admin/coordinators" },
  { label: "Subjects",         icon: BookOpen,        href: "/admin/subjects" },
  { label: "Packages",         icon: Package,         href: "/admin/packages" },
  { label: "Payments",         icon: CreditCard,      href: "/admin/payments",       badge: 5 },
  { label: "Payouts",          icon: Wallet,          href: "/admin/payouts" },
  { label: "Refund Requests",  icon: RotateCcw,       href: "/admin/refunds",        badge: 3 },
  { label: "Reports",          icon: BarChart3,       href: "/admin/reports" },
  { label: "Settings",         icon: Settings,        href: "/admin/settings" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Fixed Sidebar */}
      <Sidebar
        role="admin"
        navItems={navItems}
        userName="Rajesh Kumar"
        userEmail="admin@expertguru.net"
      />

      {/* Main content area – offset by sidebar width */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 260 }}>
        {/* Sticky TopBar */}
        <TopBar
          title="Admin Dashboard"
          userName="Rajesh Kumar"
          notificationCount={8}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
