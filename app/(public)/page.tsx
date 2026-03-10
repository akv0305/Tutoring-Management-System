import React from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { ValueProps } from "@/components/landing/ValueProps"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Subjects } from "@/components/landing/Subjects"
import { Testimonials } from "@/components/landing/Testimonials"
import { StatsBar } from "@/components/landing/StatsBar"
import { BookDemo } from "@/components/landing/BookDemo"
import { Footer } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] scroll-smooth">
      {/* ── 1. Sticky Navigation ── */}
      <Navbar />

      {/* ── 2. Hero ── */}
      <Hero />

      {/* ── 3. Value Propositions ── */}
      <ValueProps />

      {/* ── 4. How It Works ── */}
      <HowItWorks />

      {/* ── 5. Subjects ── */}
      <Subjects />

      {/* ── 6. Testimonials ── */}
      <Testimonials />

      {/* ── 7. Stats Bar ── */}
      <StatsBar />

      {/* ── 8. Book Demo Form ── */}
      <BookDemo />

      {/* ── 9. Footer ── */}
      <Footer />
    </main>
  )
}
