"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
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
  { label: "Notifications",   icon: Bell,            href: "/parent/notifications" },
]

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userName = session?.user
    ? `${session.user.firstName} ${session.user.lastName}`
    : "Parent"
  const userEmail = session?.user?.email || ""

  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar
        role="parent"
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden lg:ml-[260px]">
        <TopBar
          title="Parent Dashboard"
          subtitle="My Children"
          userName={userName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
