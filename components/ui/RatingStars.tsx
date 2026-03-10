"use client"

import React, { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type RatingStarsProps = {
  rating: number
  count?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRate?: (rating: number) => void
}

const sizeConfig = {
  sm: { star: "w-3 h-3", text: "text-xs", gap: "gap-0.5" },
  md: { star: "w-4 h-4", text: "text-sm", gap: "gap-0.5" },
  lg: { star: "w-5 h-5", text: "text-base", gap: "gap-1" },
}

export function RatingStars({
  rating,
  count,
  size = "md",
  interactive = false,
  onRate,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number>(rating)

  const displayRating = interactive ? (hovered ?? selected) : rating
  const config = sizeConfig[size]

  const handleClick = (value: number) => {
    if (!interactive) return
    setSelected(value)
    onRate?.(value)
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className={cn("flex items-center", config.gap)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(displayRating)
          const partial = !filled && star === Math.ceil(displayRating) && displayRating % 1 >= 0.5

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(star)}
              onMouseEnter={() => interactive && setHovered(star)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={cn(
                "relative transition-transform",
                interactive
                  ? "cursor-pointer hover:scale-110 focus:outline-none"
                  : "cursor-default pointer-events-none"
              )}
              aria-label={`Rate ${star} out of 5`}
            >
              {/* Background (empty) star */}
              <Star
                className={cn(config.star)}
                style={{ color: "#D1D5DB" }}
                fill="#D1D5DB"
              />
              {/* Foreground fill overlay */}
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star
                    className={cn(config.star)}
                    style={{ color: "#F59E0B" }}
                    fill="#F59E0B"
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Numeric rating */}
      <span className={cn("font-semibold text-[#1E293B]", config.text)}>
        {interactive ? selected.toFixed(1) : rating.toFixed(1)}
      </span>

      {/* Review count */}
      {count !== undefined && (
        <span className={cn("text-gray-400", config.text)}>
          ({count.toLocaleString()} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  )
}
