import React from "react"

type Stat = {
  value: string
  label: string
  suffix?: string
}

const STATS: Stat[] = [
  { value: "500+", label: "Students Tutored" },
  { value: "100+", label: "Expert Tutors" },
  { value: "10,000+", label: "Sessions Completed" },
  { value: "50+", label: "Subjects Offered" },
]

export function StatsBar() {
  return (
    <section className="bg-[#1E3A5F] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {STATS.map((stat, idx) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center group"
            >
              {/* Divider between items on desktop */}
              {idx > 0 && (
                <div className="hidden lg:block absolute w-px h-12 bg-white/10" />
              )}

              {/* Value */}
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight group-hover:text-[#F59E0B] transition-colors duration-200">
                {stat.value}
              </span>

              {/* Label */}
              <span className="mt-2 text-sm font-medium text-white/70 uppercase tracking-wide">
                {stat.label}
              </span>

              {/* Accent underline on hover */}
              <div className="mt-2 h-0.5 w-0 group-hover:w-10 bg-[#F59E0B] rounded-full transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
