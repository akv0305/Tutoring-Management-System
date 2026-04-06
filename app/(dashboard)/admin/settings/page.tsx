"use client"

import React, { useState, useEffect } from "react"
import {
  Settings,
  Bell,
  Package,
  Users,
  ShieldCheck,
  KeyRound,
  UserX,
  Info,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */

type PlatformSettings = {
  platformName: string
  supportEmail: string
  supportPhone: string
  defaultTimezone: string
  currency: string
  studentFreeWindow: number
  lateCancelPenalty: number
  noShowPenalty: number
  teacherMaxCancellations: number
  teacherNoShowRatingHit: number
  rescheduleWindowHours: number
  rescheduleLateFeePercent: number
  rescheduleHardCutoffHours: number
  cancelFreeWindowHours: number
  cancelLateFeePercent: number
  cancelHardCutoffHours: number
  cancelHardCutoffFeePercent: number
  maxReschedulesPerClass: number
  trialClassEnabled: boolean
  lowBalanceThreshold: number
  minPasswordLength: number
  passwordResetExpiry: number
  maxLoginAttempts: number
  lockoutDuration: number
}

/* ═══════════════════════════════════════════════════════════════
   INLINE TOGGLE
═══════════════════════════════════════════════════════════════ */
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <p className="text-sm font-medium text-[#1E293B]">{label}</p>}
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? "bg-[#0D9488]" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
═══════════════════════════════════════════════════════════════ */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-4">
      {children}
    </h3>
  )
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#1E293B] mb-1">
      {children}
    </label>
  )
}

function TextInput({
  id,
  type = "text",
  value,
  onChange,
}: {
  id?: string
  type?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition"
    />
  )
}

