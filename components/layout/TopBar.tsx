"use client"

import React from "react"
import { Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationDropdown } from "@/components/ui/NotificationDropdown"
import { cn } from "@/lib/utils"

type TopBarProps = {
  title: string
  subtitle?: string
  userName: string
  notificationsHref?: string
  onMenuClick: () => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TopBar({ title, subtitle, userName, notificationsHref, onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm h-14 lg:h-16 flex items-center px-4 lg:px-6">
      {/* Left: Hamburger (mobile) + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg lg:text-xl font-semibold text-[#1E293B] leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs lg:text-sm text-gray-500 leading-tight truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Search + Notifications + Logo */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        {/* Search — hidden on small screens */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search anything..."
            className="pl-9 w-64 h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Notification Bell */}
        <NotificationDropdown viewAllHref={notificationsHref} />

        {/* Old Brand Logo — temporary for existing customer recognition */}
        <div className="flex items-center pl-1 lg:pl-2 pr-1">
          <img src="/images/TPPLogo.webp" alt="Old Brand" className="h-9 lg:h-12 w-auto" />
        </div>
      </div>
    </header>
  )
}
