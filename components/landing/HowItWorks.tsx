import React from "react"

type Step = {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: "1",
    title: "Sign Up",
    description: "Parent creates an account and adds child details.",
  },
  {
    number: "2",
    title: "Browse Tutors",
    description: "Explore qualified tutors by subject, rating, and price.",
  },
  {
    number: "3",
    title: "Book Free Trial",
    description: "Schedule a free trial class in your preferred subject.",
  },
  {
    number: "4",
    title: "Choose a Package",
    description: "Pick a 4, 6, or 8-class package with your preferred tutor.",
  },
  {
    number: "5",
    title: "Start Learning",
    description: "Attend sessions, track progress, and watch grades improve.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-semibold tracking-wider uppercase mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A5F] mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            From sign-up to success in 5 simple steps
          </p>
        </div>

        {/* Steps – horizontal on desktop, vertical on mobile */}
        <div className="relative">
          {/* Desktop connector line */}
          <div
            className="hidden lg:block absolute top-6 left-0 right-0 h-px"
            style={{
              background:
                "repeating-linear-gradient(90deg, #0D9488 0, #0D9488 8px, transparent 8px, transparent 18px)",
              top: "24px",
              left: "10%",
              right: "10%",
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {STEPS.map((step, idx) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Mobile vertical connector (not first) */}
                {idx > 0 && (
                  <div
                    className="lg:hidden absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4"
                    style={{
                      background:
                        "repeating-linear-gradient(180deg, #0D9488 0, #0D9488 4px, transparent 4px, transparent 8px)",
                    }}
                  />
                )}

                {/* Step circle */}
                <div className="relative z-10 w-12 h-12 rounded-full bg-[#0D9488] flex items-center justify-center text-white font-extrabold text-lg shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-200 mb-4">
                  {step.number}
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-[#0D9488]/30 scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Step content */}
                <h3 className="text-sm font-bold text-[#1E293B] mb-1.5">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[160px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0D9488] text-white font-semibold hover:bg-[#0b7a70] transition-colors shadow-sm hover:shadow-md"
          >
            Get Started Today →
          </button>
        </div>
      </div>
    </section>
  )
}
