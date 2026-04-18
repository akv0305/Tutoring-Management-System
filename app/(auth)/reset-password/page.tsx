"use client"

import React, { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
        <a href="/" className="flex items-center gap-2 mb-10 group">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center group-hover:bg-[#1E3A5F]/20 transition-colors">
            <GraduationCap className="w-5 h-5 text-[#0D9488]" />
          </div>
          <span className="text-xl font-bold text-[#1E3A5F] tracking-tight">
            Expert Guru
          </span>
        </a>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A5F] via-[#0D9488] to-[#F59E0B]" />
          <div className="p-8">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-[#F59E0B]" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#1E3A5F] mb-2">
                  Invalid Reset Link
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  This password reset link is missing or invalid. Please request a
                  new reset link.
                </p>
              </div>
              <a
                href="/forgot-password"
                className="w-full h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                Request New Link
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </a>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center">
          © 2026 Expert Guru. All rights reserved.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      {/* Top logo bar */}
      <a href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center group-hover:bg-[#1E3A5F]/20 transition-colors">
          <GraduationCap className="w-5 h-5 text-[#0D9488]" />
        </div>
        <span className="text-xl font-bold text-[#1E3A5F] tracking-tight">
          Expert Guru
        </span>
      </a>

      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A5F] via-[#0D9488] to-[#F59E0B]" />

        <div className="p-8">
          {success ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#22C55E]/30 scale-110 animate-ping opacity-30" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-[#1E3A5F] mb-2">
                  Password Reset Successfully
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  Your password has been updated. You can now sign in with your
                  new password.
                </p>
              </div>

              <a
                href="/login?reset=true"
                className="w-full h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            /* ── Reset Form ── */
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
                  Set New Password
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enter your new password below
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                  {(error.includes("expired") || error.includes("invalid") || error.includes("already been used")) && (
                    <a
                      href="/forgot-password"
                      className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
                    >
                      Request a new reset link
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="new-password"
                    className="text-sm font-semibold text-[#1E293B]"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={cn(
                        "w-full h-11 pl-10 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#1E293B] placeholder:text-gray-400 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] focus:bg-white"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password strength hint */}
                {password.length > 0 && (
                  <div className="flex gap-1.5 items-center -mt-3">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={cn(
                          "flex-1 h-1 rounded-full transition-colors",
                          password.length >= bar * 3
                            ? bar <= 2
                              ? "bg-[#F59E0B]"
                              : "bg-[#22C55E]"
                            : "bg-gray-200"
                        )}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {password.length < 6
                        ? "Weak"
                        : password.length < 10
                        ? "Fair"
                        : "Strong"}
                    </span>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-sm font-semibold text-[#1E293B]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={cn(
                        "w-full h-11 pl-10 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#1E293B] placeholder:text-gray-400 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] focus:bg-white"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className={cn(
                    "w-full h-12 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm",
                    isLoading || !password || !confirmPassword
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#0D9488] hover:bg-[#0b7a70] hover:shadow-md"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
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
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-8 text-center">
        © 2026 Expert Guru. All rights reserved.
      </p>
    </div>
  )
}
