import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// ─── Helper: Auto-generate coupon code ──────────────────
function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I/O/0/1
  let code = "GURU-"
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function generateUniqueCouponCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCouponCode()
    const exists = await prisma.coupon.findUnique({ where: { code } })
    if (!exists) return code
  }
  // Fallback: hex-based code
  return `GURU-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
}

// ─── Helper: Relative time label ────────────────────────
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ═════════════════════════════════════════════════════════
// GET /api/admin/coupons — list all coupons with stats
// ═════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search")
    const status = searchParams.get("status") // ACTIVE | EXPIRED | DISABLED
    const scope = searchParams.get("scope")   // ALL_USERS | MULTI_USER | SINGLE_USER
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    // Build filter
    const where: any = {}

    if (status) {
      where.status = status
    }
    if (scope) {
      where.scope = scope
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ]
    }

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
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
            take: 10,
          },
          _count: {
            select: { usages: true, assignments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ])

    // Auto-expire coupons whose validUntil has passed
    const now = new Date()
    const expiredIds = coupons
      .filter((c) => c.status === "ACTIVE" && new Date(c.validUntil) < now)
      .map((c) => c.id)

    if (expiredIds.length > 0) {
      await prisma.coupon.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "EXPIRED" },
      })
    }

    const mapped = coupons.map((coupon) => {
      const isExpired = coupon.status === "ACTIVE" && new Date(coupon.validUntil) < now
      return {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        scope: coupon.scope,
        maxUsesTotal: coupon.maxUsesTotal,
        maxUsesPerUser: coupon.maxUsesPerUser,
        usedCount: coupon.usedCount,
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
        maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
        validFrom: coupon.validFrom.toISOString(),
        validUntil: coupon.validUntil.toISOString(),
        status: isExpired ? "EXPIRED" : coupon.status,
        createdAt: coupon.createdAt.toISOString(),
        createdAgo: getRelativeTime(coupon.createdAt),
        totalAssignments: coupon._count.assignments,
        totalUsages: coupon._count.usages,
        assignedParents: coupon.assignments.map((a) => ({
          parentProfileId: a.parentProfileId,
          name: `${a.parentProfile.user.firstName} ${a.parentProfile.user.lastName}`,
          email: a.parentProfile.user.email,
          assignedAt: a.createdAt.toISOString(),
        })),
        recentUsages: coupon.usages.map((u) => ({
          parentName: `${u.parentProfile.user.firstName} ${u.parentProfile.user.lastName}`,
          parentEmail: u.parentProfile.user.email,
          discountApplied: Number(u.discountApplied),
          usedAt: u.usedAt.toISOString(),
          usedAgo: getRelativeTime(u.usedAt),
        })),
      }
    })

    // Summary stats
    const allCoupons = await prisma.coupon.groupBy({
      by: ["status"],
      _count: true,
    })

    const summary = {
      total: totalCount,
      active: allCoupons.find((c) => c.status === "ACTIVE")?._count || 0,
      expired: allCoupons.find((c) => c.status === "EXPIRED")?._count || 0,
      disabled: allCoupons.find((c) => c.status === "DISABLED")?._count || 0,
    }

    return NextResponse.json({
      coupons: mapped,
      summary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════
// POST /api/admin/coupons — create a new coupon
// ═════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      discountType,
      discountValue,
      scope,
      maxUsesTotal,
      maxUsesPerUser,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      assignedParentIds, // string[] of parentProfile IDs (for SINGLE_USER / MULTI_USER)
    } = body

    // ── Validation ──────────────────────────────────────
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Coupon name is required." }, { status: 400 })
    }
    if (!discountType || !["PERCENTAGE", "FIXED_AMOUNT"].includes(discountType)) {
      return NextResponse.json({ error: "Invalid discount type. Must be PERCENTAGE or FIXED_AMOUNT." }, { status: 400 })
    }
    if (!discountValue || Number(discountValue) <= 0) {
      return NextResponse.json({ error: "Discount value must be greater than 0." }, { status: 400 })
    }
    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100%." }, { status: 400 })
    }
    if (!validUntil) {
      return NextResponse.json({ error: "Expiry date is required." }, { status: 400 })
    }

    const expiryDate = new Date(validUntil)
    if (expiryDate <= new Date()) {
      return NextResponse.json({ error: "Expiry date must be in the future." }, { status: 400 })
    }

    const couponScope = scope || "ALL_USERS"
    if (!["ALL_USERS", "MULTI_USER", "SINGLE_USER"].includes(couponScope)) {
      return NextResponse.json({ error: "Invalid scope. Must be ALL_USERS, MULTI_USER, or SINGLE_USER." }, { status: 400 })
    }

    // SINGLE_USER and MULTI_USER require at least one assigned parent
    if ((couponScope === "SINGLE_USER" || couponScope === "MULTI_USER") &&
        (!assignedParentIds || !Array.isArray(assignedParentIds) || assignedParentIds.length === 0)) {
      return NextResponse.json(
        { error: `At least one parent must be assigned for ${couponScope.replace("_", " ").toLowerCase()} coupons.` },
        { status: 400 }
      )
    }

    if (couponScope === "SINGLE_USER" && assignedParentIds && assignedParentIds.length > 1) {
      return NextResponse.json(
        { error: "Single user coupons can only be assigned to one parent." },
        { status: 400 }
      )
    }

    // ── Generate unique code ────────────────────────────
    const code = await generateUniqueCouponCode()

    // ── Create coupon + assignments in transaction ──────
    const result = await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({
        data: {
          code,
          name: name.trim(),
          description: description?.trim() || null,
          discountType,
          discountValue: Number(discountValue),
          scope: couponScope,
          maxUsesTotal: maxUsesTotal ? Number(maxUsesTotal) : null,
          maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
          validFrom: validFrom ? new Date(validFrom) : new Date(),
          validUntil: expiryDate,
        },
      })

      // Create assignments for scoped coupons
      if (assignedParentIds && assignedParentIds.length > 0) {
        // Verify all parent profiles exist
        const parents = await tx.parentProfile.findMany({
          where: { id: { in: assignedParentIds } },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        })

        if (parents.length !== assignedParentIds.length) {
          throw new Error("One or more parent profiles not found.")
        }

        // Create assignments
        await tx.couponAssignment.createMany({
          data: assignedParentIds.map((parentProfileId: string) => ({
            couponId: coupon.id,
            parentProfileId,
          })),
        })

        // Send notification to each assigned parent
        for (const parent of parents) {
          const discountLabel = discountType === "PERCENTAGE"
            ? `${Number(discountValue)}% off`
            : `$${Number(discountValue).toFixed(2)} off`

          await tx.notification.create({
            data: {
              userId: parent.user.id,
              type: "SYSTEM",
              title: "You received a discount coupon!",
              message: `You've been assigned coupon code "${code}" — ${discountLabel} on your next booking. Valid until ${expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
            },
          })
        }
      }

      return coupon
    })

    return NextResponse.json({
      message: "Coupon created successfully.",
      coupon: {
        id: result.id,
        code: result.code,
        name: result.name,
        discountType: result.discountType,
        discountValue: Number(result.discountValue),
        scope: result.scope,
        validUntil: result.validUntil.toISOString(),
        assignedCount: assignedParentIds?.length || 0,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/admin/coupons error:", error)
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════
// PATCH /api/admin/coupons — update or disable a coupon
// ═════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { couponId, action } = body

    if (!couponId) {
      return NextResponse.json({ error: "couponId is required." }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        _count: { select: { usages: true } },
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 })
    }

    // ── Action: Disable coupon ──────────────────────────
    if (action === "disable") {
      if (coupon.status === "DISABLED") {
        return NextResponse.json({ error: "Coupon is already disabled." }, { status: 400 })
      }

      const updated = await prisma.coupon.update({
        where: { id: couponId },
        data: { status: "DISABLED" },
      })

      return NextResponse.json({
        message: `Coupon "${coupon.code}" has been disabled.`,
        coupon: { id: updated.id, code: updated.code, status: updated.status },
      })
    }

    // ── Action: Re-enable coupon ────────────────────────
    if (action === "enable") {
      if (coupon.status === "ACTIVE") {
        return NextResponse.json({ error: "Coupon is already active." }, { status: 400 })
      }

      // Check if the coupon expiry is still in the future
      if (new Date(coupon.validUntil) <= new Date()) {
        return NextResponse.json(
          { error: "Cannot re-enable an expired coupon. Update the expiry date first." },
          { status: 400 }
        )
      }

      const updated = await prisma.coupon.update({
        where: { id: couponId },
        data: { status: "ACTIVE" },
      })

      return NextResponse.json({
        message: `Coupon "${coupon.code}" has been re-enabled.`,
        coupon: { id: updated.id, code: updated.code, status: updated.status },
      })
    }

    // ── Action: Update coupon details ───────────────────
    if (action === "update") {
      const {
        name,
        description,
        discountType,
        discountValue,
        maxUsesTotal,
        maxUsesPerUser,
        minOrderAmount,
        maxDiscountAmount,
        validFrom,
        validUntil,
        assignedParentIds, // full replacement of assignments
      } = body

      const data: any = {}

      if (name !== undefined) data.name = name.trim()
      if (description !== undefined) data.description = description?.trim() || null
      if (discountType !== undefined) {
        if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(discountType)) {
          return NextResponse.json({ error: "Invalid discount type." }, { status: 400 })
        }
        data.discountType = discountType
      }
      if (discountValue !== undefined) {
        if (Number(discountValue) <= 0) {
          return NextResponse.json({ error: "Discount value must be greater than 0." }, { status: 400 })
        }
        const effectiveType = discountType || coupon.discountType
        if (effectiveType === "PERCENTAGE" && Number(discountValue) > 100) {
          return NextResponse.json({ error: "Percentage discount cannot exceed 100%." }, { status: 400 })
        }
        data.discountValue = Number(discountValue)
      }
      if (maxUsesTotal !== undefined) data.maxUsesTotal = maxUsesTotal ? Number(maxUsesTotal) : null
      if (maxUsesPerUser !== undefined) data.maxUsesPerUser = Number(maxUsesPerUser) || 1
      if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ? Number(minOrderAmount) : null
      if (maxDiscountAmount !== undefined) data.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null
      if (validFrom !== undefined) data.validFrom = new Date(validFrom)
      if (validUntil !== undefined) {
        const newExpiry = new Date(validUntil)
        if (newExpiry <= new Date()) {
          return NextResponse.json({ error: "Expiry date must be in the future." }, { status: 400 })
        }
        data.validUntil = newExpiry
        // If coupon was expired and new date is in the future, reactivate
        if (coupon.status === "EXPIRED") {
          data.status = "ACTIVE"
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.coupon.update({
          where: { id: couponId },
          data,
        })

        // Replace assignments if provided
        if (assignedParentIds !== undefined && Array.isArray(assignedParentIds)) {
          // Validate scope
          if (updated.scope === "SINGLE_USER" && assignedParentIds.length > 1) {
            throw new Error("Single user coupons can only be assigned to one parent.")
          }

          // Verify parent profiles
          if (assignedParentIds.length > 0) {
            const parents = await tx.parentProfile.findMany({
              where: { id: { in: assignedParentIds } },
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            })
            if (parents.length !== assignedParentIds.length) {
              throw new Error("One or more parent profiles not found.")
            }
          }

          // Get existing assignments to determine new ones
          const existingAssignments = await tx.couponAssignment.findMany({
            where: { couponId },
            select: { parentProfileId: true },
          })
          const existingIds = existingAssignments.map((a) => a.parentProfileId)

          // Delete removed assignments
          await tx.couponAssignment.deleteMany({
            where: {
              couponId,
              parentProfileId: { notIn: assignedParentIds },
            },
          })

          // Create new assignments
          const newIds = assignedParentIds.filter((id: string) => !existingIds.includes(id))
          if (newIds.length > 0) {
            await tx.couponAssignment.createMany({
              data: newIds.map((parentProfileId: string) => ({
                couponId,
                parentProfileId,
              })),
            })

            // Notify newly assigned parents
            const newParents = await tx.parentProfile.findMany({
              where: { id: { in: newIds } },
              include: { user: { select: { id: true, firstName: true } } },
            })

            const discountLabel = updated.discountType === "PERCENTAGE"
              ? `${Number(updated.discountValue)}% off`
              : `$${Number(updated.discountValue).toFixed(2)} off`

            for (const parent of newParents) {
              await tx.notification.create({
                data: {
                  userId: parent.user.id,
                  type: "SYSTEM",
                  title: "You received a discount coupon!",
                  message: `You've been assigned coupon code "${updated.code}" — ${discountLabel} on your next booking. Valid until ${new Date(updated.validUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
                },
              })
            }
          }
        }

        return updated
      })

      return NextResponse.json({
        message: `Coupon "${result.code}" updated successfully.`,
        coupon: {
          id: result.id,
          code: result.code,
          name: result.name,
          discountType: result.discountType,
          discountValue: Number(result.discountValue),
          scope: result.scope,
          status: result.status,
          validUntil: result.validUntil.toISOString(),
        },
      })
    }

    // ── Action: Delete coupon (only if unused) ──────────
    if (action === "delete") {
      if (coupon._count.usages > 0) {
        return NextResponse.json(
          { error: "Cannot delete a coupon that has been used. Disable it instead." },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        await tx.couponAssignment.deleteMany({ where: { couponId } })
        await tx.coupon.delete({ where: { id: couponId } })
      })

      return NextResponse.json({
        message: `Coupon "${coupon.code}" has been deleted.`,
      })
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: disable, enable, update, delete." },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("PATCH /api/admin/coupons error:", error)
    if (error.message?.includes("not found") || error.message?.includes("Single user")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ═════════════════════════════════════════════════════════
// DELETE /api/admin/coupons?id=xxx — quick delete (unused only)
// ═════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const couponId = req.nextUrl.searchParams.get("id")
    if (!couponId) {
      return NextResponse.json({ error: "Coupon id is required." }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: { _count: { select: { usages: true } } },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 })
    }

    if (coupon._count.usages > 0) {
      return NextResponse.json(
        { error: "Cannot delete a coupon that has been used. Disable it instead." },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.couponAssignment.deleteMany({ where: { couponId } })
      await tx.coupon.delete({ where: { id: couponId } })
    })

    return NextResponse.json({
      message: `Coupon "${coupon.code}" deleted successfully.`,
    })
  } catch (error) {
    console.error("DELETE /api/admin/coupons error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
