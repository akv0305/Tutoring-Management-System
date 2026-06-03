// app/api/admin/welcome-offer/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all welcome offer wallet transactions
  const transactions = await prisma.walletTransaction.findMany({
    where: { type: "WELCOME_OFFER" },
    orderBy: { createdAt: "desc" },
    include: {
      wallet: {
        include: {
          parentProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // KPIs
  const totalCredited = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalParents = transactions.length
  const avgAmount = totalParents > 0 ? totalCredited / totalParents : 0

  // Check how many of these parents have made a booking (converted)
  const parentProfileIds = transactions.map((t) => t.wallet.parentProfileId)
  const parentsWithBookings = await prisma.bookingOrder.findMany({
    where: {
      student: {
        parentId: { in: parentProfileIds },
      },
      status: { in: ["PAID", "PENDING_PAYMENT"] },
    },
    select: {
      student: { select: { parentId: true } },
    },
    distinct: ["studentId"],
  })

  const convertedParentIds = new Set(
    parentsWithBookings.map((b) => b.student.parentId)
  )
  const convertedCount = parentProfileIds.filter((id) =>
    convertedParentIds.has(id)
  ).length
  const conversionRate =
    totalParents > 0 ? Math.round((convertedCount / totalParents) * 100) : 0

  // Check how many have used the wallet balance (have debit transactions)
  const walletsWithDebits = await prisma.walletTransaction.groupBy({
    by: ["walletId"],
    where: {
      walletId: { in: transactions.map((t) => t.walletId) },
      amount: { lt: 0 },
    },
  })
  const redeemedCount = walletsWithDebits.length

  // This month's stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthTransactions = transactions.filter(
    (t) => t.createdAt >= monthStart
  )
  const thisMonthCredited = thisMonthTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  )
  const thisMonthCount = thisMonthTransactions.length

  // Build parent list
  const parents = transactions.map((t) => {
    const user = t.wallet.parentProfile.user
    const parentId = t.wallet.parentProfileId
    return {
      id: t.id,
      parentName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      amount: Number(t.amount),
      creditedAt: t.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      registeredAt: user.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      hasBooked: convertedParentIds.has(parentId),
      hasRedeemed: walletsWithDebits.some((w) => w.walletId === t.walletId),
    }
  })

  return NextResponse.json({
    kpis: {
      totalCredited,
      totalParents,
      avgAmount: Math.round(avgAmount * 100) / 100,
      convertedCount,
      conversionRate,
      redeemedCount,
      thisMonthCredited,
      thisMonthCount,
    },
    parents,
  })
}
