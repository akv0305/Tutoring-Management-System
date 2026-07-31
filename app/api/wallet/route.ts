import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ─── GET /api/wallet ────────────────────────────────────────────────
// Returns the logged-in parent's wallet balance and transaction history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Only parents can access wallet" },
        { status: 403 }
      )
    }

    // Find parent profile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!parentProfile) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      )
    }

    // Parse query params for pagination
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const typeFilter = searchParams.get("type") // REFERRAL_REWARD, BOOKING_DISCOUNT, ADMIN_ADJUSTMENT, SELF_TOP_UP, WELCOME_OFFER
    const skip = (page - 1) * limit

    // Find or create wallet (auto-create with 0 balance if missing)
    let wallet = await prisma.wallet.findUnique({
      where: { parentProfileId: parentProfile.id },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          parentProfileId: parentProfile.id,
          balance: 0,
        },
      })
    }

    // Build transaction filter
    const txWhere: any = { walletId: wallet.id }
    if (typeFilter) {
      const validTypes = ["REFERRAL_REWARD", "BOOKING_DISCOUNT", "ADMIN_ADJUSTMENT", "SELF_TOP_UP", "WELCOME_OFFER"]
      if (validTypes.includes(typeFilter.toUpperCase())) {
        txWhere.type = typeFilter.toUpperCase()
      }
    }

    // Fetch transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: txWhere,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: txWhere }),
    ])

    // Compute summary stats
    const allTransactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      select: { amount: true, type: true, createdAt: true },
    })

    const totalCredited = allTransactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalDebited = allTransactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const referralEarnings = allTransactions
      .filter((t) => t.type === "REFERRAL_REWARD")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    // Current month usage (debits only, current calendar month)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyUsage = allTransactions
      .filter((t) => Number(t.amount) < 0 && t.createdAt >= monthStart)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    // Enrich BOOKING_DISCOUNT transactions with booking details
    const enrichedTransactions = await Promise.all(
      transactions.map(async (t) => {
        let description = t.description
        let typeLabel = getTypeLabel(t.type)

        // For BOOKING_DISCOUNT, try to fetch booking details
        if (t.type === "BOOKING_DISCOUNT" && t.referenceId) {
          try {
            const bookingOrder = await prisma.bookingOrder.findUnique({
              where: { id: t.referenceId },
              include: {
                classes: {
                  take: 1,
                  orderBy: { scheduledAt: "asc" },
                  include: {
                    subject: { select: { name: true } },
                    teacher: {
                      include: {
                        user: { select: { firstName: true, lastName: true } },
                      },
                    },
                  },
                },
              },
            })
            if (bookingOrder?.classes?.[0]) {
              const cls = bookingOrder.classes[0]
              const teacherName = `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`
              const subjectName = cls.subject.name
              const classDate = cls.scheduledAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
              description = `Used for booking · ${subjectName} with ${teacherName} · ${classDate}`
            }
          } catch {
            // Keep original description if lookup fails
          }
        }

        return {
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          typeLabel,
          description,
          referenceId: t.referenceId,
          createdAt: t.createdAt.toISOString(),
          timestamp: getRelativeTime(t.createdAt),
        }
      })
    )

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balance: Number(wallet.balance),
      },
      summary: {
        totalCredited,
        totalDebited,
        referralEarnings,
        monthlyUsage,
      },
      transactions: enrichedTransactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("GET /api/wallet error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/wallet ──────────────────────────────────────────────
// Admin-only: manually adjust a parent's wallet balance
// Body: { parentProfileId: string, amount: number, description: string }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can adjust wallets" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { parentProfileId, amount, description } = body

    if (!parentProfileId || typeof parentProfileId !== "string") {
      return NextResponse.json(
        { error: "parentProfileId is required" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "amount must be a non-zero number (positive to credit, negative to debit)" },
        { status: 400 }
      )
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "description is required for audit trail" },
        { status: 400 }
      )
    }

    // Verify parent profile exists
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { id: parentProfileId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    })

    if (!parentProfile) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      )
    }

    // Find or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { parentProfileId },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          parentProfileId,
          balance: 0,
        },
      })
    }

    // Check that debit won't make balance negative
    const currentBalance = Number(wallet.balance)
    if (amount < 0 && currentBalance + amount < 0) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. Current: $${currentBalance.toFixed(2)}, attempted debit: $${Math.abs(amount).toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Perform adjustment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          amount,
          type: "ADMIN_ADJUSTMENT",
          description: description.trim(),
          referenceId: `ADMIN-${session.user.id}`,
        },
      })

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          balance: { increment: amount },
        },
      })

      // Notify the parent
      await tx.notification.create({
        data: {
          userId: parentProfile!.user ? parentProfile!.userId : parentProfileId,
          type: "SYSTEM",
          title: amount > 0 ? "Wallet Credit" : "Wallet Debit",
          message:
            amount > 0
              ? `$${amount.toFixed(2)} has been credited to your wallet. Reason: ${description.trim()}`
              : `$${Math.abs(amount).toFixed(2)} has been debited from your wallet. Reason: ${description.trim()}`,
        },
      })

      return { transaction, updatedWallet }
    })

    return NextResponse.json({
      message: `Wallet ${amount > 0 ? "credited" : "debited"} successfully`,
      parentName: `${parentProfile.user.firstName} ${parentProfile.user.lastName}`,
      adjustment: Number(result.transaction.amount),
      newBalance: Number(result.updatedWallet.balance),
      transactionId: result.transaction.id,
    })
  } catch (error) {
    console.error("PATCH /api/wallet error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ─── Helper: Transaction type label ─────────────────────────────────
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    REFERRAL_REWARD: "Referral Reward",
    BOOKING_DISCOUNT: "Wallet Used",
    ADMIN_ADJUSTMENT: "Admin Adjustment",
    SELF_TOP_UP: "Wallet Top-Up",
    WELCOME_OFFER: "Welcome Offer",
  }
  return labels[type] || type
}

// ─── Helper: Relative time ──────────────────────────────────────────
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay} days ago`
  if (diffDay < 30)
    return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? "s" : ""} ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
