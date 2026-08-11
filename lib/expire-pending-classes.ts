import { prisma } from "@/lib/prisma"

// ═══════════════════════════════════════════════════════════════════
// Reusable auto-expiry function
//
// Rule: If ANY class in a booking order has status PENDING_PAYMENT
//       AND (scheduledAt + duration) < now  →  expire the ENTIRE
//       booking order, all its PENDING_PAYMENT classes, the linked
//       payment, wallet deduction refund, and coupon usage reversal.
// ═══════════════════════════════════════════════════════════════════

type ExpireScope = { studentIds?: string[] }

export async function expirePendingClasses(scope?: ExpireScope) {
  const now = new Date()

  // ── Step 1: Find all PENDING_PAYMENT classes whose time window
  //            has fully passed (scheduledAt + duration < now)
  const classWhere: Record<string, unknown> = {
    status: "PENDING_PAYMENT",
  }
  if (scope?.studentIds?.length) {
    classWhere.studentId = { in: scope.studentIds }
  }

  const expiredClasses = await prisma.class.findMany({
    where: classWhere,
    select: {
      id: true,
      scheduledAt: true,
      duration: true,
      bookingOrderId: true,
    },
  })

  // Filter to only those whose class window is fully over
  const trulyExpired = expiredClasses.filter((c) => {
    const endTime = new Date(
      c.scheduledAt.getTime() + (c.duration ?? 60) * 60_000
    )
    return endTime < now
  })

  if (trulyExpired.length === 0) {
    return { expiredClasses: 0, cancelledOrders: 0, failedPayments: 0 }
  }

  // ── Step 2: Collect unique booking order IDs that have at least
  //            one expired class
  const bookingOrderIds = [
    ...new Set(
      trulyExpired
        .map((c) => c.bookingOrderId)
        .filter((id): id is string => !!id)
    ),
  ]

  let cancelledOrders = 0
  let failedPayments = 0
  const expiredClassIds: string[] = []

  // ── Step 3: Process each affected booking order
  for (const boId of bookingOrderIds) {
    const bookingOrder = await prisma.bookingOrder.findUnique({
      where: { id: boId },
      include: {
        payment: true,
        classes: {
          select: { id: true, status: true },
        },
        student: {
          include: {
            parent: {
              include: {
                user: { select: { id: true, firstName: true, email: true } },
              },
            },
          },
        },
      },
    })

    if (!bookingOrder) continue

    // Skip if already cancelled/paid
    if (["CANCELLED", "PAID"].includes(bookingOrder.status)) continue

    // Gather all PENDING_PAYMENT class IDs in this booking order
    // (cancel ALL of them, not just the expired ones, because
    //  the payment amount covers the entire order)
    const pendingClassIds = bookingOrder.classes
      .filter((c) => c.status === "PENDING_PAYMENT")
      .map((c) => c.id)

    if (pendingClassIds.length === 0) continue

    await prisma.$transaction(async (tx) => {
      // ── 3a. Cancel all PENDING_PAYMENT classes in this order
      await tx.class.updateMany({
        where: {
          id: { in: pendingClassIds },
          status: "PENDING_PAYMENT",
        },
        data: {
          status: "CANCELLED_STUDENT",
          cancelledAt: now,
          cancelReason:
            "Auto-expired: payment was not completed before class time",
        },
      })
      expiredClassIds.push(...pendingClassIds)

      // ── 3b. Cancel the booking order
      await tx.bookingOrder.update({
        where: { id: boId },
        data: { status: "CANCELLED" },
      })
      cancelledOrders++

      // ── 3c. Fail the payment (if still PENDING)
      if (
        bookingOrder.payment &&
        bookingOrder.payment.status === "PENDING"
      ) {
        await tx.payment.update({
          where: { id: bookingOrder.payment.id },
          data: {
            status: "FAILED",
            adminNotes:
              "Auto-expired: one or more classes passed without payment completion",
          },
        })
        failedPayments++
      }

      // ── 3d. Refund wallet deduction (if any)
      const walletDeduction = Number(bookingOrder.walletDeduction ?? 0)
      if (walletDeduction > 0 && bookingOrder.student.parent) {
        const wallet = await tx.wallet.findUnique({
          where: {
            parentProfileId: bookingOrder.student.parent.id,
          },
        })

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: walletDeduction },
            },
          })

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: walletDeduction,
              type: "ADMIN_ADJUSTMENT",
              description: `Refund: booking ${bookingOrder.orderRef} auto-expired (payment not completed)`,
              referenceId: boId,
            },
          })
        }
      }

      // ── 3e. Reverse coupon usage (if any)
      if (bookingOrder.couponId) {
        // Delete the CouponUsage record (field is bookingOrderId)
        await tx.couponUsage.deleteMany({
          where: {
            couponId: bookingOrder.couponId,
            bookingOrderId: boId,
          },
        })

        // Decrement the coupon's usedCount
        await tx.coupon.update({
          where: { id: bookingOrder.couponId },
          data: {
            usedCount: { decrement: 1 },
          },
        })
      }

      // ── 3f. Notify the parent
      const parentUserId = bookingOrder.student.parent?.user?.id
      if (parentUserId) {
        await tx.notification.create({
          data: {
            userId: parentUserId,
            type: "PAYMENT",
            title: "Booking Expired — Classes Cancelled",
            message: `Your booking ${bookingOrder.orderRef} has been auto-cancelled because payment was not completed before the class time. ${pendingClassIds.length} class${pendingClassIds.length > 1 ? "es have" : " has"} been cancelled.${walletDeduction > 0 ? ` $${walletDeduction.toFixed(2)} has been refunded to your wallet.` : ""}${bookingOrder.couponId ? " Your coupon has been restored." : ""} Please rebook if needed.`,
          },
        })
      }
    })
  }

  // ── Step 4: Handle orphan PENDING_PAYMENT classes (no booking order)
  const orphanExpired = trulyExpired.filter((c) => !c.bookingOrderId)
  if (orphanExpired.length > 0) {
    await prisma.class.updateMany({
      where: {
        id: { in: orphanExpired.map((c) => c.id) },
        status: "PENDING_PAYMENT",
      },
      data: {
        status: "CANCELLED_STUDENT",
        cancelledAt: now,
        cancelReason:
          "Auto-expired: payment was not completed before class time",
      },
    })
    expiredClassIds.push(...orphanExpired.map((c) => c.id))
  }

  return {
    expiredClasses: expiredClassIds.length,
    cancelledOrders,
    failedPayments,
  }
}
