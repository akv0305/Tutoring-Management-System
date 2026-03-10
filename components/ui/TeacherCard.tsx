import React from "react"
import { BadgeCheck, BookOpen } from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Teacher = {
  id: string
  name: string
  photo?: string
  subjects: string[]
  qualification: string
  university: string
  experience: number
  rating: number
  reviewCount: number
  pricePerClass: number
  isVerified: boolean
}

type TeacherCardProps = {
  teacher: Teacher
}

const AVATAR_COLORS = [
  "bg-[#1E3A5F]",
  "bg-[#0D9488]",
  "bg-purple-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-orange-500",
]

function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const avatarBg = getAvatarColor(teacher.name)
  const initials = getInitials(teacher.name)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col h-full">
      {/* Avatar + Name row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg",
              avatarBg
            )}
          >
            {initials}
          </div>
          {teacher.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
              <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-100" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-[#1E293B] truncate">
              {teacher.name}
            </h3>
            {teacher.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{teacher.qualification}</p>
          <p className="text-xs text-gray-400 truncate">{teacher.university}</p>
        </div>
      </div>

      {/* Experience */}
      <div className="flex items-center gap-1.5 mb-3">
        <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500">
          {teacher.experience} {teacher.experience === 1 ? "year" : "years"} experience
        </span>
      </div>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {teacher.subjects.map((subject) => (
          <span
            key={subject}
            className="px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-medium rounded-full border border-[#0D9488]/20"
          >
            {subject}
          </span>
        ))}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <RatingStars rating={teacher.rating} count={teacher.reviewCount} size="sm" />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-3" />

      {/* Price + Actions */}
      <div className="flex items-center justify-between mt-auto">
        <div>
          <span className="text-lg font-bold text-[#1E3A5F]">
            ${teacher.pricePerClass}
          </span>
          <span className="text-xs text-gray-400 ml-1">/class</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="text-xs h-8">
            View Profile
          </Button>
          <Button variant="default" size="sm" className="text-xs h-8 bg-[#1E3A5F] hover:bg-[#162d4a]">
            Book Trial
          </Button>
        </div>
      </div>
    </div>
  )
}
