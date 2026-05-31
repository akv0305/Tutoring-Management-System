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
  Wallet,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

/* ─── Types ─── */
type ReferralHistoryItem = {
  id: string
  friendName: string
  friendEmail: string
  status: string
  rewardAmount: number | null
  invitedAt: string
  convertedAt: string | null
}

type WalletTransaction = {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

type Props = {
  parentName: string
  referralEnabled: boolean
  referralCode: string
  referralLink: string
  rewardAmount: number
  stats: {
    totalInvited: number
    successfulReferrals: number
    pendingReferrals: number
  }
  wallet: {
    balance: number
    lifetimeEarned: number
    transactions: WalletTransaction[]
  }
  referralHistory: ReferralHistoryItem[]
}

/* ─── Referral status badge ─── */
function ReferralStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SUCCESSFUL: {
      label: "Converted",
      cls: "bg-green-100 text-green-700 border-green-200",
    },
    PENDING: {
      label: "Pending",
      cls: "bg-amber-100 text-amber-700 border-amber-200",
    },
    EXPIRED: {
      label: "Expired",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
    },
  }
  const cfg = map[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  )
}

/* ─── Transaction type label ─── */
function txTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    REFERRAL_REWARD: "Referral Reward",
    BOOKING_DISCOUNT: "Booking Discount",
    ADMIN_ADJUSTMENT: "Admin Adjustment",
  }
  return labels[type] || type
}

