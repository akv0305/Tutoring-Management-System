"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ShieldCheck,
  BookOpen,
  Target,
  MessageCircle,
  BarChart3,
  MapPin,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Zap,
  BadgeCheck,
} from "lucide-react"
import { RatingStars } from "@/components/ui/RatingStars"

/* ─── Hard-coded profile data (ignores dynamic [id]) ─── */
const PROFILE = {
  initials: "AS",
  name: "Dr. Ananya Sharma",
  qualification: "Ph.D. in Mathematics — IIT Delhi",
  subjects: ["Mathematics", "AP Calculus", "SAT Math"],
  subjectColors: [
    "bg-teal-50 text-teal-700 border-teal-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-orange-50 text-orange-700 border-orange-200",
  ],
  experience: "8 years teaching experience",
  location: "Based in India • Teaches US students",
  bio: "Dr. Ananya Sharma holds a Ph.D. in Mathematics from IIT Delhi with 8 years of experience teaching students from Grade 6 through Grade 12 and AP level. She specializes in making complex mathematical concepts accessible and engaging. Her students consistently report significant grade improvements, with many achieving A grades within 3 months of tutoring. She follows each student's school textbook to ensure alignment with classroom learning.",
  rating: 4.9,
  reviewCount: 156,
  price: "$55",
  availability: "Mon–Fri, 8AM–2PM EST",
}

const METHODOLOGY = [
  { icon: BookOpen,       text: "Follows your child's school textbook and curriculum" },
  { icon: Target,        text: "Identifies weak areas and creates targeted practice plans" },
  { icon: MessageCircle, text: "Provides homework help between sessions via messaging" },
  { icon: BarChart3,     text: "Tracks progress with regular assessments and parent updates" },
]

const REVIEWS = [
  { rating: 5, from: "Jane Smith (Alex's parent)",   date: "Mar 8, 2026",  text: "Dr. Ananya is exceptional. My son went from a C to an A in math in just 3 months. She's patient, thorough, and always prepared." },
  { rating: 5, from: "Lisa Chen (Ryan's parent)",    date: "Mar 5, 2026",  text: "Ryan loves his math sessions. Dr. Ananya makes fractions fun and understandable." },
  { rating: 5, from: "Vikram Patel (Priya's parent)",date: "Feb 28, 2026", text: "Amazing AP Calculus tutor. Priya's confidence has grown so much since starting." },
  { rating: 4, from: "Maria Brown (Aiden's parent)", date: "Feb 20, 2026", text: "Good sessions overall. Would appreciate a bit more focus on test-taking strategies." },
]

const PACKAGES_AVAILABLE = [
  { classes: "4 Classes",  price: "$220",  perClass: "$55/class", validity: "30 days", badge: null,         badgeColor: "" },
  { classes: "6 Classes",  price: "$312",  perClass: "$52/class", validity: "45 days", badge: "Popular",    badgeColor: "bg-amber-100 text-amber-700" },
  { classes: "8 Classes",  price: "$400",  perClass: "$50/class", validity: "60 days", badge: "Best Value", badgeColor: "bg-green-100 text-green-700" },
]

const STATS = [
  { label: "Total Classes Taught", value: "156" },
  { label: "Active Students",       value: "28" },
  { label: "Completion Rate",       value: "98.7%" },
  { label: "Avg Response Time",     value: "< 2 hours" },
]

