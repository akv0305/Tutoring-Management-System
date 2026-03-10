import React from "react"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
  status: string
  size?: "sm" | "md"
}

type StatusStyle = {
  bg: string
  text: string
  border: string
}

function getStatusStyle(status: string): StatusStyle {
  const normalized = status.toLowerCase()

  if (["active", "completed", "confirmed", "paid"].includes(normalized)) {
    return {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
    }
  }
  if (["pending", "scheduled"].includes(normalized)) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
    }
  }
  if (["inactive", "cancelled", "failed"].includes(normalized)) {
    return {
      bg: "bg-red-100",
      text: "text-red-600",
      border: "border-red-200",
    }
  }
  if (["trial", "approved", "under_review"].includes(normalized)) {
    return {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
    }
  }
  if (["dropped", "expired", "exhausted"].includes(normalized)) {
    return {
      bg: "bg-gray-100",
      text: "text-gray-500",
      border: "border-gray-200",
    }
  }

  // Default fallback
  return {
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
  }
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = getStatusStyle(status)

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        style.bg,
        style.text,
        style.border,
        size === "sm"
          ? "px-2 py-0.5 text-[10px] leading-4"
          : "px-3 py-1 text-xs leading-5"
      )}
    >
      {formatStatusLabel(status)}
    </span>
  )
}
