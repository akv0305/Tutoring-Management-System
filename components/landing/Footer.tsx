import React from "react"
import { GraduationCap, Mail, Phone, Clock } from "lucide-react"

const QUICK_LINKS = ["Home", "Subjects", "How It Works", "Testimonials", "Book Demo"]
const SUBJECT_LINKS = ["Mathematics", "Science", "English", "SAT/ACT Prep", "Coding"]

export function Footer() {
  return (
    <footer className="bg-[#1E3A5F]">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Column 1: Brand ── */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#0D9488]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Expert Guru</span>
            </div>

            {/* Tagline */}
            <p className="text-[#F59E0B] font-semibold text-sm mb-2">
              Learn Anywhere, Succeed Everywhere
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Making quality education accessible worldwide.
            </p>

            {/* Social placeholder dots */}
            <div className="flex gap-2 mt-5">
              {["FB", "TW", "IN", "YT"].map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-[10px] font-bold hover:bg-[#0D9488] hover:text-white transition-colors cursor-pointer"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link}>
                  <span className="text-white/60 text-sm hover:text-[#0D9488] transition-colors cursor-pointer flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-[#0D9488] transition-all duration-150 rounded-full" />
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Subjects ── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Subjects
            </h4>
            <ul className="space-y-2.5">
              {SUBJECT_LINKS.map((subject) => (
                <li key={subject}>
                  <span className="text-white/60 text-sm hover:text-[#0D9488] transition-colors cursor-pointer flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-[#0D9488] transition-all duration-150 rounded-full" />
                    {subject}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Contact ── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#0D9488]" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-white/80 text-sm">info@expertguru.net</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#0D9488]" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-white/80 text-sm">+1 (800) 555-0199</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wide mb-0.5">Hours</p>
                  <p className="text-white/80 text-sm">Mon–Sat, 9AM–9PM EST</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs text-center sm:text-left">
            © 2026 Expert Guru. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {["Privacy Policy", "Terms of Service", "Refund Policy"].map((item, idx, arr) => (
              <React.Fragment key={item}>
                <span className="text-white/50 text-xs hover:text-white/80 transition-colors cursor-pointer">
                  {item}
                </span>
                {idx < arr.length - 1 && (
                  <span className="text-white/20 text-xs">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
