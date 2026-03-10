import React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type KPICardProps = {
  title: string
  value: string
  subtitle: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeType,
  icon: Icon,
}: KPICardProps) {
  const changeStyles: Record<string, string> = {
    positive: "bg-green-100 text-green-700",
    negative: "bg-red-100 text-red-600",
    neutral: "bg-gray-100 text-gray-500",
  }

  const changePrefix = changeType === "positive" && !change.startsWith("+")
    ? "+"
    : changeType === "negative" && !change.startsWith("-")
    ? "-"
    : ""

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      {/* Top row: icon + change badge */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#1E3A5F]" />
        </div>
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
            changeStyles[changeType]
          )}
        >
          {changePrefix}{change}
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold text-[#1E293B] tracking-tight">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-gray-400 border-t border-gray-50 pt-2">{subtitle}</p>
    </div>
  )
}
