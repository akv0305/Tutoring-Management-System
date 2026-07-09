"use client"

import React, { useState } from "react"
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
  const [sidebarOpen, setSidebarOpen] = useState(false)


  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>
      <Sidebar
        role="teacher"
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden lg:ml-[260px]">
        <TopBar
          title="Teacher Dashboard"
          userName={userName}
          notificationsHref="/teacher/notifications"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
