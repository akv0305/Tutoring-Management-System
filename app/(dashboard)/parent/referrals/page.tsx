"use client"

import React, { useState } from "react"
import {
  Gift,
  Copy,
  Check,
  Mail,
  Twitter,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { DataTable } from "@/components/tables/DataTable"

/* ─── Types ─── */
type ReferralRow = {
  id: string
  friendName: string
  email: string
  dateInvited: string
  status: string
  reward: string
  [key: string]: unknown
}

/* ─── Data ─── */
const REFERRALS: ReferralRow[] = [
  { id: "1", friendName: "Sarah Johnson", email: "sarah.j@email.com", dateInvited: "Mar 1, 2026", status: "converted", reward: "$25" },
  { id: "2", friendName: "Mike Chen", email: "mike.chen@email.com", dateInvited: "Feb 20, 2026", status: "trial_booked", reward: "Pending" },
  { id: "3", friendName: "Priya Patel", email: "priya.p@email.com", dateInvited: "Feb 10, 2026", status: "converted", reward: "$25" },
  { id: "4", friendName: "Tom Williams", email: "tom.w@email.com", dateInvited: "Jan 25, 2026", status: "pending", reward: "—" },
  { id: "5", friendName: "Lisa Martinez", email: "lisa.m@email.com", dateInvited: "Jan 15, 2026", status: "converted", reward: "$25" },
]

const STEPS = [
  {
    num: 1,
    title: "Share Your Link",
    desc: "Copy your unique referral link and share it with friends",
    icon: Gift,
  },
  {
    num: 2,
    title: "Friend Signs Up & Books Trial",
    desc: "Your friend creates an account and books a trial class",
    icon: Users,
  },
  {
    num: 3,
    title: "Earn $25 Reward",
    desc: "Once they complete their first paid session, you earn $25",
    icon: DollarSign,
  },
]

const REFERRAL_LINK = "https://expertguru.net/ref/jane-smith-42"

/* ─── Custom status badge for referral statuses ─── */
function ReferralStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    converted: { label: "Converted", cls: "bg-green-100 text-green-700 border-green-200" },
    trial_booked: { label: "Trial Booked", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  }
  const cfg = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(REFERRAL_LINK).catch(() => null)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const columns = [
    {
      key: "friendName",
      label: "Friend's Name",
      render: (row: ReferralRow) => (
        <span className="text-sm font-medium text-[#1E293B]">{row.friendName}</span>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row: ReferralRow) => (
        <span className="text-sm text-gray-500">{row.email}</span>
      ),
    },
    {
      key: "dateInvited",
      label: "Date Invited",
      render: (row: ReferralRow) => (
        <span className="text-sm text-gray-500">{row.dateInvited}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: ReferralRow) => <ReferralStatus status={row.status} />,
    },
    {
      key: "reward",
      label: "Reward Earned",
      render: (row: ReferralRow) => (
        <span
          className={`text-sm font-semibold ${row.reward === "—" ? "text-gray-300" : row.reward === "Pending" ? "text-[#F59E0B]" : "text-[#22C55E]"}`}
        >
          {row.reward}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Refer &amp; Earn</h1>
        <p className="text-sm text-gray-500 mt-1">Invite friends and earn rewards for every successful referral</p>
      </div>

      {/* Top Section: Link + Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Referral Link */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#0D9488]" />
            </div>
            <h2 className="text-base font-semibold text-[#1E293B]">Your Referral Link</h2>
          </div>

          {/* Link input */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-sm text-gray-500 truncate flex-1 select-all">{REFERRAL_LINK}</span>
            </div>
            <button
              onClick={handleCopy}
              className={[
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0",
                copied
                  ? "bg-[#22C55E] text-white"
                  : "bg-[#0D9488] text-white hover:bg-[#0D9488]/90",
              ].join(" ")}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>

          {/* Share via */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Share via:</p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                <Mail className="w-4 h-4 text-gray-500" />
                Email
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-xs font-medium text-green-700 transition-colors">
                <svg className="w-4 h-4 fill-green-600" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 rounded-lg text-xs font-medium text-sky-700 transition-colors">
                <Twitter className="w-4 h-4 text-sky-500" />
                Twitter / X
              </button>
            </div>
          </div>
        </div>

        {/* Rewards balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h2 className="text-base font-semibold text-[#1E293B]">Your Rewards</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Balance", val: "$50", color: "text-[#0D9488]" },
              { label: "Lifetime Earned", val: "$125", color: "text-[#1E3A5F]" },
              { label: "Successful", val: "5", color: "text-[#22C55E]" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F59E0B] text-white rounded-xl text-sm font-medium hover:bg-[#F59E0B]/90 transition-colors">
            <DollarSign className="w-4 h-4" />
            Redeem Rewards
          </button>
        </div>
      </div>

      {/* KPI Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Invitations", val: "8", icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Successful Referrals", val: "5", icon: CheckCircle, bg: "bg-green-50", color: "text-[#22C55E]" },
          { label: "Pending Referrals", val: "3", icon: Clock, bg: "bg-amber-50", color: "text-[#F59E0B]" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <s.icon className={`w-6 h-6 ${s.color}`} />
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">How It Works</h2>
        <div className="flex items-start gap-4 flex-wrap">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
                <div className="w-12 h-12 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center mb-3 text-lg font-bold">
                  {step.num}
                </div>
                <step.icon className="w-6 h-6 text-[#0D9488] mb-2" />
                <p className="text-sm font-semibold text-[#1E293B]">{step.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex items-center mt-6 text-gray-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Referral Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E293B]">Referral History</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track all your referrals and rewards</p>
        </div>
        <DataTable<ReferralRow>
          columns={columns}
          data={REFERRALS}
          searchable={true}
          searchPlaceholder="Search referrals..."
          pageSize={10}
        />
      </div>
    </div>
  )
}
