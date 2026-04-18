"use client"

import React, { useState } from "react"
import {
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Lock,
  BookOpen,
  School,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Globe,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Step1Data {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface Step2Data {
  childName: string
  grade: string
  schoolName: string
  subjects: string[]
  timezone: string
  preferredSchedule: string
}

const STEP1_INIT: Step1Data = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
}

const STEP2_INIT: Step2Data = {
  childName: "",
  grade: "",
  schoolName: "",
  subjects: [],
  timezone: "",
  preferredSchedule: "",
}

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language Arts",
  "Computer Science",
  "SAT Prep",
  "ACT Prep",
]

const GRADE_OPTIONS = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
]

const TIMEZONE_OPTIONS = [
  { value: "EST", label: "EST (Eastern)" },
  { value: "CST", label: "CST (Central)" },
  { value: "MST", label: "MST (Mountain)" },
  { value: "PST", label: "PST (Pacific)" },
]

const SCHEDULE_OPTIONS = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Weekends Only",
  "Flexible",
]

/* ─────────────────────────────────────────────
   Left Branding Panel
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
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-xl">
          <GraduationCap className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Expert Guru
        </h2>
        <p className="text-white/75 text-base mb-10 leading-relaxed">{tagline}</p>
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
        <div className="mt-12 flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-white/70 text-xs font-medium">Join 500+ families learning today</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Auth Input
───────────────────────────────────────────── */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ElementType
  error?: string
  rightElement?: React.ReactNode
}

