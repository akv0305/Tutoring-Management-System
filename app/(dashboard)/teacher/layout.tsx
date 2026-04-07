"use client"

import React from "react"
import { useSession } from "next-auth/react"
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
  { label: "Notifications",   icon: Bell,            href: "/teacher/notifications" },
]

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()

  const userName = session?.user
    ? `${session.user.firstName} ${session.user.lastName}`
    : "Teacher"
  const userEmail = session?.user?.email || ""

  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar
        role="teacher"
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
      />

      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: 260 }}
      >
        <TopBar
          title="Teacher Dashboard"
          userName={userName}
          notificationsHref="/teacher/notifications"
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
