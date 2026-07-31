import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/wallets — list all wallets with parent info and stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const parentProfileId = searchParams.get("parentProfileId")

    // If a specific wallet is requested, return full transaction history
    if (parentProfileId) {
      const wallet = await prisma.wallet.findUnique({
        where: { parentProfileId },
        include: {
          parentProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          transactions: {
            orderBy: { createdAt: "desc" },
          },
        },
      })

      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
      }

      const transactions = await Promise.all(
        wallet.transactions.map(async (t) => {
          let description = t.description
          let bookingInfo: string | null = null

          // Enrich BOOKING_DISCOUNT with booking details
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
                bookingInfo = `${cls.subject.name} with ${teacherName} · ${cls.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              }
            } catch {
              // Keep original description
            }
          }

          return {
            id: t.id,
            amount: Number(t.amount),
            type: t.type,
            typeLabel: getTypeLabel(t.type),
            description,
            bookingInfo,
            referenceId: t.referenceId,
            createdAt: t.createdAt.toISOString(),
          }
        })
      )

      const totalCredited = wallet.transactions
        .filter((t) => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalDebited = wallet.transactions
        .filter((t) => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

      return NextResponse.json({
        wallet: {
          id: wallet.id,
          balance: Number(wallet.balance),
          parentProfileId: wallet.parentProfileId,
          parentName: `${wallet.parentProfile.user.firstName} ${wallet.parentProfile.user.lastName}`,
          parentEmail: wallet.parentProfile.user.email,
          totalCredited,
          totalDebited,
          transactionCount: wallet.transactions.length,
        },
        transactions,
      })
    }

    // Otherwise, return all wallets summary
    const wallets = await prisma.wallet.findMany({
      include: {
        parentProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, status: true } },
          },
        },
        transactions: {
          select: { amount: true, type: true, createdAt: true },
        },
      },
      orderBy: { parentProfile: { user: { firstName: "asc" } } },
    })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const walletList = wallets.map((w) => {
      const totalCredited = w.transactions
        .filter((t) => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalDebited = w.transactions
        .filter((t) => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

      const monthlyUsage = w.transactions
        .filter((t) => Number(t.amount) < 0 && t.createdAt >= monthStart)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

      return {
        id: w.id,
        parentProfileId: w.parentProfile.id,
        parentName: `${w.parentProfile.user.firstName} ${w.parentProfile.user.lastName}`,
        parentEmail: w.parentProfile.user.email,
        parentStatus: w.parentProfile.user.status,
        balance: Number(w.balance),
        totalCredited,
        totalDebited,
        monthlyUsage,
        transactionCount: w.transactions.length,
        lastActivity: w.transactions.length > 0
          ? w.transactions.reduce((latest, t) =>
              t.createdAt > latest ? t.createdAt : latest,
              w.transactions[0].createdAt
            ).toISOString()
          : null,
      }
    })

    // Platform-wide KPIs
    const totalWalletBalance = walletList.reduce((sum, w) => sum + w.balance, 0)
    const totalCreditedAll = walletList.reduce((sum, w) => sum + w.totalCredited, 0)
    const totalDebitedAll = walletList.reduce((sum, w) => sum + w.totalDebited, 0)
    const activeWallets = walletList.filter((w) => w.parentStatus === "ACTIVE").length

    return NextResponse.json({
      wallets: walletList,
      kpis: {
        totalWallets: walletList.length,
        activeWallets,
        totalWalletBalance,
        totalCredited: totalCreditedAll,
        totalDebited: totalDebitedAll,
      },
    })
  } catch (error) {
    console.error("GET /api/admin/wallets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
