"use client"

import React, { useState } from "react"
import {
  KeyRound,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────
   FORGOT PASSWORD PAGE
───────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setEmail("")
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      {/* Top logo bar */}
      <a
        href="/"
        className="flex items-center gap-2 mb-10 group"
      >
        {/* <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center group-hover:bg-[#1E3A5F]/20 transition-colors">
          <GraduationCap className="w-5 h-5 text-[#0D9488]" />
        </div>
        <span className="text-xl font-bold text-[#1E3A5F] tracking-tight">
          Expert Guru
        </span> */}
        <img src="/images/eglogo.png" alt="Expert Guru" className="h-20 w-auto mb-2" />
      </a>

      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Card top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A5F] via-[#0D9488] to-[#F59E0B]" />

        <div className="p-8">
          {submitted ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center text-center gap-5">
              {/* Animated success icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
                </div>
                {/* Ripple rings */}
                <div className="absolute inset-0 rounded-full border-2 border-[#22C55E]/30 scale-110 animate-ping opacity-30" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-[#1E3A5F] mb-2">
                  Check Your Email
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  We&apos;ve sent a password reset link to{" "}
                  <span className="font-semibold text-[#1E293B]">{email}</span>.
                  The link expires in{" "}
                  <span className="font-semibold text-[#1E293B]">24 hours</span>.
                </p>
              </div>

              {/* Email preview hint */}
              <div className="w-full bg-[#F8FAFC] rounded-xl border border-gray-100 p-4 text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Didn&apos;t receive the email?
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Check your spam or junk folder",
                    "Make sure you typed the correct email",
                    "Wait a few minutes and try again",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-gray-500">
                      <span className="text-[#0D9488] font-bold mt-0.5">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resend button */}
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 text-sm font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try a different email
              </button>

              {/* Back to login */}
              <a
                href="/login"
                className="w-full h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </a>
            </div>
          ) : (
            /* ── Request State ── */
            <>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-[#0D9488]" strokeWidth={1.5} />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-extrabold text-[#1E3A5F] mb-2">
                  Forgot Password?
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>
              
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="text-sm font-semibold text-[#1E293B]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="parent@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className={cn(
                        "w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#1E293B] placeholder:text-gray-400 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] focus:bg-white"
                      )}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={cn(
                    "w-full h-12 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm",
                    isLoading || !email
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#0D9488] hover:bg-[#0b7a70] hover:shadow-md"
                  )}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-6 text-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </a>
              </div>

              {/* Help note */}
              <p className="text-xs text-gray-400 text-center leading-relaxed mt-4">
                If you don&apos;t receive an email within 5 minutes, please contact us at{" "}
                <span className="font-medium text-gray-500">info@expertguru.net</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-8 text-center">
        © 2026 Expert Guru. All rights reserved.
      </p>
    </div>
  )
}
