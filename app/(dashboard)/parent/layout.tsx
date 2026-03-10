"use client"

import React from "react"
import {
  LayoutDashboard,
  Search,
  Calendar,
  Package,
  CreditCard,
  TrendingUp,
  Gift,
  Bell,
} from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

const navItems = [
  { label: "Dashboard",       icon: LayoutDashboard, href: "/parent" },
  { label: "Browse Teachers", icon: Search,          href: "/parent/teachers" },
  { label: "My Classes",      icon: Calendar,        href: "/parent/classes" },
  { label: "Packages",        icon: Package,         href: "/parent/packages" },
  { label: "Payments",        icon: CreditCard,      href: "/parent/payments" },
  { label: "Progress",        icon: TrendingUp,      href: "/parent/progress" },
  { label: "Referrals",       icon: Gift,            href: "/parent/referrals" },
  { label: "Notifications",   icon: Bell,            href: "/parent/notifications", badge: 3 },
]

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Fixed Sidebar */}
      <Sidebar
        role="parent"
        navItems={navItems}
        userName="Jane Smith"
        userEmail="jane@email.com"
      />

      {/* Main area */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: 260 }}
      >
        <TopBar
          title="Parent Dashboard"
          subtitle="Alex Smith — Grade 8"
          userName="Jane Smith"
          notificationCount={3}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
