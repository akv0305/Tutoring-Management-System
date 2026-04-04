"use client"

import React from "react"
import {
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  Video,
  ExternalLink,
  Copy,
  CheckCircle,
  Info,
} from "lucide-react"

type ClassInfo = {
  id: string
  subject: string
  teacher: string
  teacherInitials: string
  date: string
  time: string
  duration: string
  status: string
  isTrial?: boolean
  meetingLink?: string | null
  topic?: string | null
  studentName?: string
}

export function ClassDetailsModal({
  open,
  onClose,
  cls,
}: {
  open: boolean
  onClose: () => void
  cls: ClassInfo
}) {
  const [copied, setCopied] = React.useState(false)

  if (!open) return null

  function copyLink() {
    if (cls.meetingLink) {
      navigator.clipboard.writeText(cls.meetingLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isConfirmed = ["confirmed", "scheduled"].includes(cls.status)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Class Details</h2>
              <p className="text-xs text-gray-500">{cls.subject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status + Trial badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                cls.status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : cls.status === "scheduled"
                  ? "bg-amber-100 text-amber-700"
                  : cls.status === "pending_payment"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cls.status.replace("_", " ")}
            </span>
            {cls.isTrial && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">
                Trial
              </span>
            )}
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#1E293B]">{cls.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#1E293B]">{cls.time}</p>
                <p className="text-xs text-gray-500">{cls.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0D9488] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {cls.teacherInitials}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1E293B]">
                  {cls.teacher}
                </p>
              </div>
            </div>

            {cls.studentName && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Student: <span className="font-medium text-[#1E293B]">{cls.studentName}</span>
                </p>
              </div>
            )}

            {cls.topic && (
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{cls.topic}</p>
              </div>
            )}
          </div>

          {/* Meeting Link Section */}
          <div className="rounded-lg border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Meeting Link
            </p>
            {cls.meetingLink ? (
              <>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <Video className="w-4 h-4 text-[#0D9488] flex-shrink-0" />
                  <a
                    href={cls.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#0D9488] font-medium hover:underline truncate flex-1"
                  >
                    {cls.meetingLink}
                  </a>
                  <button
                    onClick={copyLink}
                    className="p-1 rounded hover:bg-gray-200 flex-shrink-0"
                    title="Copy link"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {isConfirmed && (
                  <button
                    onClick={() =>
                      window.open(
                        cls.meetingLink!,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Class
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-3">
                <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500">
                  Meeting link has not been added by the teacher yet. It will
                  appear here once available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
