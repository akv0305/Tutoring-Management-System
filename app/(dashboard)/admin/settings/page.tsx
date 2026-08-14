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
  Gift, Sparkles, CreditCard,
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
  referralEnabled: boolean
  referralRewardAmount: number
  welcomeOfferEnabled: boolean
  welcomeOfferAmount: number
  paymentGatewayCcavenue: boolean
  paymentGatewayPaypal: boolean
  defaultPaymentGateway: string
  walletTopupMinAmount: number
  walletTopupPresets: string
  emailCcAddress: string
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
  prefix,
  min,
  step,
}: {
  id?: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  prefix?: string
  min?: number
  step?: string
}) {
  return (
    <div className="flex items-center gap-3">
      {prefix && <span className="text-sm font-semibold text-gray-600">{prefix}</span>}
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        step={step}
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
      <FormRow label="CC Email (All Outgoing)" htmlFor="g-cc">
        <TextInput
          id="g-cc"
          type="email"
          value={s.emailCcAddress}
          onChange={(v) => set("emailCcAddress", v)}
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
   TAB 6 — Referral Program
═══════════════════════════════════════════════════════════════ */
function TabReferral({ s, set, onSave, saving, saved }: {
  s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Referral Program Settings</SectionTitle>

      <InfoBanner>
        When enabled, parents can share a unique referral link. When a referred parent registers and books their first paid class, the referrer receives the reward amount as a wallet credit. The wallet balance is automatically applied as a discount on future bookings.
      </InfoBanner>

      <div className="border border-gray-100 rounded-lg px-4 mb-6">
        <Toggle
          checked={s.referralEnabled}
          onChange={(v) => set("referralEnabled", v)}
          label="Enable Referral Program"
          description="Allow parents to refer friends and earn wallet credits"
        />
      </div>

      <div className={s.referralEnabled ? "" : "opacity-50 pointer-events-none"}>
        <FormRow label="Reward Amount per Referral" htmlFor="r-amount">
          <NumberInputWithSuffix
            id="r-amount"
            value={s.referralRewardAmount}
            onChange={(v) => set("referralRewardAmount", v)}
            prefix="$"
            suffix="credited to referrer's wallet"
            min={0}
            step="0.01"
          />
        </FormRow>

        <Divider />

        <SectionTitle>How It Works</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: 1,
              title: "Parent Shares Link",
              desc: "Each parent gets a unique referral link from their dashboard. They share it with friends.",
              color: "bg-[#0D9488]",
            },
            {
              step: 2,
              title: "Friend Registers & Books",
              desc: "The friend clicks the link, registers an account, and books their first paid class.",
              color: "bg-[#1E3A5F]",
            },
            {
              step: 3,
              title: "Referrer Gets Rewarded",
              desc: `$${s.referralRewardAmount} is automatically credited to the referrer's wallet and applied on their next booking.`,
              color: "bg-[#F59E0B]",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-gray-100 p-4 text-center">
              <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center mx-auto mb-3 text-lg font-bold`}>
                {item.step}
              </div>
              <p className="text-sm font-semibold text-[#1E293B] mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <SaveButton onClick={onSave} saving={saving} saved={saved} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 7 — Welcome Offer
═══════════════════════════════════════════════════════════════ */
type WelcomeOfferParent = {
  id: string
  parentName: string
  email: string
  amount: number
  creditedAt: string
  registeredAt: string
  hasBooked: boolean
  hasRedeemed: boolean
}

type WelcomeOfferKPIs = {
  totalCredited: number
  totalParents: number
  avgAmount: number
  convertedCount: number
  conversionRate: number
  redeemedCount: number
  thisMonthCredited: number
  thisMonthCount: number
}

function TabWelcomeOffer({ s, set, onSave, saving, saved }: {
  s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
  onSave: () => void; saving: boolean; saved: boolean
}) {
  const [kpis, setKpis] = useState<WelcomeOfferKPIs | null>(null)
  const [parents, setParents] = useState<WelcomeOfferParent[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/welcome-offer")
        if (res.ok) {
          const data = await res.json()
          setKpis(data.kpis)
          setParents(data.parents)
        }
      } catch {
        // silently fail — stats are optional
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <SectionTitle>Welcome Offer Settings</SectionTitle>

        <InfoBanner>
          When enabled, every new parent who registers will automatically receive a wallet credit.
          This credit is applied as a discount on their first booking, encouraging conversion from
          registration to paid class.
        </InfoBanner>

        <div className="border border-gray-100 rounded-lg px-4 mb-6">
          <Toggle
            checked={s.welcomeOfferEnabled}
            onChange={(v) => set("welcomeOfferEnabled", v)}
            label="Enable Welcome Offer"
            description="Automatically credit new parent registrations with a wallet bonus"
          />
        </div>

        <div className={s.welcomeOfferEnabled ? "" : "opacity-50 pointer-events-none"}>
          <FormRow label="Welcome Credit Amount" htmlFor="wo-amount">
            <NumberInputWithSuffix
              id="wo-amount"
              value={s.welcomeOfferAmount}
              onChange={(v) => set("welcomeOfferAmount", v)}
              prefix="$"
              suffix="credited to new parent's wallet"
              min={0}
              step="0.01"
            />
          </FormRow>

          <Divider />

          <SectionTitle>How It Works</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                title: "Parent Registers",
                desc: "A new parent creates an account and verifies their email address.",
                color: "bg-[#0D9488]",
              },
              {
                step: 2,
                title: "Wallet Credited",
                desc: `$${s.welcomeOfferAmount.toFixed(2)} is automatically added to their wallet as a welcome bonus.`,
                color: "bg-[#1E3A5F]",
              },
              {
                step: 3,
                title: "Applied on Booking",
                desc: "The credit is auto-applied as a discount when they book their first paid class.",
                color: "bg-[#F59E0B]",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-100 p-4 text-center">
                <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center mx-auto mb-3 text-lg font-bold`}>
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-[#1E293B] mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <SaveButton onClick={onSave} saving={saving} saved={saved} />
      </div>

      {/* KPI Cards */}
      {loadingStats ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488]" />
          <span className="ml-2 text-sm text-gray-500">Loading usage stats…</span>
        </div>
      ) : kpis ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Credited</p>
              <p className="text-2xl font-bold text-[#0D9488] mt-1">${kpis.totalCredited.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpis.totalParents} parents</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Avg. Per Parent</p>
              <p className="text-2xl font-bold text-[#1E3A5F] mt-1">${kpis.avgAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Average credit amount</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Converted</p>
              <p className="text-2xl font-bold text-[#22C55E] mt-1">{kpis.convertedCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpis.conversionRate}% booked a class</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Redeemed</p>
              <p className="text-2xl font-bold text-[#F59E0B] mt-1">{kpis.redeemedCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Used wallet credit</p>
            </div>
          </div>

          {/* This Month Banner */}
          <div className="flex items-center gap-4 px-5 py-3 bg-teal-50 border border-teal-200 rounded-xl">
            <Sparkles className="w-5 h-5 text-[#0D9488] flex-shrink-0" />
            <p className="text-sm text-[#1E293B]">
              <span className="font-semibold">This month:</span>{" "}
              {kpis.thisMonthCount} new parent{kpis.thisMonthCount !== 1 ? "s" : ""} received a
              total of <span className="font-semibold text-[#0D9488]">${kpis.thisMonthCredited.toFixed(2)}</span> in
              welcome credits.
            </p>
          </div>

          {/* Usage Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide mb-4">
              Welcome Offer Recipients
            </h3>
            {parents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                No welcome offers have been issued yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Parent", "Email", "Credited", "Amount", "Registered", "Booked?", "Redeemed?"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parents.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-[#1E293B] whitespace-nowrap">{p.parentName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.email}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.creditedAt}</td>
                        <td className="px-4 py-3 font-semibold text-[#0D9488]">${p.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.registeredAt}</td>
                        <td className="px-4 py-3">
                          {p.hasBooked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                              <CheckCircle className="w-3 h-3" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                              Not yet
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.hasRedeemed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                              <CheckCircle className="w-3 h-3" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                              Not yet
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 8 — Payment Gateways
   ═══════════════════════════════════════════════════════════ */
   function TabPaymentGateways({ s, set, onSave, saving, saved }: {
    s: PlatformSettings; set: (k: keyof PlatformSettings, v: unknown) => void
    onSave: () => void; saving: boolean; saved: boolean
  }) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <SectionTitle>Payment Gateway Configuration</SectionTitle>
        <InfoBanner>
          Enable or disable payment gateways. At least one gateway must remain active.
          The default gateway is pre-selected when parents initiate a payment.
        </InfoBanner>
  
        {/* CCAvenue Toggle */}
        <div className="border border-gray-100 rounded-lg px-4 mb-4">
          <Toggle
            checked={s.paymentGatewayCcavenue}
            onChange={(v) => {
              // Prevent disabling both gateways
              if (!v && !s.paymentGatewayPaypal) return
              set("paymentGatewayCcavenue", v)
              // If disabling the current default, switch default
              if (!v && s.defaultPaymentGateway === "CCAVENUE") {
                set("defaultPaymentGateway", "PAYPAL")
              }
            }}
            label="CCAvenue"
            description="Credit card, debit card, net banking, UPI via CCAvenue"
          />
        </div>
  
        {/* PayPal Toggle */}
        <div className="border border-gray-100 rounded-lg px-4 mb-4">
          <Toggle
            checked={s.paymentGatewayPaypal}
            onChange={(v) => {
              if (!v && !s.paymentGatewayCcavenue) return
              set("paymentGatewayPaypal", v)
              if (!v && s.defaultPaymentGateway === "PAYPAL") {
                set("defaultPaymentGateway", "CCAVENUE")
              }
            }}
            label="PayPal"
            description="PayPal account, credit card, or debit card via PayPal"
          />
        </div>
  
        <Divider />
  
        {/* Default Gateway */}
        <FormRow label="Default Payment Gateway" htmlFor="gw-default">
          <SelectInput
            id="gw-default"
            options={[
              ...(s.paymentGatewayCcavenue ? ["CCAVENUE"] : []),
              ...(s.paymentGatewayPaypal ? ["PAYPAL"] : []),
            ]}
            value={s.defaultPaymentGateway}
            onChange={(v) => set("defaultPaymentGateway", v)}
          />
        </FormRow>

                {/* Wallet Top-Up Settings */}
                <div className="border-t border-gray-100 mt-6 pt-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Wallet Top-Up Settings</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Configure the minimum amount and preset options shown to parents when they top up their wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Top-Up Amount ($)</label>
              <input
                type="number"
                value={s.walletTopupMinAmount}
                onChange={(e) => set("walletTopupMinAmount", parseFloat(e.target.value) || 0)}
                min={1}
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preset Amounts (JSON array)</label>
              <input
                type="text"
                value={s.walletTopupPresets}
                onChange={(e) => set("walletTopupPresets", e.target.value)}
                placeholder='[25, 50, 100, 200]'
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">JSON array of dollar amounts, e.g. [25, 50, 100, 200]</p>
            </div>
          </div>
        </div>
  
        <SaveButton onClick={onSave} saving={saving} saved={saved} />
      </div>
    )
  }  

/* ═══════════════════════════════════════════════════════════════
   TAB DEFINITIONS
═══════════════════════════════════════════════════════════════ */
type TabKey = "general" | "cancellation" | "packages" | "notifications" | "users" | "referral" | "welcome_offer" | "gateways"

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "general",       label: "General",              icon: Settings    },
  { key: "cancellation",  label: "Cancellation Policy",  icon: ShieldCheck },
  { key: "packages",      label: "Packages & Pricing",   icon: Package     },
  { key: "notifications", label: "Notifications",        icon: Bell        },
  { key: "users",         label: "User Management",      icon: Users       },
  { key: "referral",      label: "Referral Program",     icon: Gift        },
  { key: "welcome_offer", label: "Welcome Offer",        icon: Sparkles    },
  { key: "gateways",      label: "Payment Gateways",     icon: CreditCard  },
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
      {activeTab === "referral"      && <TabReferral s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
      {activeTab === "welcome_offer" && <TabWelcomeOffer s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
      {activeTab === "gateways"      && <TabPaymentGateways s={settings} set={set} onSave={handleSave} saving={saving} saved={saved} />}
    </div>
  )
}
