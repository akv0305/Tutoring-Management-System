import React from "react"
import {
  BookOpen,
  UserCheck,
  GraduationCap,
  Globe,
  ShieldCheck,
  CreditCard,
  type LucideIcon,
} from "lucide-react"

type ValueCard = {
  icon: LucideIcon
  title: string
  description: string
}

const VALUE_CARDS: ValueCard[] = [
  {
    icon: BookOpen,
    title: "1-on-1 Personalized Tutoring",
    description:
      "Every session is tailored to your child's learning pace, style, and curriculum.",
  },
  {
    icon: UserCheck,
    title: "Same Tutor Every Session",
    description:
      "Build rapport and consistency. Your child works with the same qualified tutor throughout.",
  },
  {
    icon: GraduationCap,
    title: "Top 1% Qualified Tutors",
    description:
      "Our tutors hold advanced degrees from prestigious universities with years of teaching experience.",
  },
  {
    icon: Globe,
    title: "Flexible Across Time Zones",
    description:
      "Sessions scheduled to fit US student schedules with tutors based in India. IST to EST/PST handled seamlessly.",
  },
  {
    icon: ShieldCheck,
    title: "Managed Tutoring Program",
    description:
      "A dedicated coordinator monitors progress, handles scheduling, and ensures quality for every student.",
  },
  {
    icon: CreditCard,
    title: "Affordable Packages",
    description:
      "Transparent pricing with packages of 4, 6, or 8 classes. No hidden fees. Pay only for what you need.",
  },
]

export function ValueProps() {
  return (
    <section id="why-us" className="bg-[#F8FAFC] py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold tracking-wider uppercase mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A5F] mb-4">
            Why Families Choose Expert Guru
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Everything you need for your child's academic success
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUE_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#0D9488]/10 group-hover:bg-[#0D9488]/20 transition-colors flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#0D9488]" />
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
