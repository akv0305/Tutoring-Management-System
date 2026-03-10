"use client"

import React, { useState } from "react"
import {
  Settings,
  Bell,
  Package,
  Users,
  ShieldCheck,
  KeyRound,
  UserX,
  Info,
} from "lucide-react"

/* ══════════════════════════════════════════════════════════════════
   INLINE TOGGLE (no @radix-ui/react-switch installed)
══════════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════════ */
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
  defaultValue,
}: {
  id?: string
  type?: string
  defaultValue?: string
}) {
  return (
    <input
      id={id}
      type={type}
      defaultValue={defaultValue}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition"
    />
  )
}

function NumberInputWithSuffix({
  id,
  defaultValue,
  suffix,
}: {
  id?: string
  defaultValue?: string
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="number"
        defaultValue={defaultValue}
        className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition text-center font-semibold"
      />
      {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
    </div>
  )
}

function SelectInput({
  id,
  options,
  defaultValue,
}: {
  id?: string
  options: string[]
  defaultValue?: string
}) {
  return (
    <select
      id={id}
      defaultValue={defaultValue}
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

function SaveButton() {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
      <button className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
        Save Changes
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

/* ══════════════════════════════════════════════════════════════════
   TAB 1 — General
══════════════════════════════════════════════════════════════════ */
function TabGeneral() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Platform Information</SectionTitle>
      <FormRow label="Platform Name"  htmlFor="g-name">
        <TextInput id="g-name" defaultValue="Expert Guru" />
      </FormRow>
      <FormRow label="Support Email" htmlFor="g-email">
        <TextInput id="g-email" type="email" defaultValue="support@expertguru.net" />
      </FormRow>
      <FormRow label="Support Phone" htmlFor="g-phone">
        <TextInput id="g-phone" type="tel" defaultValue="+1 (800) 555-0199" />
      </FormRow>
      <FormRow label="Timezone" htmlFor="g-tz">
        <SelectInput
          id="g-tz"
          defaultValue="EST (Eastern)"
          options={["EST (Eastern)", "CST (Central)", "MST (Mountain)", "PST (Pacific)", "IST (India Standard)"]}
        />
      </FormRow>
      <FormRow label="Currency" htmlFor="g-cur">
        <SelectInput
          id="g-cur"
          defaultValue="USD ($)"
          options={["USD ($)", "INR (₹)"]}
        />
      </FormRow>
      <SaveButton />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   TAB 2 — Cancellation Policy
══════════════════════════════════════════════════════════════════ */
function TabCancellation() {
  const [allowReschedule, setAllowReschedule] = useState(true)
  const [noShowDeduct, setNoShowDeduct] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Student Cancellation Policy</SectionTitle>
      <InfoBanner>
        These settings control what happens when a student cancels or reschedules a class.
      </InfoBanner>

      <FormRow label="Free Cancellation Window" htmlFor="c-fcw">
        <NumberInputWithSuffix id="c-fcw" defaultValue="24" suffix="hours before class" />
      </FormRow>
      <FormRow label="Late Cancellation Penalty" htmlFor="c-lcp">
        <NumberInputWithSuffix id="c-lcp" defaultValue="50" suffix="% of class value deducted from balance" />
      </FormRow>
      <FormRow label="No-Show Penalty (Student)" htmlFor="c-nsp">
        <NumberInputWithSuffix id="c-nsp" defaultValue="100" suffix="% of class value deducted from balance" />
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
        <NumberInputWithSuffix id="c-rl" defaultValue="2" suffix="times per class" />
      </FormRow>
      <FormRow label="Min. Reschedule Notice" htmlFor="c-mrn">
        <NumberInputWithSuffix id="c-mrn" defaultValue="12" suffix="hours before class" />
      </FormRow>

      <Divider />

      <SectionTitle>Teacher Cancellation Policy</SectionTitle>
      <FormRow label="Max Cancellations/Month" htmlFor="c-tcm">
        <NumberInputWithSuffix id="c-tcm" defaultValue="3" />
      </FormRow>
      <FormRow label="No-Show Rating Penalty" htmlFor="c-trp">
        <NumberInputWithSuffix id="c-trp" defaultValue="0.5" suffix="stars deducted per no-show" />
      </FormRow>

      <div className="border border-gray-100 rounded-lg px-4 mb-4">
        <Toggle
          checked={noShowDeduct}
          onChange={setNoShowDeduct}
          label="Teacher No-Show Payout Deduction"
          description="Deduct class amount from teacher payout for no-shows"
        />
      </div>

      <SaveButton />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   TAB 3 — Packages & Pricing
══════════════════════════════════════════════════════════════════ */
function TabPackages() {
  const [trialPolicy, setTrialPolicy] = useState(true)

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
          checked={trialPolicy}
          onChange={setTrialPolicy}
          label="Trial Class Policy"
          description="1 free trial per subject per student"
        />
      </div>

      <FormRow label="Low Balance Alert" htmlFor="p-lba">
        <NumberInputWithSuffix id="p-lba" defaultValue="2" suffix="classes remaining triggers alert" />
      </FormRow>

      <SaveButton />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   TAB 4 — Notifications
══════════════════════════════════════════════════════════════════ */
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

function TabNotifications() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_ITEMS.map((n) => [n.key, true]))
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Notification Preferences</SectionTitle>

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
          defaultValue="SendGrid"
          options={["SendGrid", "AWS SES", "SMTP"]}
        />
      </FormRow>
      <FormRow label="Sender Email" htmlFor="n-se">
        <TextInput id="n-se" type="email" defaultValue="notifications@expertguru.net" />
      </FormRow>

      <SaveButton />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   TAB 5 — User Management
══════════════════════════════════════════════════════════════════ */
function TabUserManagement() {
  const [requireSpecial, setRequireSpecial] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <SectionTitle>Password &amp; Access Settings</SectionTitle>

      <FormRow label="Min. Password Length" htmlFor="u-mpl">
        <NumberInputWithSuffix id="u-mpl" defaultValue="8" />
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
        <NumberInputWithSuffix id="u-rle" defaultValue="24" suffix="hours" />
      </FormRow>
      <FormRow label="Max Login Attempts" htmlFor="u-mla">
        <NumberInputWithSuffix id="u-mla" defaultValue="5" suffix="before account lock" />
      </FormRow>
      <FormRow label="Account Lock Duration" htmlFor="u-ald">
        <NumberInputWithSuffix id="u-ald" defaultValue="30" suffix="minutes" />
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

      <SaveButton />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   TAB DEFINITIONS
══════════════════════════════════════════════════════════════════ */
type TabKey = "general" | "cancellation" | "packages" | "notifications" | "users"

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "general",       label: "General",              icon: Settings   },
  { key: "cancellation",  label: "Cancellation Policy",  icon: ShieldCheck },
  { key: "packages",      label: "Packages & Pricing",   icon: Package    },
  { key: "notifications", label: "Notifications",        icon: Bell       },
  { key: "users",         label: "User Management",      icon: Users      },
]

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("general")

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure platform-wide policies and preferences
        </p>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
      {activeTab === "general"       && <TabGeneral />}
      {activeTab === "cancellation"  && <TabCancellation />}
      {activeTab === "packages"      && <TabPackages />}
      {activeTab === "notifications" && <TabNotifications />}
      {activeTab === "users"         && <TabUserManagement />}
    </div>
  )
}
