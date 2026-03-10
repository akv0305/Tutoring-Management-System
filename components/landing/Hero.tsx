import React from "react"
import { Star, ArrowRight, BookOpen, Users } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)" }}>
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Left: 60% ── */}
          <div className="flex-1 lg:w-[60%] text-white text-center lg:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-[#F59E0B]/20 border border-[#F59E0B]/40 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="text-sm font-semibold text-[#F59E0B]">Trusted by 500+ Families</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold leading-tight tracking-tight mb-5">
              Expert Tutoring from{" "}
              <span className="text-[#F59E0B]">India's Top Educators</span>{" "}
              to Your Home
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
              Personalized 1-on-1 online tutoring for K-12, AP, IB, SAT &amp; ACT.
              Same tutor every session. Flexible scheduling across time zones.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-5">
              <button
                type="button"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[#F59E0B] text-[#1E293B] hover:bg-[#e08d00] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Book Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold border-2 border-white/60 text-white hover:bg-white/10 hover:border-white transition-all"
              >
                Explore Subjects
              </button>
            </div>

            {/* No credit card notice */}
            <p className="text-sm text-white/60 flex items-center gap-3 justify-center lg:justify-start flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
                No credit card required
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
                1 free trial per subject
              </span>
            </p>
          </div>

          {/* ── Right: 40% ── */}
          <div className="w-full lg:w-[40%] flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm lg:max-w-none">
              {/* Main illustration placeholder */}
              <div
                className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 shadow-2xl"
                style={{ height: 350 }}
              >
                {/* Decorative icon grid */}
                <div className="grid grid-cols-3 gap-3 mb-2">
                  {[BookOpen, Users, Star].map((Icon, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center"
                    >
                      <Icon className="w-6 h-6 text-white/70" />
                    </div>
                  ))}
                </div>
                <p className="text-white/70 text-sm font-medium tracking-wide text-center px-6">
                  Student Learning Illustration
                </p>
                <div className="w-16 h-1 rounded-full bg-white/20" />
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                <span className="text-xs font-semibold text-[#1E293B]">Live Session</span>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-xs font-bold text-[#1E293B]">4.9 / 5.0</span>
                <span className="text-xs text-gray-400">rating</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#F8FAFC" />
        </svg>
      </div>
    </section>
  )
}
