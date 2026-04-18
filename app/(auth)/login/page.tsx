"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, GraduationCap, Loader2, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get("verified")
    const urlError = params.get("error")

    if (verified === "true") {
      setSuccessMessage("Email verified successfully! You can now sign in.")
    } else if (verified === "already") {
      setSuccessMessage("Your email is already verified. Please sign in.")
    } else if (urlError === "invalid-token") {
      setError("This verification link is invalid or has already been used.")
    } else if (urlError === "verification-failed") {
      setError("Email verification failed. Please try again or contact support.")
    }

    if (params.toString()) {
      window.history.replaceState({}, "", "/login")
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setNeedsVerification(false)
    setResendDone(false)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        // Detect verification error from auth response
        if (result.error.toLowerCase().includes("verify your email")) {
          setNeedsVerification(true)
          setError(result.error)
          setIsLoading(false)
          return
        }

        // Handle undefined or CSRF errors gracefully
        if (result.error === "undefined" || !result.error || result.error === "CredentialsSignin") {
          // Retry once — CSRF token may have been stale
          const retryResult = await signIn("credentials", {
            email: email.toLowerCase().trim(),
            password,
            redirect: false,
          })

          if (retryResult?.error) {
            setError("Invalid email or password. Please try again.")
            setIsLoading(false)
            return
          }

          if (retryResult?.ok) {
            const sessionRes = await fetch("/api/auth/session")
            const session = await sessionRes.json()
            if (session?.user?.role) {
              const roleRoutes: Record<string, string> = {
                ADMIN: "/admin",
                COORDINATOR: "/coordinator",
                TEACHER: "/teacher",
                PARENT: "/parent",
              }
              window.location.href = roleRoutes[session.user.role] || "/"
              return
            }
          }

          setError("Something went wrong. Please try again.")
          setIsLoading(false)
          return
        }

        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()

        if (session?.user?.role) {
          const roleRoutes: Record<string, string> = {
            ADMIN: "/admin",
            COORDINATOR: "/coordinator",
            TEACHER: "/teacher",
            PARENT: "/parent",
          }
          window.location.href = roleRoutes[session.user.role] || "/"
        } else {
          window.location.href = "/"
        }
      } else {
        setError("Sign in failed. Please try again.")
        setIsLoading(false)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  async function resendVerification() {
    setResendLoading(true)
    setResendDone(false)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResendDone(true)
        setError("")
        setSuccessMessage(data.message || "Verification email sent! Please check your inbox.")
        setNeedsVerification(false)
      }
    } catch {
      setError("Failed to resend verification email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — gradient */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)",
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            {/* <GraduationCap className="w-8 h-8 text-[#F59E0B]" />
            <span className="text-white font-bold text-xl">Expert Guru</span> */}
            <img src="/images/eglogo_white.png" alt="Expert Guru" className="h-20 w-auto mb-2" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Empowering students with
            <br />
            <span className="text-[#F59E0B]">world-class tutoring</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Personalized 1-on-1 online tutoring from India&apos;s top educators.
            Same tutor every session. Real results.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-white/60 text-sm">Students</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">100+</p>
            <p className="text-white/60 text-sm">Tutors</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">4.8</p>
            <p className="text-white/60 text-sm">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <GraduationCap className="w-7 h-7 text-[#0D9488]" />
            <span className="text-[#1E3A5F] font-bold text-lg">Expert Guru</span>
          </div>

          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Welcome Back</h2>
          <p className="text-gray-500 mb-8">
            Sign in to continue to your dashboard
          </p>

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-600 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              {needsVerification && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendLoading}
                  className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors disabled:opacity-60"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
              )}
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1E293B] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#1E293B]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#0D9488] hover:text-[#0D9488]/80 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm text-[#1E293B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                  disabled={isLoading}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#0D9488] text-white rounded-xl text-sm font-semibold hover:bg-[#0D9488]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#0D9488] font-semibold hover:text-[#0D9488]/80 transition-colors"
            >
              Sign Up
            </Link>
          </p>

          {/* TOS */}
          <p className="text-center text-xs text-gray-400 mt-4">
            By signing in, you agree to our{" "}
            <span className="text-[#0D9488] cursor-pointer hover:underline">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-[#0D9488] cursor-pointer hover:underline">
              Privacy Policy
            </span>
          </p>

          {/* Dev helper — remove in production */}
          {/* <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-700 mb-2">
              🔑 Test Accounts (Dev Only)
            </p>
            <div className="space-y-1 text-xs text-amber-600">
              <p>Admin: admin@expertguru.net</p>
              <p>Coordinator: sarah.coord@expertguru.net</p>
              <p>Teacher: ananya.teacher@expertguru.net</p>
              <p>Parent: jane.smith@email.com</p>
              <p className="font-medium mt-1">Password: Password123!</p>
            </div>
          </div>  */}
        </div>
      </div>
    </div>
  )
}
