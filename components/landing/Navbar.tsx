"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { GraduationCap, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Subjects", href: "#subjects" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "#") return
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setMobileOpen(false)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-white transition-shadow duration-300",
        isScrolled ? "shadow-md" : "shadow-sm border-b border-gray-100"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ── Logo ── */}
        <a href="#" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center group-hover:bg-[#1E3A5F]/20 transition-colors">
            <GraduationCap className="w-5 h-5 text-[#0D9488]" />
          </div>
          <span className="text-xl font-bold text-[#1E3A5F] tracking-tight">
            Expert Guru
          </span>
        </a>

        {/* ── Desktop Nav Links ── */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Desktop CTA Buttons ── */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg text-sm font-semibold border-2 border-[#1E3A5F] text-[#1E3A5F] bg-white hover:bg-[#1E3A5F]/5 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#0D9488] text-white hover:bg-[#0b7a70] transition-colors shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 shadow-lg">
          <ul className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-colors text-center"
            >
              Log In
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#0D9488] text-white hover:bg-[#0b7a70] transition-colors text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
