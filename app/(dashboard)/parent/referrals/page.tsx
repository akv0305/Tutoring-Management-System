import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ParentReferralsClient from "./ParentReferralsClient"

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "PARENT") {
    redirect("/login")
  }

  // ── Fetch parent profile ──
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          referralCode: true,
          referredByCode: true,
        },
      },
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  })

  if (!parentProfile) {
    redirect("/login")
  }

  // ── Check if referral program is enabled ──
  const settings = await prisma.platformSettings.findFirst({
    where: { id: "default" },
    select: {
      referralEnabled: true,
      referralRewardAmount: true,
    },
  })

  const referralEnabled = settings?.referralEnabled ?? false
  const rewardAmount = settings ? Number(settings.referralRewardAmount) : 25

  // ── Generate referral code if missing ──
  let referralCode = parentProfile.user.referralCode
  if (!referralCode && referralEnabled) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = "REF-"
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { referralCode: code },
    })
    if (existing) {
      // Fallback with timestamp
      code = `REF-${Date.now().toString(36).toUpperCase().slice(-8)}`
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
    })
    referralCode = code
  }

  // ── Build referral link ──
  const baseUrl = process.env.NEXTAUTH_URL || "https://expertguru.net"
  const referralLink = referralCode ? `${baseUrl}/register?ref=${referralCode}` : ""

  // ── Fetch referral records ──
  const referrals = await prisma.referral.findMany({
    where: { referredById: session.user.id },
    include: {
      referredTo: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // ── Compute stats ──
  const totalInvited = referrals.length
  const successfulReferrals = referrals.filter((r) => r.status === "SUCCESSFUL").length
  const pendingReferrals = referrals.filter((r) => r.status === "PENDING").length

  // ── Wallet data ──
  const walletBalance = parentProfile.wallet ? Number(parentProfile.wallet.balance) : 0

  const walletTransactions = parentProfile.wallet
    ? parentProfile.wallet.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type as string,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      }))
    : []

  const lifetimeEarned = parentProfile.wallet
    ? parentProfile.wallet.transactions
        .filter((t) => t.type === "REFERRAL_REWARD")
        .reduce((sum, t) => sum + Number(t.amount), 0)
    : 0

  // ── Referral history ──
  const referralHistory = referrals.map((r) => ({
    id: r.id,
    friendName: r.referredTo
      ? `${r.referredTo.firstName} ${r.referredTo.lastName}`
      : "Unknown",
    friendEmail: r.referredTo?.email || "",
    status: r.status as string,
    rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : null,
    invitedAt: r.createdAt.toISOString(),
    convertedAt: r.convertedAt ? r.convertedAt.toISOString() : null,
  }))

  // ── Pass everything to client ──
  return (
    <ParentReferralsClient
      parentName={`${parentProfile.user.firstName} ${parentProfile.user.lastName}`}
      referralEnabled={referralEnabled}
      referralCode={referralCode || ""}
      referralLink={referralLink}
      rewardAmount={rewardAmount}
      stats={{
        totalInvited,
        successfulReferrals,
        pendingReferrals,
      }}
      wallet={{
        balance: walletBalance,
        lifetimeEarned,
        transactions: walletTransactions,
      }}
      referralHistory={referralHistory}
    />
  )
}