function NumberInputWithSuffix({
  id,
  value,
  onChange,
  suffix,
}: {
  id?: string
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition text-center font-semibold"
      />
      {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
    </div>
  )
}

function SelectInput({
  id,
  options,
  value,
  onChange,
}: {
  id?: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function Divider() {
  return <div className="border-t border-gray-100 my-6" />
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg mb-5">
      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-700">{children}</p>
    </div>
  )
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
      {saved && (
        <span className="flex items-center gap-1 text-sm font-medium text-[#22C55E]">
          <CheckCircle className="w-4 h-4" /> Saved!
        </span>
      )}
      <button onClick={onClick} disabled={saving}
        className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  )
}

function FormRow({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start mb-4 last:mb-0">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — General
═══════════════════════════════════════════════════════════════ */
function TabGeneral({ s, set, onSave, saving, saved }: {
  s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Platform Information</SectionTitle>
      <FormRow label="Platform Name" htmlFor="g-name">
        <TextInput id="g-name" value={s.platformName} onChange={(v) => set("platformName", v)} />
      </FormRow>
      <FormRow label="Support Email" htmlFor="g-email">
        <TextInput id="g-email" type="email" value={s.supportEmail} onChange={(v) => set("supportEmail", v)} />
      </FormRow>
      <FormRow label="Support Phone" htmlFor="g-phone">
        <TextInput id="g-phone" type="tel" value={s.supportPhone} onChange={(v) => set("supportPhone", v)} />
      </FormRow>
      <FormRow label="Timezone" htmlFor="g-tz">
        <SelectInput
          id="g-tz"
          value={s.defaultTimezone}
          onChange={(v) => set("defaultTimezone", v)}
          options={["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Asia/Kolkata"]}
        />
      </FormRow>
      <FormRow label="Currency" htmlFor="g-cur">
        <SelectInput
          id="g-cur"
          value={s.currency}
          onChange={(v) => set("currency", v)}
          options={["USD", "INR"]}
        />
      </FormRow>
      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — Cancellation Policy
═══════════════════════════════════════════════════════════════ */
function TabCancellation({ s, set, onSave, saving, saved }: {
  s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  const [allowReschedule, setAllowReschedule] = useState(true)
  const [noShowDeduct, setNoShowDeduct] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Student Cancellation Policy</SectionTitle>
      <InfoBanner>
        These settings control what happens when a student cancels or reschedules a class.
      </InfoBanner>

      <FormRow label="Free Cancellation Window" htmlFor="c-fcw">
        <NumberInputWithSuffix id="c-fcw" value={s.cancelFreeWindowHours} onChange={(v) => set("cancelFreeWindowHours", v)} suffix="hours before class" />
      </FormRow>
      <FormRow label="Late Cancellation Penalty" htmlFor="c-lcp">
        <NumberInputWithSuffix id="c-lcp" value={s.cancelLateFeePercent} onChange={(v) => set("cancelLateFeePercent", v)} suffix="% of class value deducted from balance" />
      </FormRow>
      <FormRow label="No-Show Penalty (Student)" htmlFor="c-nsp">
        <NumberInputWithSuffix id="c-nsp" value={s.noShowPenalty} onChange={(v) => set("noShowPenalty", v)} suffix="% of class value deducted from balance" />
      </FormRow>

      <div className="border border-gray-100 rounded-lg px-4 mb-4">
        <Toggle
          checked={allowReschedule}
          onChange={setAllowReschedule}
          label="Allow Rescheduling"
          description="Students can reschedule within the free window"
        />
      </div>

      <FormRow label="Reschedule Limit" htmlFor="c-rl">
        <NumberInputWithSuffix id="c-rl" value={s.maxReschedulesPerClass} onChange={(v) => set("maxReschedulesPerClass", v)} suffix="times per class" />
      </FormRow>
      <FormRow label="Min. Reschedule Notice" htmlFor="c-mrn">
        <NumberInputWithSuffix id="c-mrn" value={s.rescheduleWindowHours} onChange={(v) => set("rescheduleWindowHours", v)} suffix="hours before class" />
      </FormRow>

      <Divider />

      <SectionTitle>Teacher Cancellation Policy</SectionTitle>
      <FormRow label="Max Cancellations/Month" htmlFor="c-tcm">
        <NumberInputWithSuffix id="c-tcm" value={s.teacherMaxCancellations} onChange={(v) => set("teacherMaxCancellations", v)} />
      </FormRow>
      <FormRow label="No-Show Rating Penalty" htmlFor="c-trp">
        <NumberInputWithSuffix id="c-trp" value={s.teacherNoShowRatingHit} onChange={(v) => set("teacherNoShowRatingHit", v)} suffix="stars deducted per no-show" />
      </FormRow>

      <div className="border border-gray-100 rounded-lg px-4 mb-4">
        <Toggle
          checked={noShowDeduct}
          onChange={setNoShowDeduct}
          label="Teacher No-Show Payout Deduction"
          description="Deduct class amount from teacher payout for no-shows"
        />
      </div>

      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — Packages & Pricing
═══════════════════════════════════════════════════════════════ */
function TabPackages({ s, set, onSave, saving, saved }: {
  s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Default Package Templates</SectionTitle>
      <InfoBanner>
        These are default templates. Actual packages are created per-teacher in the Packages section.
      </InfoBanner>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Starter */}
        <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="px-5 py-3 bg-[#0D9488]">
            <span className="text-white font-semibold text-sm">Starter</span>
          </div>
          <div className="px-5 py-4 bg-white space-y-1.5">
            <p className="text-2xl font-bold text-[#1E293B]">4 <span className="text-sm font-normal text-gray-500">Classes</span></p>
            <p className="text-xs text-gray-400">30 days validity</p>
            <p className="text-xs font-medium text-[#0D9488]">Best for trials</p>
          </div>
        </div>

        {/* Standard */}
        <div className="rounded-xl overflow-hidden border border-[#1E3A5F]/30 shadow-md">
          <div className="px-5 py-3 bg-[#1E3A5F] flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Standard</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold">Popular</span>
          </div>
          <div className="px-5 py-4 bg-white space-y-1.5">
            <p className="text-2xl font-bold text-[#1E293B]">6 <span className="text-sm font-normal text-gray-500">Classes</span></p>
            <p className="text-xs text-gray-400">45 days validity</p>
            <p className="text-xs font-medium text-[#1E3A5F]">Most popular</p>
          </div>
        </div>

        {/* Premium */}
        <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="px-5 py-3 bg-[#F59E0B]">
            <span className="text-[#1E293B] font-semibold text-sm">Premium</span>
          </div>
          <div className="px-5 py-4 bg-white space-y-1.5">
            <p className="text-2xl font-bold text-[#1E293B]">8 <span className="text-sm font-normal text-gray-500">Classes</span></p>
            <p className="text-xs text-gray-400">60 days validity</p>
            <p className="text-xs font-medium text-[#F59E0B]">Best value</p>
          </div>
        </div>
      </div>

      <Divider />

      <div className="border border-gray-100 rounded-lg px-4 mb-4">
        <Toggle
          checked={s.trialClassEnabled}
          onChange={(v) => set("trialClassEnabled", v)}
          label="Trial Class Policy"
          description="1 free trial per subject per student"
        />
      </div>

      <FormRow label="Low Balance Alert" htmlFor="p-lba">
        <NumberInputWithSuffix id="p-lba" value={s.lowBalanceThreshold} onChange={(v) => set("lowBalanceThreshold", v)} suffix="classes remaining triggers alert" />
      </FormRow>

      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4 — Notifications
═══════════════════════════════════════════════════════════════ */
const NOTIF_ITEMS = [
  { key: "classReminder",    label: "Class Reminder",               desc: "Send reminder 1 hour before class" },
  { key: "paymentConfirm",   label: "Payment Confirmation",         desc: "Notify parent when payment is confirmed" },
  { key: "lowBalance",       label: "Low Balance Alert",            desc: "Notify parent when class balance is low" },
  { key: "payoutNotif",      label: "Teacher Payout Notification",  desc: "Notify teacher when payout is processed" },
  { key: "newStudent",       label: "New Student Assignment",       desc: "Notify coordinator when new student is assigned" },
  { key: "cancellation",     label: "Class Cancellation Alert",     desc: "Notify all parties when a class is cancelled" },
  { key: "trialComplete",    label: "Trial Completion",             desc: "Notify coordinator when trial class is completed" },
  { key: "noShowAlert",      label: "No-Show Alert",                desc: "Notify admin when a teacher no-show occurs" },
]

function TabNotifications({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_ITEMS.map((n) => [n.key, true]))
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Notification Preferences</SectionTitle>

      <InfoBanner>
        Notification preferences are stored locally for now. A future update will persist these to the database.
      </InfoBanner>

      <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 mb-6">
        {NOTIF_ITEMS.map((item) => (
          <div key={item.key} className="px-4">
            <Toggle
              checked={toggles[item.key]}
              onChange={(v) => setToggles((prev) => ({ ...prev, [item.key]: v }))}
              label={item.label}
              description={item.desc}
            />
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>Email Provider</SectionTitle>
      <FormRow label="Email Provider" htmlFor="n-ep">
        <SelectInput
          id="n-ep"
          value="SendGrid"
          onChange={() => {}}
          options={["SendGrid", "AWS SES", "SMTP"]}
        />
      </FormRow>
      <FormRow label="Sender Email" htmlFor="n-se">
        <TextInput id="n-se" type="email" value="notifications@expertguru.net" onChange={() => {}} />
      </FormRow>

      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5 — User Management
═══════════════════════════════════════════════════════════════ */
function TabUserManagement({ s, set, onSave, saving, saved }: {
  s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  const [requireSpecial, setRequireSpecial] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Password &amp; Access Settings</SectionTitle>

      <FormRow label="Min. Password Length" htmlFor="u-mpl">
        <NumberInputWithSuffix id="u-mpl" value={s.minPasswordLength} onChange={(v) => set("minPasswordLength", v)} />
      </FormRow>

      <div className="border border-gray-100 rounded-lg px-4 mb-4">
        <Toggle
          checked={requireSpecial}
          onChange={setRequireSpecial}
          label="Require Special Characters"
          description="Password must contain at least one special character"
        />
      </div>

      <FormRow label="Reset Link Expiry" htmlFor="u-rle">
        <NumberInputWithSuffix id="u-rle" value={s.passwordResetExpiry} onChange={(v) => set("passwordResetExpiry", v)} suffix="hours" />
      </FormRow>
      <FormRow label="Max Login Attempts" htmlFor="u-mla">
        <NumberInputWithSuffix id="u-mla" value={s.maxLoginAttempts} onChange={(v) => set("maxLoginAttempts", v)} suffix="before account lock" />
      </FormRow>
      <FormRow label="Account Lock Duration" htmlFor="u-ald">
        <NumberInputWithSuffix id="u-ald" value={s.lockoutDuration} onChange={(v) => set("lockoutDuration", v)} suffix="minutes" />
      </FormRow>

      <Divider />

      <SectionTitle>Admin Actions</SectionTitle>
      <div className="flex flex-col gap-3">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#0D9488] text-[#0D9488] text-sm font-medium hover:bg-teal-50 transition-colors">
          <KeyRound className="w-4 h-4 flex-shrink-0" />
          Send Password Reset Link to User
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-red-50 transition-colors">
          <UserX className="w-4 h-4 flex-shrink-0" />
          Deactivate User Account
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#F59E0B] text-[#F59E0B] text-sm font-medium hover:bg-amber-50 transition-colors">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          Force Password Reset for All Users
        </button>
      </div>

      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB DEFINITIONS
═══════════════════════════════════════════════════════════════ */
type TabKey = "general" | "cancellation" | "packages" | "notifications" | "users"

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "general",       label: "General",              icon: Settings    },
  { key: "cancellation",  label: "Cancellation Policy",  icon: ShieldCheck },
  { key: "packages",      label: "Packages & Pricing",   icon: Package     },
  { key: "notifications", label: "Notifications",        icon: Bell        },
  { key: "users",         label: "User Management",      icon: Users       },
]

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("general")
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings(data.settings)
        } else {
          setError("Failed to load settings")
        }
      } catch {
        setError("Network error loading settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const set = (key: keyof PlatformSettings, value: unknown) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setSaved(false)
    setError("")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab: activeTab, ...settings }),
      })
      const data = await res.json()
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || "Save failed")
      }
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <span className="ml-3 text-gray-500 text-sm">Loading settings…</span>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-500 text-sm">{error || "Could not load settings"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure platform-wide policies and preferences
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSaved(false); setError("") }}
                className={`inline-flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-[#0D9488] text-[#0D9488] bg-teal-50/50"
                    : "border-transparent text-gray-500 hover:text-[#1E293B] hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "general"       && <TabGeneral s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
      {activeTab === "cancellation"  && <TabCancellation s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
      {activeTab === "packages"      && <TabPackages s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
      {activeTab === "notifications" && <TabNotifications onSave={handleSave} saving={saving} saved={saved} />}
      {activeTab === "users"         && <TabUserManagement s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
    </div>
  )
}
