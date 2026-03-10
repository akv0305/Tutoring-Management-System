"use client"

import React from "react"
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Wallet,
  Bell,
} from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

const navItems = [
  { label: "Dashboard",       icon: LayoutDashboard, href: "/teacher" },
  { label: "My Schedule",     icon: Calendar,        href: "/teacher/schedule" },
  { label: "Availability",    icon: Clock,           href: "/teacher/availability" },
  { label: "My Students",     icon: Users,           href: "/teacher/students" },
  { label: "Class History",   icon: BookOpen,        href: "/teacher/history" },
  { label: "Earnings",        icon: Wallet,          href: "/teacher/earnings" },
  { label: "Notifications",   icon: Bell,            href: "/teacher/notifications", badge: 4 },
]

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Fixed Sidebar */}
      <Sidebar
        role="teacher"
        navItems={navItems}
        userName="Dr. Ananya Sharma"
        userEmail="ananya@expertguru.net"
      />

      {/* Main area offset by sidebar width */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: 260 }}
      >
        <TopBar
          title="Teacher Dashboard"
          userName="Dr. Ananya Sharma"
          notificationCount={4}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