/* ─── Page ─── */
export default function TeacherProfilePage() {
  const [trialBooked, setTrialBooked] = useState(false)

  return (
    <div className="space-y-6">

      {/* ── Back link ── */}
      <Link
        href="/parent/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-[#0D9488] font-medium hover:underline"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Teachers
      </Link>

      {/* ── Profile Header card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div
          className="h-24"
          style={{ background: "linear-gradient(135deg, #0D9488 0%, #1E3A5F 100%)" }}
        />

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Avatar (overlaps banner) */}
          <div className="-mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-[#0D9488] flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-white text-3xl font-bold">{PROFILE.initials}</span>
            </div>
          </div>

          {/* Name + verification */}
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1E293B]">{PROFILE.name}</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{PROFILE.qualification}</p>
            </div>
          </div>

          {/* Subjects */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PROFILE.subjects.map((sub, i) => (
              <span
                key={sub}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${PROFILE.subjectColors[i] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-[#0D9488]" />
              {PROFILE.experience}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0D9488]" />
              {PROFILE.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              {PROFILE.availability}
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT col-span-2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Card A — About */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-3">
              About {PROFILE.name}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{PROFILE.bio}</p>
          </div>

          {/* Card B — Teaching Methodology */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Teaching Methodology</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {METHODOLOGY.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-lg bg-teal-50/50 border border-teal-100 p-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#0D9488]" />
                  </div>
                  <p className="text-sm text-[#1E293B] leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card C — Reviews */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1E293B]">Reviews</h2>
              <span className="text-sm text-gray-400">
                {PROFILE.rating} average from {PROFILE.reviewCount} reviews
              </span>
            </div>

            {/* Overall rating display */}
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-center flex-shrink-0">
                <p className="text-4xl font-bold text-[#1E293B]">{PROFILE.rating}</p>
                <RatingStars rating={PROFILE.rating} size="sm" />
                <p className="text-xs text-gray-400 mt-1">{PROFILE.reviewCount} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 78 : star === 4 ? 16 : star === 3 ? 4 : star === 2 ? 1 : 1
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4">{star}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Review list */}
            <div className="flex flex-col gap-4">
              {REVIEWS.map((review, i) => (
                <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">{review.from}</p>
                      <RatingStars rating={review.rating} size="sm" />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{review.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>

            <button className="mt-4 text-sm text-[#0D9488] font-medium hover:underline">
              View All {PROFILE.reviewCount} Reviews →
            </button>
          </div>
        </div>

        {/* RIGHT col-span-1 */}
        <div className="flex flex-col gap-6">

          {/* Card D — Book a Session (sticky) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-3">Book with {PROFILE.name.split(" ").slice(-1)[0]}</h2>

            {/* Price + rating */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-bold text-[#0D9488]">{PROFILE.price} <span className="text-sm font-normal text-gray-400">/ hour</span></p>
            </div>
            <RatingStars rating={PROFILE.rating} count={PROFILE.reviewCount} size="sm" />

            {/* Availability */}
            <div className="flex items-center gap-2 mt-3 mb-4 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              Available: {PROFILE.availability}
            </div>

            <div className="border-t border-gray-100 mb-4" />

            {/* Trial CTA */}
            {!trialBooked ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">🎉 1 Free Trial Available for this subject!</p>
                <button
                  onClick={() => setTrialBooked(true)}
                  className="w-full py-2.5 rounded-lg bg-[#F59E0B] text-[#1E293B] font-semibold text-sm hover:bg-amber-400 transition-colors shadow-sm"
                >
                  Book Free Trial
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-800">Trial booked! Your coordinator will confirm the time.</p>
              </div>
            )}

            {/* Divider with OR */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Regular booking */}
            <div className="flex flex-col gap-2 mb-5">
              <button className="w-full py-2.5 rounded-lg border border-[#0D9488] text-[#0D9488] font-semibold text-sm hover:bg-teal-50 transition-colors">
                Book Single Class
              </button>
              <button className="w-full py-2.5 rounded-lg bg-[#0D9488] text-white font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm">
                Buy Package
              </button>
            </div>

            <div className="border-t border-gray-100 mb-4" />

            {/* Available Packages */}
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Available Packages</h3>
            <div className="flex flex-col gap-2">
              {PACKAGES_AVAILABLE.map((pkg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1E293B]">{pkg.classes}</span>
                      {pkg.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${pkg.badgeColor}`}>
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-[#0D9488]">{pkg.price}</span>
                      <span className="text-xs text-gray-400">({pkg.perClass})</span>
                      <span className="text-xs text-gray-400">• {pkg.validity}</span>
                    </div>
                  </div>
                  <button className="flex-shrink-0 px-3 py-1.5 rounded-md border border-[#0D9488] text-[#0D9488] text-xs font-semibold hover:bg-teal-50 transition-colors">
                    Buy
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card E — Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Stats</h2>
            <div className="flex flex-col gap-3">
              {STATS.map(({ label, value }, i) => {
                const icons = [CheckCircle, Users, TrendingUp, Zap]
                const Icon = icons[i]
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#0D9488]" />
                      <span className="text-sm text-gray-500">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-[#1E293B]">{value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
