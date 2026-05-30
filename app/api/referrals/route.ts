import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// ─── Helper: Generate a unique referral code ────────────
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I/O/0/1 to avoid confusion
  let code = "REF-"
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ─── GET /api/referrals ─────────────────────────────────
// Returns parent's referral code, wallet balance, stats, and referral history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Only parents can access referrals" },
        { status: 403 }
      )
    }

    // Check if referral program is enabled
    const settings = await prisma.platformSettings.findFirst({
      where: { id: "default" },
      select: { referralEnabled: true, referralRewardAmount: true },
    })

    if (!settings?.referralEnabled) {
      return NextResponse.json(
        { error: "Referral program is currently disabled" },
        { status: 403 }
      )
    }

    const rewardAmount = Number(settings.referralRewardAmount)

    // Find parent profile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, referralCode: true } },
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
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    // ── Generate referral code if parent doesn't have one ──
    let referralCode = parentProfile.user.referralCode
    if (!referralCode) {
      // Generate a unique code with retry
      let attempts = 0
      let newCode = ""
      while (attempts < 5) {
        newCode = generateReferralCode()
        const existing = await prisma.user.findFirst({
          where: { referralCode: newCode },
        })
        if (!existing) break
        attempts++
      }
      if (attempts >= 5) {
        // Fallback: append timestamp fragment
        newCode = `REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode: newCode },
      })
      referralCode = newCode
    }

    // ── Build referral link ──
    const baseUrl = process.env.NEXTAUTH_URL || "https://expertguru.net"
    const referralLink = `${baseUrl}/register?ref=${referralCode}`

    // ── Fetch referral records where this parent is the referrer ──
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
    const successfulReferrals = referrals.filter(
      (r) => r.status === "SUCCESSFUL"
    ).length
    const pendingReferrals = referrals.filter(
      (r) => r.status === "PENDING"
    ).length

    // ── Wallet info ──
    const walletBalance = parentProfile.wallet
      ? Number(parentProfile.wallet.balance)
      : 0
    const walletTransactions = parentProfile.wallet
      ? parentProfile.wallet.transactions.map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        }))
      : []

    // ── Lifetime earned from referrals ──
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
      status: r.status,
      rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : null,
      invitedAt: r.createdAt.toISOString(),
      convertedAt: r.convertedAt ? r.convertedAt.toISOString() : null,
    }))

    return NextResponse.json({
      referralCode,
      referralLink,
      rewardAmount,
      stats: {
        totalInvited,
        successfulReferrals,
        pendingReferrals,
      },
      wallet: {
        balance: walletBalance,
        lifetimeEarned,
        transactions: walletTransactions,
      },
      referralHistory,
    })
  } catch (error) {
    console.error("GET /api/referrals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ─── POST /api/referrals ────────────────────────────────
// Two actions:
//   { action: "validate", code: "REF-XXXX" } — public validation (used by register page)
//   { action: "generate" } — force-regenerate referral code (parent only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ── Action: Validate a referral code ──
    if (action === "validate") {
      const { code } = body

      if (!code || typeof code !== "string") {
        return NextResponse.json(
          { error: "Referral code is required" },
          { status: 400 }
        )
      }

      const cleanCode = code.trim().toUpperCase()

      // Check if referral program is enabled
      const settings = await prisma.platformSettings.findFirst({
        where: { id: "default" },
        select: { referralEnabled: true },
      })

      if (!settings?.referralEnabled) {
        return NextResponse.json(
          { valid: false, error: "Referral program is currently disabled" },
          { status: 200 }
        )
      }

      // Find the user with this referral code
      const referrer = await prisma.user.findFirst({
        where: {
          referralCode: cleanCode,
          role: "PARENT",
          status: "ACTIVE",
        },
        select: {
          firstName: true,
          lastName: true,
        },
      })

      if (!referrer) {
        return NextResponse.json(
          { valid: false, error: "Invalid referral code" },
          { status: 200 }
        )
      }

      return NextResponse.json({
        valid: true,
        referrerName: `${referrer.firstName} ${referrer.lastName.charAt(0)}.`,
      })
    }

    // ── Action: Regenerate referral code (parent only) ──
    if (action === "generate") {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      if (session.user.role !== "PARENT") {
        return NextResponse.json(
          { error: "Only parents can generate referral codes" },
          { status: 403 }
        )
      }

      let newCode = ""
      let attempts = 0
      while (attempts < 5) {
        newCode = generateReferralCode()
        const existing = await prisma.user.findFirst({
          where: { referralCode: newCode },
        })
        if (!existing) break
        attempts++
      }
      if (attempts >= 5) {
        newCode = `REF-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode: newCode },
      })

      const baseUrl = process.env.NEXTAUTH_URL || "https://expertguru.net"
      const referralLink = `${baseUrl}/register?ref=${newCode}`

      return NextResponse.json({
        message: "Referral code regenerated",
        referralCode: newCode,
        referralLink,
      })
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'validate' or 'generate'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("POST /api/referrals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}