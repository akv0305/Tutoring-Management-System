// app/api/cron/expire-pending-classes/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Two-phase expiry sweep:
 *
 * Phase 1 — Expire PENDING_PAYMENT classes whose scheduledAt has passed.
 *   Class → CANCELLED_STUDENT
 *   BookingOrder → CANCELLED (if no future pending classes remain)
 *   Payment → FAILED (if linked order fully cancelled)
 *   Wallet hold reversed
 *   Parent notified
 *
 * Phase 2 — Expire PENDING payments whose booking order classes have ALL
 *   passed (completed, cancelled, or past-scheduled). Catches payments that
 *   weren't linked via the class path above.
 */

export async function expirePendingClasses(
  scope?: { studentIds?: string[] }
): Promise<{
  expiredClasses: number
  cancelledOrders: number
  failedPayments: number
}> {
  const now = new Date()
  let expiredClassCount = 0
  let cancelledOrders = 0
  let failedPayments = 0

  // ═══════════════════════════════════════════════════════════
  //  PHASE 1: Expire past PENDING_PAYMENT classes
  // ═══════════════════════════════════════════════════════════

  const classWhere: Record<string, unknown> = {
    status: "PENDING_PAYMENT",
    scheduledAt: { lt: now },
  }
  if (scope?.studentIds?.length) {
    classWhere.studentId = { in: scope.studentIds }
  }

  const expiredClasses = await prisma.class.findMany({
    where: classWhere,
    include: {
      bookingOrder: {
        include: {
          payment: true,
          classes: { select: { id: true, status: true, scheduledAt: true } },
        },
      },
      student: {
        include: {
          parent: {
            include: {
              user: { select: { id: true, firstName: true, email: true } },
              wallet: true,
            },
          },
        },
      },
      subject: { select: { name: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  const reason = "Auto-expired: payment not received before class time"
  const processedOrderIds = new Set<string>()
  const processedPaymentIds = new Set<string>()

  for (const cls of expiredClasses) {
    // 1. Cancel the class
    await prisma.class.update({
      where: { id: cls.id },
      data: {
        status: "CANCELLED_STUDENT",
        cancelledAt: now,
        cancelReason: reason,
      },
    })
    expiredClassCount++

    // 2. Check booking order
    if (cls.bookingOrderId && !processedOrderIds.has(cls.bookingOrderId)) {
      processedOrderIds.add(cls.bookingOrderId)

      const order = cls.bookingOrder
      if (order && order.status === "PENDING_PAYMENT") {
        const freshOrder = await prisma.bookingOrder.findUnique({
          where: { id: order.id },
          include: {
            classes: {
              select: { id: true, status: true, scheduledAt: true },
            },
          },
        })

        if (freshOrder) {
          const stillPendingFuture = freshOrder.classes.some(
            (c) => c.status === "PENDING_PAYMENT" && c.scheduledAt >= now
          )

          if (!stillPendingFuture) {
            await prisma.bookingOrder.update({
              where: { id: order.id },
              data: { status: "CANCELLED" },
            })
            cancelledOrders++

            // Fail the payment
            if (
              order.payment &&
              order.payment.status === "PENDING" &&
              !processedPaymentIds.has(order.payment.id)
            ) {
              processedPaymentIds.add(order.payment.id)
              await prisma.payment.update({
                where: { id: order.payment.id },
                data: {
                  status: "FAILED",
                  adminNotes: reason,
                },
              })
              failedPayments++
            }

            // Reverse wallet hold
            if (order.walletDeduction && Number(order.walletDeduction) > 0) {
              const wallet = cls.student.parent.wallet
              if (wallet) {
                await prisma.$transaction([
                  prisma.wallet.update({
                    where: { id: wallet.id },
                    data: {
                      balance: {
                        increment: Number(order.walletDeduction),
                      },
                    },
                  }),
                  prisma.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount: Number(order.walletDeduction),
                      type: "ADMIN_ADJUSTMENT",
                      description: `Wallet refund: order expired (payment not received). Order ref: ${order.orderRef ?? order.id}`,
                      referenceId: order.id,
                    },
                  }),
                ])
              }
            }

            // Notify parent
            const parentUser = cls.student.parent.user
            if (parentUser) {
              const teacherName = `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`
              await prisma.notification.create({
                data: {
                  userId: parentUser.id,
                  type: "CLASS",
                  title: "Booking Expired — Payment Not Received",
                  message: `Your booking for ${cls.subject.name} with ${teacherName} has been automatically cancelled because payment was not received before the class time. If wallet funds were held, they have been refunded.`,
                },
              })
            }
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  PHASE 2: Expire stale PENDING payments
  //  Catches payments where:
  //   - Status is still PENDING
  //   - Linked booking order exists and ALL its classes are in the past
  //   - OR no booking order but payment was created > 7 days ago
  // ═══════════════════════════════════════════════════════════

  const paymentWhere: Record<string, unknown> = {
    status: "PENDING",
    id: { notIn: Array.from(processedPaymentIds) }, // skip already processed
  }
  if (scope?.studentIds?.length) {
    paymentWhere.studentId = { in: scope.studentIds }
  }

  const stalePayments = await prisma.payment.findMany({
    where: paymentWhere,
    include: {
      bookingOrder: {
        include: {
          classes: {
            select: { id: true, status: true, scheduledAt: true },
          },
        },
      },
      student: {
        include: {
          parent: {
            include: {
              user: { select: { id: true, firstName: true } },
              wallet: true,
            },
          },
        },
      },
    },
  })

  for (const payment of stalePayments) {
    let shouldExpire = false

    if (payment.bookingOrder) {
      // Has a booking order — check if ALL classes are past
      const allClassesPast = payment.bookingOrder.classes.every(
        (c) => c.scheduledAt < now
      )
      const anyStillPendingPayment = payment.bookingOrder.classes.some(
        (c) => c.status === "PENDING_PAYMENT" && c.scheduledAt >= now
      )

      if (allClassesPast && !anyStillPendingPayment) {
        shouldExpire = true

        // Also cancel the booking order if still pending
        if (payment.bookingOrder.status === "PENDING_PAYMENT") {
          await prisma.bookingOrder.update({
            where: { id: payment.bookingOrder.id },
            data: { status: "CANCELLED" },
          })
          cancelledOrders++

          // Cancel any remaining non-terminal classes
          await prisma.class.updateMany({
            where: {
              bookingOrderId: payment.bookingOrder.id,
              status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"] },
            },
            data: {
              status: "CANCELLED_STUDENT",
              cancelledAt: now,
              cancelReason: reason,
            },
          })

          // Reverse wallet hold
          if (
            payment.bookingOrder.walletDeduction &&
            Number(payment.bookingOrder.walletDeduction) > 0
          ) {
            const wallet = payment.student.parent.wallet
            if (wallet) {
              await prisma.$transaction([
                prisma.wallet.update({
                  where: { id: wallet.id },
                  data: {
                    balance: {
                      increment: Number(
                        payment.bookingOrder.walletDeduction
                      ),
                    },
                  },
                }),
                prisma.walletTransaction.create({
                  data: {
                    walletId: wallet.id,
                    amount: Number(payment.bookingOrder.walletDeduction),
                    type: "ADMIN_ADJUSTMENT",
                    description: `Wallet refund: order expired (payment not received). Order ref: ${payment.bookingOrder.orderRef ?? payment.bookingOrder.id}`,
                    referenceId: payment.bookingOrder.id,
                  },
                }),
              ])
            }
          }
        }
      }
    } else {
      // No booking order linked — expire if payment is older than 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (payment.createdAt < sevenDaysAgo) {
        shouldExpire = true
      }
    }

    if (shouldExpire) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          adminNotes: reason,
        },
      })
      failedPayments++

      // Notify parent
      const parentUser = payment.student.parent.user
      if (parentUser) {
        await prisma.notification.create({
          data: {
            userId: parentUser.id,
            type: "PAYMENT",
            title: "Payment Expired",
            message: `Your pending payment of $${Number(payment.amount)} has been automatically expired because it was not completed in time.`,
          },
        })
      }
    }
  }

  return {
    expiredClasses: expiredClassCount,
    cancelledOrders,
    failedPayments,
  }
}

// GET handler — callable by external cron
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await expirePendingClasses()

    return NextResponse.json({
      message: "Expiry sweep completed",
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cron expire-pending-classes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
