"use client"

import React from "react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserPlus,
  CreditCard,
  GraduationCap,
  BarChart3,
} from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

const navItems = [
  { label: "Dashboard",   icon: LayoutDashboard, href: "/coordinator" },
  { label: "My Students", icon: Users,           href: "/coordinator/students",   badge: 42 },
  { label: "Schedule",    icon: Calendar,        href: "/coordinator/schedule" },
  { label: "Onboarding",  icon: UserPlus,        href: "/coordinator/onboarding", badge: 5 },
  { label: "Payments",    icon: CreditCard,      href: "/coordinator/payments",   badge: 3 },
  { label: "Teachers",    icon: GraduationCap,   href: "/coordinator/teachers" },
  { label: "Reports",     icon: BarChart3,       href: "/coordinator/reports" },
]

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()

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
          notificationCount={5}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
