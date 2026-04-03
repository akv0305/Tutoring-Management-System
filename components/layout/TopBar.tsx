"use client"

import React from "react"
import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationDropdown } from "@/components/ui/NotificationDropdown"
import { cn } from "@/lib/utils"

type TopBarProps = {
  title: string
  subtitle?: string
  userName: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = [
  "#1E3A5F",
  "#0D9488",
  "#7C3AED",
  "#DB2777",
  "#D97706",
]

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export function TopBar({ title, subtitle, userName }: TopBarProps) {
  const initials = getInitials(userName)
  const avatarBg = getAvatarColor(userName)

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm h-16 flex items-center px-6">
      {/* Left: Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-[#1E293B] leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search anything..."
            className="pl-9 w-64 h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Notification Bell — fetches its own data */}
        <NotificationDropdown />

        {/* User Avatar */}
        <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: avatarBg }}
          >
            {initials}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
            {userName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </div>
    </header>
  )
}
