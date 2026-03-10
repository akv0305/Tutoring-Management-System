"use client"

import React, { useState } from "react"
import {
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────
   Shared: Left Branding Panel
───────────────────────────────────────────── */
function AuthLeftPanel({
  tagline,
  bullets,
}: {
  tagline: string
  bullets: string[]
}) {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-12 py-16 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1E3A5F 0%, #0D9488 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Logo icon */}
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-xl">
          <GraduationCap className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>

        {/* Brand name */}
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Expert Guru
        </h2>

        {/* Tagline */}
        <p className="text-white/75 text-base mb-10 leading-relaxed">{tagline}</p>

        {/* Feature bullets */}
        <ul className="flex flex-col gap-4 w-full text-left">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-[#22C55E]" />
              </div>
              <span className="text-white/85 text-sm font-medium">{bullet}</span>
            </li>
          ))}
        </ul>

        {/* Bottom decorative pill */}
        <div className="mt-12 flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-white/70 text-xs font-medium">500+ families learning today</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Input Component (local to auth pages)
───────────────────────────────────────────── */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ElementType
  error?: string
  rightElement?: React.ReactNode
}

function AuthInput({
  label,
  icon: Icon,
  error,
  rightElement,
  className,
  id,
  ...props
}: AuthInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-[#1E293B]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#1E293B] placeholder:text-gray-400 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] focus:bg-white",
            Icon ? "pl-10" : "pl-4",
            rightElement ? "pr-11" : "pr-4",
            error && "border-[#EF4444] focus:ring-[#EF4444]/30 focus:border-[#EF4444]",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-[#EF4444] mt-0.5">{error}</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Password Toggle Hook helper
───────────────────────────────────────────── */
function usePasswordToggle(): [boolean, React.ReactNode] {
  const [visible, setVisible] = useState(false)
  const toggle = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setVisible((v) => !v)}
      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )
  return [visible, toggle]
}

/* ─────────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pwVisible, pwToggle] = usePasswordToggle()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder — no real auth
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Left branding panel */}
      <AuthLeftPanel
        tagline="Learn Anywhere, Succeed Everywhere"
        bullets={[
          "Personalized 1-on-1 Tutoring",
          "Top 1% Qualified Tutors",
          "Flexible Scheduling Across Time Zones",
        ]}
      />

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile logo (visible only on small screens) */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#0D9488]" />
          </div>
          <span className="text-xl font-bold text-[#1E3A5F]">Expert Guru</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#1E3A5F] mb-1.5">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">
              Log in to your Expert Guru account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <AuthInput
              label="Email Address"
              id="login-email"
              type="email"
              placeholder="parent@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <AuthInput
                label="Password"
                id="login-password"
                type={pwVisible ? "text" : "password"}
                placeholder="Enter your password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={pwToggle}
                autoComplete="current-password"
              />
              {/* Forgot password link — right aligned */}
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] active:scale-[0.98] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-1"
            >
              Log In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-sm text-gray-500 text-center mt-6">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
            >
              Sign Up
            </a>
          </p>

          {/* Social divider (visual only) */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google button placeholder */}
          <button
            type="button"
            className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#1E293B] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm"
          >
            {/* Google "G" icon placeholder */}
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#34A853] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
              G
            </span>
            Continue with Google
          </button>

          {/* Legal */}
          <p className="text-[11px] text-gray-400 text-center leading-relaxed mt-6">
            By logging in, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-gray-600 transition-colors">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="underline cursor-pointer hover:text-gray-600 transition-colors">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