/* ─── Format date ─── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/* ─── Main Component ─── */
export default function ParentReferralsClient({
  parentName,
  referralEnabled,
  referralCode,
  referralLink,
  rewardAmount,
  stats,
  wallet,
  referralHistory,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"referrals" | "wallet">("referrals")

  function handleCopy() {
    if (typeof navigator !== "undefined" && referralLink) {
      navigator.clipboard.writeText(referralLink).catch(() => null)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleShareEmail() {
    const subject = encodeURIComponent("Join Expert Guru — Great tutoring for your kids!")
    const body = encodeURIComponent(
      `Hi!\n\nI've been using Expert Guru for my child's tutoring and it's been great. Sign up using my referral link and we both benefit!\n\n${referralLink}\n\nBest,\n${parentName}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `Hey! I've been using Expert Guru for tutoring and love it. Sign up with my link: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(
      `I recommend @ExpertGuru for online tutoring! Sign up with my referral link: ${referralLink}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  // ── Program disabled state ──
  if (!referralEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Refer & Earn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Invite friends and earn rewards for every successful referral
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-[#1E293B] mb-2">
            Referral Program Paused
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            The referral program is currently not available. Please check back
            later or contact your coordinator for more information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Refer & Earn</h1>
        <p className="text-sm text-gray-500 mt-1">
          Invite friends and earn ${rewardAmount} for every successful referral
        </p>
      </div>

      {/* Top Section: Link + Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Referral Link */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#0D9488]" />
            </div>
            <h2 className="text-base font-semibold text-[#1E293B]">
              Your Referral Link
            </h2>
          </div>

          {/* Link input */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-sm text-gray-500 truncate flex-1 select-all">
                {referralLink}
              </span>
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

          {/* Referral code display */}
          <div className="flex items-center gap-2 mb-4 p-2.5 bg-[#0D9488]/5 border border-[#0D9488]/15 rounded-lg">
            <span className="text-xs text-gray-500">Your code:</span>
            <span className="text-sm font-bold text-[#0D9488] tracking-wider">
              {referralCode}
            </span>
          </div>

          {/* Share via */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Share via:</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareEmail}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-500" />
                Email
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-xs font-medium text-green-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 fill-green-600"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 rounded-lg text-xs font-medium text-sky-700 transition-colors"
              >
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
            <h2 className="text-base font-semibold text-[#1E293B]">
              Your Rewards
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              {
                label: "Wallet Balance",
                val: `$${wallet.balance.toFixed(2)}`,
                color: "text-[#0D9488]",
              },
              {
                label: "Lifetime Earned",
                val: `$${wallet.lifetimeEarned.toFixed(2)}`,
                color: "text-[#1E293B]",
              },
              {
                label: "Successful",
                val: String(stats.successfulReferrals),
                color: "text-[#22C55E]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 rounded-xl border border-gray-100 p-3 text-center"
              >
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">
                  {item.label}
                </p>
                <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
              </div>
            ))}
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total Invitations",
                val: stats.totalInvited,
                icon: Users,
                iconColor: "text-[#0D9488]",
                bgColor: "bg-[#0D9488]/10",
              },
              {
                label: "Successful Referrals",
                val: stats.successfulReferrals,
                icon: CheckCircle,
                iconColor: "text-[#22C55E]",
                bgColor: "bg-[#22C55E]/10",
              },
              {
                label: "Pending Referrals",
                val: stats.pendingReferrals,
                icon: Clock,
                iconColor: "text-[#F59E0B]",
                bgColor: "bg-[#F59E0B]/10",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1E293B]">{item.val}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              num: 1,
              title: "Share Your Link",
              desc: "Copy your unique referral link and share it with friends",
              icon: Gift,
            },
            {
              num: 2,
              title: "Friend Signs Up & Books",
              desc: "Your friend creates an account and books their first paid class",
              icon: Users,
            },
            {
              num: 3,
              title: `Earn $${rewardAmount} Reward`,
              desc: `Once they book a paid class, you earn $${rewardAmount} in your wallet`,
              icon: DollarSign,
            },
          ].map((step, idx) => (
            <div key={step.num} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-5 h-5 text-[#0D9488]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-[#0D9488]">
                    Step {step.num}
                  </span>
                  {idx < 2 && (
                    <ArrowRight className="w-3 h-3 text-gray-300 hidden md:block" />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation: Referral History / Wallet Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("referrals")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "referrals"
                ? "text-[#0D9488] border-b-2 border-[#0D9488] bg-[#0D9488]/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Referral History
            {referralHistory.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold">
                {referralHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "wallet"
                ? "text-[#0D9488] border-b-2 border-[#0D9488] bg-[#0D9488]/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Wallet Transactions
            {wallet.transactions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold">
                {wallet.transactions.length}
              </span>
            )}
          </button>
        </div>

        {/* Referral History Tab */}
        {activeTab === "referrals" && (
          <div className="p-5">
            {referralHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-[#1E293B] mb-1">
                  No referrals yet
                </p>
                <p className="text-xs text-gray-500">
                  Share your link to start earning rewards!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">
                        Friend
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">
                        Email
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">
                        Date Invited
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">
                        Status
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">
                        Reward
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralHistory.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-[#1E293B]">
                            {r.friendName}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-gray-500">
                            {r.friendEmail}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(r.invitedAt)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <ReferralStatusBadge status={r.status} />
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`text-sm font-semibold ${
                              r.status === "SUCCESSFUL"
                                ? "text-[#22C55E]"
                                : r.status === "PENDING"
                                ? "text-[#F59E0B]"
                                : "text-gray-300"
                            }`}
                          >
                            {r.status === "SUCCESSFUL" && r.rewardAmount
                              ? `$${r.rewardAmount.toFixed(2)}`
                              : r.status === "PENDING"
                              ? "Pending"
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Wallet Transactions Tab */}
        {activeTab === "wallet" && (
          <div className="p-5">
            {wallet.transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-[#1E293B] mb-1">
                  No transactions yet
                </p>
                <p className="text-xs text-gray-500">
                  Wallet transactions will appear here when you earn or use
                  rewards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallet.transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          t.amount > 0
                            ? "bg-[#22C55E]/10"
                            : "bg-[#EF4444]/10"
                        }`}
                      >
                        {t.amount > 0 ? (
                          <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-[#EF4444]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">
                          {txTypeLabel(t.type)}
                        </p>
                        <p className="text-xs text-gray-500">{t.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          t.amount > 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                        }`}
                      >
                        {t.amount > 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(t.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