function AuthInput({ label, icon: Icon, error, rightElement, className, id, ...props }: AuthInputProps) {
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
            error && "border-[#EF4444] focus:ring-[#EF4444]/30",
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
   Auth Select
───────────────────────────────────────────── */
function AuthSelect({
  label,
  id,
  icon: Icon,
  children,
  value,
  onChange,
}: {
  label: string
  id: string
  icon?: React.ElementType
  children: React.ReactNode
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#1E293B]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#1E293B] transition-all appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] focus:bg-white",
            Icon ? "pl-10 pr-4" : "px-4"
          )}
        >
          {children}
        </select>
        {/* Chevron */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Password Toggle
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
   Step Indicator
───────────────────────────────────────────── */
const STEP_LABELS = ["Parent Info", "Child Details", "Confirmation"]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8 select-none">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1
        const isCompleted = stepNum < current
        const isActive = stepNum === current
        return (
          <React.Fragment key={label}>
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border-2",
                  isCompleted
                    ? "bg-[#22C55E]/10 border-[#22C55E]"
                    : isActive
                    ? "bg-[#0D9488] border-[#0D9488] shadow-lg shadow-[#0D9488]/25"
                    : "bg-white border-gray-200"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                ) : (
                  <span className={isActive ? "text-white" : "text-gray-400"}>
                    {stepNum}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  isActive
                    ? "text-[#0D9488]"
                    : isCompleted
                    ? "text-[#22C55E]"
                    : "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-300",
                  stepNum < current ? "bg-[#22C55E]" : "bg-gray-200"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   STEP 1 — Parent Information
───────────────────────────────────────────── */
function Step1({
  data,
  onChange,
  onNext,
}: {
  data: Step1Data
  onChange: (d: Partial<Step1Data>) => void
  onNext: () => void
}) {
  const [pwVisible, pwToggle] = usePasswordToggle()
  const [cpwVisible, cpwToggle] = usePasswordToggle()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthInput
        label="Full Name"
        id="reg-fullname"
        type="text"
        placeholder="Jane Smith"
        icon={User}
        value={data.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        required
      />
      <AuthInput
        label="Email Address"
        id="reg-email"
        type="email"
        placeholder="parent@example.com"
        icon={Mail}
        value={data.email}
        onChange={(e) => onChange({ email: e.target.value })}
        required
      />
      <AuthInput
        label="Phone Number"
        id="reg-phone"
        type="tel"
        placeholder="+1 (555) 123-4567"
        icon={Phone}
        value={data.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
      />
      <AuthInput
        label="Password"
        id="reg-password"
        type={pwVisible ? "text" : "password"}
        placeholder="Create a strong password"
        icon={Lock}
        value={data.password}
        onChange={(e) => onChange({ password: e.target.value })}
        rightElement={pwToggle}
        required
      />
      <AuthInput
        label="Confirm Password"
        id="reg-confirm-password"
        type={cpwVisible ? "text" : "password"}
        placeholder="Repeat your password"
        icon={Lock}
        value={data.confirmPassword}
        onChange={(e) => onChange({ confirmPassword: e.target.value })}
        rightElement={cpwToggle}
        required
      />

      {/* Password strength hint */}
      {data.password.length > 0 && (
        <div className="flex gap-1.5 items-center">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                data.password.length >= bar * 3
                  ? bar <= 2 ? "bg-[#F59E0B]" : "bg-[#22C55E]"
                  : "bg-gray-200"
              )}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {data.password.length < 6 ? "Weak" : data.password.length < 10 ? "Fair" : "Strong"}
          </span>
        </div>
      )}

      <button
        type="submit"
        className="w-full h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] active:scale-[0.98] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-2"
      >
        Next: Child Details
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )
}

/* ─────────────────────────────────────────────
   STEP 2 — Child Details
───────────────────────────────────────────── */
function Step2({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: Step2Data
  onChange: (d: Partial<Step2Data>) => void
  onNext: () => void
  onBack: () => void
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const toggleSubject = (subject: string) => {
    onChange({
      subjects: data.subjects.includes(subject)
        ? data.subjects.filter((s) => s !== subject)
        : [...data.subjects, subject],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthInput
        label="Child's Full Name"
        id="reg-child-name"
        type="text"
        placeholder="Alex Smith"
        icon={User}
        value={data.childName}
        onChange={(e) => onChange({ childName: e.target.value })}
        required
      />

      <AuthSelect
        label="Grade Level"
        id="reg-grade"
        icon={School}
        value={data.grade}
        onChange={(v) => onChange({ grade: v })}
      >
        <option value="" disabled>Select Grade</option>
        {GRADE_OPTIONS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </AuthSelect>

      <AuthInput
        label="School Name"
        id="reg-school"
        type="text"
        placeholder="Lincoln High School"
        icon={School}
        value={data.schoolName}
        onChange={(e) => onChange({ schoolName: e.target.value })}
      />

      {/* Subjects multi-select */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          Subjects Needed
        </p>
        <div className="grid grid-cols-2 gap-2.5 bg-gray-50 rounded-xl border border-gray-200 p-4">
          {SUBJECT_OPTIONS.map((subject) => (
            <label
              key={subject}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <Checkbox
                checked={data.subjects.includes(subject)}
                onCheckedChange={() => toggleSubject(subject)}
                className="data-[state=checked]:bg-[#0D9488] data-[state=checked]:border-[#0D9488]"
              />
              <span className="text-sm text-gray-600 group-hover:text-[#1E293B] transition-colors">
                {subject}
              </span>
            </label>
          ))}
        </div>
        {data.subjects.length > 0 && (
          <p className="text-xs text-[#0D9488] font-medium">
            {data.subjects.length} subject{data.subjects.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      <AuthSelect
        label="Time Zone"
        id="reg-timezone"
        icon={Globe}
        value={data.timezone}
        onChange={(v) => onChange({ timezone: v })}
      >
        <option value="" disabled>Select Timezone</option>
        {TIMEZONE_OPTIONS.map((tz) => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </AuthSelect>

      <AuthSelect
        label="Preferred Schedule"
        id="reg-schedule"
        icon={Calendar}
        value={data.preferredSchedule}
        onChange={(v) => onChange({ preferredSchedule: v })}
      >
        <option value="" disabled>Select Preference</option>
        {SCHEDULE_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </AuthSelect>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          className="flex-[2] h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] active:scale-[0.98] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          Next: Review
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────
   STEP 3 — Review & Confirm
───────────────────────────────────────────── */
function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 min-w-[130px] flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-[#1E293B] flex-1 text-right break-words">{value}</span>
    </div>
  )
}

function Step3({
  step1,
  step2,
  onBack,
  onSubmit,
  isLoading,
  error,
}: {
  step1: Step1Data
  step2: Step2Data
  onBack: () => void
  onSubmit: () => void
  isLoading: boolean
  error: string
}) {
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeGuardian, setAgreeGuardian] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const maskEmail = (email: string) => {
    const [user, domain] = email.split("@")
    if (!domain) return email
    return `${user.slice(0, 2)}***@${domain}`
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Parent summary */}
      <div className="bg-[#F8FAFC] rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-[#1E3A5F]/5 border-b border-gray-100">
          <p className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wide">
            Parent Information
          </p>
        </div>
        <div className="px-4 py-1">
          <ReviewRow label="Full Name" value={step1.fullName || "—"} />
          <ReviewRow label="Email" value={step1.email ? maskEmail(step1.email) : "—"} />
          <ReviewRow label="Phone" value={step1.phone || "—"} />
        </div>
      </div>

      {/* Child summary */}
      <div className="bg-[#F8FAFC] rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-[#0D9488]/5 border-b border-gray-100">
          <p className="text-xs font-bold text-[#0D9488] uppercase tracking-wide">
            Child Details
          </p>
        </div>
        <div className="px-4 py-1">
          <ReviewRow label="Child's Name" value={step2.childName || "—"} />
          <ReviewRow label="Grade" value={step2.grade || "—"} />
          <ReviewRow label="School" value={step2.schoolName || "—"} />
          <ReviewRow
            label="Subjects"
            value={
              step2.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-1 justify-end">
                  {step2.subjects.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-semibold rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )
            }
          />
          <ReviewRow label="Timezone" value={step2.timezone || "—"} />
          <ReviewRow label="Schedule" value={step2.preferredSchedule || "—"} />
        </div>
      </div>

      {/* Mandatory checkboxes */}
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(checked === true)}
            className="mt-0.5 data-[state=checked]:bg-[#0D9488] data-[state=checked]:border-[#0D9488]"
          />
          <span className="text-sm text-gray-600 group-hover:text-[#1E293B] transition-colors leading-relaxed">
            I agree to the{" "}
            <span className="font-semibold text-[#0D9488] underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="font-semibold text-[#0D9488] underline cursor-pointer">
              Privacy Policy
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={agreeGuardian}
            onCheckedChange={(checked) => setAgreeGuardian(checked === true)}
            className="mt-0.5 data-[state=checked]:bg-[#0D9488] data-[state=checked]:border-[#0D9488]"
          />
          <span className="text-sm text-gray-600 group-hover:text-[#1E293B] transition-colors leading-relaxed">
            I confirm I am the{" "}
            <span className="font-semibold text-[#1E293B]">parent or legal guardian</span> of
            the child being registered{" "}
            <span className="text-xs text-gray-400">(COPPA requirement)</span>
          </span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={!agreeTerms || !agreeGuardian || isLoading}
          className={cn(
            "flex-[2] h-12 rounded-xl text-white font-bold text-sm active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2",
            agreeTerms && agreeGuardian && !isLoading
              ? "bg-[#0D9488] hover:bg-[#0b7a70] hover:shadow-md"
              : "bg-gray-300 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        After registration, a coordinator will contact you within 24 hours.
      </p>
    </form>
  )
}


/* ─────────────────────────────────────────────
   Success View
───────────────────────────────────────────── */
function SuccessView({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-4">
      <div className="w-20 h-20 rounded-full bg-[#0D9488]/10 flex items-center justify-center mb-2">
        <Mail className="w-10 h-10 text-[#0D9488]" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-[#1E293B] mb-1">
          Check Your Email
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
          Hi <span className="font-semibold text-[#1E293B]">{name || "there"}</span>! We&apos;ve
          sent a verification link to your email address. Please click the link to activate your
          account.
        </p>
      </div>

      <div className="w-full bg-[#F8FAFC] rounded-xl border border-gray-100 p-4 text-left mt-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          What happens next?
        </p>
        {[
          "Open the verification email in your inbox",
          "Click the verification link to activate your account",
          "Log in and a coordinator will be in touch within 24h",
          "Schedule your child's first free trial class",
        ].map((item, i) => (
          <div key={item} className="flex items-start gap-2.5 mb-2 last:mb-0">
            <div className="w-5 h-5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <span className="text-sm text-gray-600">{item}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Didn&apos;t receive the email? Check your spam folder or{" "}
        <a
          href="/login"
          className="font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
        >
          try logging in
        </a>{" "}
        to resend.
      </p>

      <a
        href="/login"
        className="w-full mt-2 h-12 rounded-xl bg-[#0D9488] text-white font-bold text-sm hover:bg-[#0b7a70] transition-all flex items-center justify-center gap-2"
      >
        Go to Login
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  )
}



/* ─────────────────────────────────────────────
   REGISTRATION PAGE (main export)
───────────────────────────────────────────── */
export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitted, setSubmitted] = useState(false)
  const [step1, setStep1] = useState<Step1Data>(STEP1_INIT)
  const [step2, setStep2] = useState<Step2Data>(STEP2_INIT)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const updateStep1 = (partial: Partial<Step1Data>) =>
    setStep1((prev) => ({ ...prev, ...partial }))
  const updateStep2 = (partial: Partial<Step2Data>) =>
    setStep2((prev) => ({ ...prev, ...partial }))

  async function handleRegister() {
    setError("")
    setIsLoading(true)

    // Parse name into first/last
    const nameParts = step1.fullName.trim().split(/\s+/)
    const parentFirstName = nameParts[0] || ""
    const parentLastName = nameParts.slice(1).join(" ") || nameParts[0] || ""

    const childParts = step2.childName.trim().split(/\s+/)
    const childFirstName = childParts[0] || ""
    const childLastName = childParts.slice(1).join(" ") || childParts[0] || ""

    // Map grade format — Genspark uses "Grade 8", API expects "8"
    const gradeNum = step2.grade.replace("Grade ", "")

    // Map timezone — Genspark uses "EST", API expects "America/New_York"
    const tzMap: Record<string, string> = {
      EST: "America/New_York",
      CST: "America/Chicago",
      MST: "America/Denver",
      PST: "America/Los_Angeles",
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFirstName,
          parentLastName,
          parentEmail: step1.email,
          parentPhone: step1.phone,
          password: step1.password,
          childFirstName,
          childLastName,
          childGrade: gradeNum,
          childSchool: step2.schoolName,
          childSubjects: step2.subjects,
          childTimezone: tzMap[step2.timezone] || "America/New_York",
          scheduleNotes: step2.preferredSchedule,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
        setIsLoading(false)
        return
      }

      // Show success view first
      setSubmitted(true)
      setIsLoading(false)
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const stepTitles: Record<number, { heading: string; sub: string }> = {
    1: {
      heading: "Create Your Account",
      sub: "Only parents can register on behalf of their children (COPPA compliance)",
    },
    2: {
      heading: "Tell Us About Your Child",
      sub: "Help us match your child with the perfect tutor",
    },
    3: {
      heading: "Review & Confirm",
      sub: "Double-check your details before submitting",
    },
  }

  const current = stepTitles[step]

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Left panel */}
      <AuthLeftPanel
        tagline="Join 500+ Families Already Learning"
        bullets={[
          "1 Free Trial Per Subject",
          "No Credit Card Required",
          "Dedicated Education Coordinator",
        ]}
      />

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#0D9488]" />
          </div>
          <span className="text-xl font-bold text-[#1E3A5F]">Expert Guru</span>
        </div>

        <div className="w-full max-w-md">
          {submitted ? (
            <SuccessView name={step1.fullName} />
          ) : (
            <>
              {/* Page heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[#1E3A5F] mb-1.5">
                  {current.heading}
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed">{current.sub}</p>
              </div>

              {/* Step indicator */}
              <StepIndicator current={step} />

              {/* Steps */}
              {step === 1 && (
                <Step1 data={step1} onChange={updateStep1} onNext={() => setStep(2)} />
              )}
              {step === 2 && (
                <Step2
                  data={step2}
                  onChange={updateStep2}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Step3
                  step1={step1}
                  step2={step2}
                  onBack={() => setStep(2)}
                  onSubmit={handleRegister}
                  isLoading={isLoading}
                  error={error}
                />
              )}

              {/* Sign in link */}
              {step === 1 && (
                <p className="text-sm text-gray-500 text-center mt-6">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-[#0D9488] hover:text-[#0b7a70] transition-colors"
                  >
                    Log In
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

