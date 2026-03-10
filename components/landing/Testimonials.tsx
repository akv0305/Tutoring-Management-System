import React from "react"
import { Quote, Star } from "lucide-react"

type Testimonial = {
  quote: string
  name: string
  detail: string
  rating: number
  initials: string
  avatarColor: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "My son's math grades went from C to A in just 3 months. The tutor was patient, knowledgeable, and always prepared.",
    name: "Nitya Mateti",
    detail: "Parent, Texas",
    rating: 5,
    initials: "NM",
    avatarColor: "#1E3A5F",
  },
  {
    quote:
      "The reading program transformed my daughter's confidence. She now reads above grade level and loves her sessions.",
    name: "Srividya Matta",
    detail: "Parent, California",
    rating: 5,
    initials: "SM",
    avatarColor: "#0D9488",
  },
  {
    quote:
      "Expert Guru's ACT prep helped me score 34. My tutor broke down every concept and gave me strategies that actually worked.",
    name: "Sai Akshay Chimakurty",
    detail: "Student, New Jersey",
    rating: 5,
    initials: "SC",
    avatarColor: "#7C3AED",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#F59E0B]/15 text-[#D97706] text-xs font-semibold tracking-wider uppercase mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A5F] mb-4">
            What Families Say
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Real results from real families across the United States
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col"
            >
              {/* Star rating */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                ))}
              </div>

              {/* Quote icon */}
              <Quote className="w-8 h-8 text-[#F59E0B] mb-3 flex-shrink-0" />

              {/* Quote text */}
              <blockquote className="flex-1 text-sm text-gray-600 italic leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: t.avatarColor }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1E293B]">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.detail}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
