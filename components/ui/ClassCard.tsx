"use client"

import React from "react"
import { ExternalLink, Star, Video } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ClassSession = {
  id: string
  date: string          // ISO date string e.g. "2024-11-15"
  startTime: string     // e.g. "5:00 PM"
  endTime: string       // e.g. "6:00 PM"
  teacherName: string
  subject: string
  status: "scheduled" | "completed" | "cancelled" | "trial" | "no-show"
  meetingLink?: string
  rating?: number
  studentTimezone: string  // e.g. "EST"
  teacherTimezone: string  // e.g. "IST"
  teacherTime?: string     // e.g. "3:30 AM"
}

type ClassCardProps = {
  classSession: ClassSession
  onRate?: (id: string) => void
}

const STATUS_BORDER: Record<ClassSession["status"], string> = {
  scheduled: "border-l-blue-500",
  completed: "border-l-green-500",
  cancelled: "border-l-red-400",
  trial: "border-l-amber-400",
  "no-show": "border-l-gray-300",
}

function formatDate(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr + "T00:00:00")
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleString("en-US", { weekday: "long" }),
  }
}

export function ClassCard({ classSession, onRate }: ClassCardProps) {
  const { day, month, weekday } = formatDate(classSession.date)
  const borderColor = STATUS_BORDER[classSession.status]

  const renderAction = () => {
    switch (classSession.status) {
      case "scheduled":
      case "trial":
        return (
          <Button
            variant="success"
            size="sm"
            className="gap-1.5 text-xs h-8 whitespace-nowrap"
            onClick={() => classSession.meetingLink && window.open(classSession.meetingLink, "_blank")}
          >
            <Video className="w-3.5 h-3.5" />
            Join Class
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Button>
        )
      case "completed":
        if (!classSession.rating) {
          return (
            <Button
              variant="amber"
              size="sm"
              className="gap-1.5 text-xs h-8 whitespace-nowrap"
              onClick={() => onRate?.(classSession.id)}
            >
              <Star className="w-3.5 h-3.5" />
              Rate Class
            </Button>
          )
        }
        return (
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-[#1E293B]">{classSession.rating}/5</span>
          </div>
        )
      case "cancelled":
        return (
          <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded-md border border-gray-200">
            Cancelled
          </span>
        )
      case "no-show":
        return (
          <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded-md border border-gray-200">
            No Show
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-100 border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex items-center gap-4",
        borderColor
      )}
    >
      {/* Left: Date */}
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-2 min-w-[56px] flex-shrink-0 border border-gray-100">
        <span className="text-2xl font-bold text-[#1E3A5F] leading-none">{day}</span>
        <span className="text-[10px] font-semibold text-[#0D9488] mt-0.5 tracking-wider">{month}</span>
        <span className="text-[9px] text-gray-400 mt-0.5 tracking-wide">{weekday.slice(0, 3)}</span>
      </div>

      {/* Middle: Class details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[#1E293B]">{classSession.subject}</span>
          <StatusBadge status={classSession.status} size="sm" />
        </div>
        <p className="text-xs text-gray-500 mb-1">
          with <span className="font-medium text-[#1E293B]">{classSession.teacherName}</span>
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="font-medium text-[#1E293B]">
            {classSession.startTime} – {classSession.endTime}
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-[#0D9488] font-medium">{classSession.studentTimezone}</span>
          {classSession.teacherTime && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-gray-400">
                {classSession.teacherTime} {classSession.teacherTimezone}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Action */}
      <div className="flex-shrink-0 flex items-center">
        {renderAction()}
      </div>
    </div>
  )
}
