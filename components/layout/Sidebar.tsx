"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, type LucideIcon } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: LucideIcon
  href: string
  badge?: number
}

type SidebarProps = {
  role: "admin" | "coordinator" | "teacher" | "parent"
  navItems: NavItem[]
  userName: string
  userEmail: string
}

const ROLE_BADGE_STYLES: Record<SidebarProps["role"], string> = {
  admin: "bg-red-500/20 text-red-300",
  coordinator: "bg-[#0D9488]/20 text-teal-300",
  teacher: "bg-purple-500/20 text-purple-300",
  parent: "bg-[#F59E0B]/20 text-amber-300",
}

const ROLE_LABEL: Record<SidebarProps["role"], string> = {
  admin: "Administrator",
  coordinator: "Coordinator",
  teacher: "Teacher",
  parent: "Parent",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ role, navItems, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{ width: 260, background: "#0F172A" }}
    >
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">EG</span>
          </div>
          {/* <span className="text-white font-bold text-lg tracking-tight">Expert Guru</span> */}
          <img src="/images/eglogo_white.png" alt="Expert Guru" className="h-8 w-auto" />
        </div>
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium",
            ROLE_BADGE_STYLES[role]
          )}
        >
          {ROLE_LABEL[role]}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-none">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative",
                    isActive
                      ? "bg-[#1E3A5F]/30 text-white font-medium border-l-2 border-[#F59E0B] pl-[10px]"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive ? "text-[#F59E0B]" : "text-gray-500 group-hover:text-gray-300"
                    )}
                  />
                  <span className="text-sm flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/10" />

      {/* User section */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <p className="text-gray-500 text-[10px] truncate">{userEmail}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
