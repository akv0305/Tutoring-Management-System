import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ═════════════════════════════════════════════════════════
// POST /api/coupons/validate
// Parent validates a coupon code against a booking amount.
// Body: { couponCode: string, totalAmount: number }
// Returns: { valid, discountAmount, couponId, couponName,
//            discountType, discountValue, message }
// ═════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only parents can use coupons
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can use discount coupons." }, { status: 403 })
    }

    const body = await req.json()
    const { couponCode, totalAmount } = body

    if (!couponCode || typeof couponCode !== "string" || !couponCode.trim()) {
      return NextResponse.json({ valid: false, error: "Coupon code is required." }, { status: 400 })
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
      return NextResponse.json({ valid: false, error: "A valid booking amount is required." }, { status: 400 })
    }

    const amount = Number(totalAmount)

    // ── 1. Find coupon (case-insensitive) ───────────────
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: { equals: couponCode.trim().toUpperCase(), mode: "insensitive" },
      },
      include: {
        assignments: { select: { parentProfileId: true } },
        _count: { select: { usages: true } },
      },
    })

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: "Invalid coupon code. Please check and try again.",
      })
    }

    // ── 2. Check status ─────────────────────────────────
    if (coupon.status === "DISABLED") {
      return NextResponse.json({
        valid: false,
        error: "This coupon has been deactivated.",
      })
    }

    if (coupon.status === "EXPIRED") {
      return NextResponse.json({
        valid: false,
        error: "This coupon has expired.",
      })
    }

    // ── 3. Check date validity ──────────────────────────
    const now = new Date()

    if (now < new Date(coupon.validFrom)) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is not yet active.",
      })
    }

    if (now > new Date(coupon.validUntil)) {
      // Auto-expire
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json({
        valid: false,
        error: "This coupon has expired.",
      })
    }

    // ── 4. Check global usage cap ───────────────────────
    if (coupon.maxUsesTotal !== null && coupon.usedCount >= coupon.maxUsesTotal) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has reached its maximum usage limit.",
      })
    }

    // ── 5. Get parent profile ───────────────────────────
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!parentProfile) {
      return NextResponse.json({
        valid: false,
        error: "Parent profile not found.",
      }, { status: 404 })
    }

    // ── 6. Check scope / assignment ─────────────────────
    if (coupon.scope === "SINGLE_USER" || coupon.scope === "MULTI_USER") {
      const isAssigned = coupon.assignments.some(
        (a) => a.parentProfileId === parentProfile.id
      )
      if (!isAssigned) {
        return NextResponse.json({
          valid: false,
          error: "This coupon is not available for your account.",
        })
      }
    }
    // ALL_USERS — no assignment check needed

    // ── 7. Check per-user usage limit ───────────────────
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        parentProfileId: parentProfile.id,
      },
    })

    if (userUsageCount >= coupon.maxUsesPerUser) {
      return NextResponse.json({
        valid: false,
        error: coupon.maxUsesPerUser === 1
          ? "You have already used this coupon."
          : `You have already used this coupon ${userUsageCount} time${userUsageCount !== 1 ? "s" : ""} (limit: ${coupon.maxUsesPerUser}).`,
      })
    }

    // ── 8. Check minimum order amount ───────────────────
    if (coupon.minOrderAmount && amount < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount for this coupon is $${Number(coupon.minOrderAmount).toFixed(2)}. Your booking total is $${amount.toFixed(2)}.`,
      })
    }

    // ── 9. Calculate discount ───────────────────────────
    let discountAmount: number

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (amount * Number(coupon.discountValue)) / 100

      // Apply max discount cap if set
      if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount)
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = Number(coupon.discountValue)
    }

    // Discount cannot exceed order total
    if (discountAmount > amount) {
      discountAmount = amount
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    const amountDue = Math.round((amount - discountAmount) * 100) / 100

    // ── 10. Build discount label ────────────────────────
    const discountLabel =
      coupon.discountType === "PERCENTAGE"
        ? `${Number(coupon.discountValue)}% off`
        : `$${Number(coupon.discountValue).toFixed(2)} off`

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      couponCode: coupon.code,
      couponName: coupon.name,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount,
      amountDue,
      message: `Coupon applied! ${discountLabel} — you save $${discountAmount.toFixed(2)}.`,
    })
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error)
    return NextResponse.json(
      { valid: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
