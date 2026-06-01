import { prisma } from "@/lib/prisma"
import { AdminCouponsClient } from "./AdminCouponsClient"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  // ── Fetch all coupons with relations ──────────────────
  const couponsRaw = await prisma.coupon.findMany({
    include: {
      assignments: {
        include: {
          parentProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      },
      usages: {
        include: {
          parentProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { usedAt: "desc" },
        take: 20,
      },
      _count: {
        select: { usages: true, assignments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Auto-expire coupons that are past their validUntil
  const now = new Date()
  const expiredIds = couponsRaw
    .filter((c) => c.status === "ACTIVE" && new Date(c.validUntil) < now)
    .map((c) => c.id)

  if (expiredIds.length > 0) {
    await prisma.coupon.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRED" },
    })
  }

  const coupons = couponsRaw.map((coupon) => {
    const isExpired = coupon.status === "ACTIVE" && new Date(coupon.validUntil) < now
    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType as string,
      discountValue: Number(coupon.discountValue),
      scope: coupon.scope as string,
      maxUsesTotal: coupon.maxUsesTotal,
      maxUsesPerUser: coupon.maxUsesPerUser,
      usedCount: coupon.usedCount,
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
      validFrom: coupon.validFrom.toISOString(),
      validUntil: coupon.validUntil.toISOString(),
      status: isExpired ? "EXPIRED" : (coupon.status as string),
      createdAt: coupon.createdAt.toISOString(),
      totalAssignments: coupon._count.assignments,
      totalUsages: coupon._count.usages,
      assignedParents: coupon.assignments.map((a) => ({
        parentProfileId: a.parentProfileId,
        name: `${a.parentProfile.user.firstName} ${a.parentProfile.user.lastName}`,
        email: a.parentProfile.user.email,
      })),
      recentUsages: coupon.usages.map((u) => ({
        parentName: `${u.parentProfile.user.firstName} ${u.parentProfile.user.lastName}`,
        parentEmail: u.parentProfile.user.email,
        discountApplied: Number(u.discountApplied),
        usedAt: u.usedAt.toISOString(),
      })),
    }
  })

  // ── KPIs ──────────────────────────────────────────────
  const totalDiscountGiven = couponsRaw.reduce((sum, c) => {
    const couponTotal = c.usages.reduce((s, u) => s + Number(u.discountApplied), 0)
    return sum + couponTotal
  }, 0)

  const kpis = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter((c) => c.status === "ACTIVE").length,
    expiredCoupons: coupons.filter((c) => c.status === "EXPIRED").length,
    disabledCoupons: coupons.filter((c) => c.status === "DISABLED").length,
    totalUsages: coupons.reduce((sum, c) => sum + c.usedCount, 0),
    totalDiscountGiven,
  }

  // ── Fetch parents for assignment dropdown ─────────────
  const parentsRaw = await prisma.parentProfile.findMany({
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true, status: true },
      },
    },
    orderBy: { user: { firstName: "asc" } },
  })

  const parents = parentsRaw
    .filter((p) => p.user.status === "ACTIVE")
    .map((p) => ({
      parentProfileId: p.id,
      name: `${p.user.firstName} ${p.user.lastName}`,
      email: p.user.email,
    }))

  return (
    <AdminCouponsClient
      coupons={coupons}
      kpis={kpis}
      parents={parents}
    />
  )
}
