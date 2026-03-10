"use client"

import React, { useState } from "react"
import { CheckCircle2 } from "lucide-react"

type FormState = {
  parentName: string
  email: string
  phone: string
  grade: string
  subject: string
  timezone: string
}

const INITIAL_STATE: FormState = {
  parentName: "",
  email: "",
  phone: "",
  grade: "",
  subject: "",
  timezone: "",
}

export function BookDemo() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Placeholder submit – no API call
    setSubmitted(true)
  }

  return (
    <section id="pricing" className="bg-[#F8FAFC] py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold tracking-wider uppercase mb-4">
            Free Trial
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A5F] mb-4">
            Book Your Free Demo Session
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Fill in the details and we&apos;ll match you with the perfect tutor
          </p>
        </div>

        {/* Form card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-bold text-[#1E293B]">Request Received!</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Thank you! We&apos;ll contact you within 24 hours to schedule your free trial session.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 px-5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Parent Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="parentName" className="text-sm font-semibold text-[#1E293B]">
                    Parent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="parentName"
                    name="parentName"
                    type="text"
                    placeholder="e.g. Sarah Johnson"
                    value={form.parentName}
                    onChange={handleChange}
                    required
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-[#1E293B]">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="sarah@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-sm font-semibold text-[#1E293B]">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Grade + Subject row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Child's Grade */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="grade" className="text-sm font-semibold text-[#1E293B]">
                      Child&apos;s Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="grade"
                      name="grade"
                      value={form.grade}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select Grade</option>
                      <option value="grade-1-5">Grade 1–5</option>
                      <option value="grade-6-8">Grade 6–8</option>
                      <option value="grade-9-12">Grade 9–12</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subject" className="text-sm font-semibold text-[#1E293B]">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select Subject</option>
                      <option value="mathematics">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="english">English</option>
                      <option value="sat-act">SAT/ACT Prep</option>
                      <option value="computer-science">Computer Science</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Timezone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="timezone" className="text-sm font-semibold text-[#1E293B]">
                    Preferred Time Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    required
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Timezone</option>
                    <option value="EST">EST – Eastern Time</option>
                    <option value="CST">CST – Central Time</option>
                    <option value="MST">MST – Mountain Time</option>
                    <option value="PST">PST – Pacific Time</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] transition-all shadow-sm hover:shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  Book Free Demo →
                </button>

                {/* Disclaimer */}
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  We&apos;ll contact you within 24 hours to schedule your free trial.
                  <br />
                  No credit card required.
                </p>
              </form>
            )}
          </div>

          {/* Trust indicators below form */}
          <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
            {[
              "✓ 100% Free Trial",
              "✓ No Credit Card",
              "✓ Cancel Anytime",
            ].map((item) => (
              <span key={item} className="text-xs text-gray-500 font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
