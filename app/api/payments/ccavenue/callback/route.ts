import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt, parseResponseString } from "@/lib/ccavenue"
import { sendEmail } from "@/lib/email"
import PaymentConfirmed from "@/emails/payment-confirmed"
import PaymentRejected from "@/emails/payment-rejected"

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || ""

  try {
    const formData = await req.formData()
    const encResp = formData.get("encResp") as string

    if (!encResp) {
      console.error("[CCAvenue Callback] No encResp received")
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=error&message=no-response`
        ),
        { status: 303 }
      )
    }

    const decryptedString = decrypt(encResp)
    const response = parseResponseString(decryptedString)

    console.log("[CCAvenue Callback] Order status:", response.order_status)
    console.log("[CCAvenue Callback] Order ID:", response.order_id)
    console.log("[CCAvenue Callback] Tracking ID:", response.tracking_id)

    const paymentId = response.merchant_param1
    const bookingOrderId = response.merchant_param2
    const orderStatus = response.order_status
    const trackingId = response.tracking_id
    const bankRefNo = response.bank_ref_no
    const paymentMode = response.payment_mode
    const cardName = response.card_name
    const transDate = response.trans_date
    const orderId = response.order_id
    const amount = response.amount

    if (!paymentId) {
      console.error("[CCAvenue Callback] No paymentId in merchant_param1")
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=error&message=invalid-payment`
        ),
        { status: 303 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            parent: {
              include: {
                user: {
                  select: { id: true, firstName: true, email: true },
                },
              },
            },
          },
        },
      },
    })

    if (!payment) {
      console.error("[CCAvenue Callback] Payment not found:", paymentId)
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=error&message=payment-not-found`
        ),
        { status: 303 }
      )
    }

    // Already confirmed — idempotent
    if (payment.status === "CONFIRMED") {
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=already-confirmed&order=${orderId}`
        ),
        { status: 303 }
      )
    }

    // ═══════════════════════════════════════════════════════
    //  SUCCESS
    // ═══════════════════════════════════════════════════════
    if (orderStatus === "Success") {
      // ── Check if payment was already auto-expired to FAILED ──
      if (payment.status === "FAILED") {
        // Gateway succeeded but our auto-expiry already cancelled
        // everything. Credit the paid amount to the parent's wallet.
        console.log(
          `[CCAvenue Callback] Payment ${paymentId} was auto-expired. Crediting $${amount} to wallet.`
        )

        // Mark payment as CONFIRMED (money was charged)
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "CONFIRMED",
            method: "CCAVENUE",
            bankReference: `${trackingId}|${bankRefNo}|${paymentMode}|${cardName}`,
            confirmedAt: new Date(),
            adminNotes:
              "Payment succeeded at gateway after auto-expiry. Amount credited to wallet.",
          },
        })

        // Credit to wallet
        const parentProfile = payment.student.parent
        if (parentProfile) {
          const paidAmount = parseFloat(amount) || Number(payment.amount)

          await prisma.$transaction(async (tx) => {
            // Find or create wallet
            let wallet = await tx.wallet.findFirst({
              where: { parentProfileId: parentProfile.id },
            })
            if (!wallet) {
              wallet = await tx.wallet.create({
                data: {
                  parentProfileId: parentProfile.id,
                  balance: 0,
                },
              })
            }

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: { increment: paidAmount } },
            })

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                amount: paidAmount,
                type: "ADMIN_ADJUSTMENT",
                description: `Gateway payment succeeded after booking auto-expired (Ref: ${orderId}). Amount credited to wallet.`,
                referenceId: paymentId,
              },
            })

            // Notify parent
            if (parentProfile.user?.id) {
              await tx.notification.create({
                data: {
                  userId: parentProfile.user.id,
                  type: "PAYMENT",
                  title: "Payment Credited to Wallet",
                  message: `Your payment of $${paidAmount.toFixed(2)} (Ref: ${orderId}) was processed successfully, but the associated classes had already been auto-cancelled. The full amount has been credited to your wallet. You can use it to book new classes.`,
                },
              })
            }
          })
        }

        return NextResponse.redirect(
          new URL(
            `${appUrl}/parent/payment-status?status=wallet-credited&order=${orderId}&amount=${amount}`
          ),
          { status: 303 }
        )
      }

      // ── Normal success flow (payment is still PENDING) ──
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "CONFIRMED",
          method: "CCAVENUE",
          bankReference: `${trackingId}|${bankRefNo}|${paymentMode}|${cardName}`,
          confirmedAt: new Date(),
        },
      })

      let classesConfirmed = 0

      if (bookingOrderId) {
        const bookingOrder = await prisma.bookingOrder.findUnique({
          where: { id: bookingOrderId },
        })

        if (bookingOrder) {
          await prisma.bookingOrder.update({
            where: { id: bookingOrder.id },
            data: { status: "PAID" },
          })

          const result = await prisma.class.updateMany({
            where: {
              bookingOrderId: bookingOrder.id,
              status: "PENDING_PAYMENT",
            },
            data: { status: "SCHEDULED" },
          })

          classesConfirmed = result.count
        }
      }

      if (payment.student.parent?.user) {
        await prisma.notification.create({
          data: {
            userId: payment.student.parent.user.id,
            type: "PAYMENT",
            title: "Payment Confirmed — Classes Scheduled",
            message: `Your payment of $${amount} (Ref: ${orderId}) via CCAvenue has been confirmed. ${classesConfirmed} class${classesConfirmed > 1 ? "es are" : " is"} now scheduled.`,
          },
        })

        if (payment.student.parent.user.email) {
          const confirmedFormatted = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })

          sendEmail({
            to: payment.student.parent.user.email,
            subject: `Payment confirmed — ${orderId} — Expert Guru`,
            react: PaymentConfirmed({
              parentName: payment.student.parent.user.firstName,
              studentName: `${payment.student.firstName} ${payment.student.lastName}`,
              orderRef: orderId,
              amount: amount,
              classesScheduled: classesConfirmed,
              confirmedAt: confirmedFormatted,
              dashboardUrl: `${appUrl}/parent`,
            }),
          }).catch((err) =>
            console.error("[CCAvenue] Confirmation email failed:", err)
          )
        }
      }

      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=success&order=${orderId}&amount=${amount}&classes=${classesConfirmed}`
        ),
        { status: 303 }
      )
    }

    // ═══════════════════════════════════════════════════════
    //  ABORTED (user cancelled on gateway page)
    // ═══════════════════════════════════════════════════════
    if (orderStatus === "Aborted") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          bankReference: `ABORTED|${trackingId}|${transDate}`,
        },
      })

      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=cancelled&order=${orderId}`
        ),
        { status: 303 }
      )
    }

        // ═══════════════════════════════════════════════════════
    //  FAILURE (gateway declined — keep retryable)
    // ═══════════════════════════════════════════════════════
    // Do NOT cancel classes or booking order. Parent can retry
    // from the Payments tab with a different card or wallet top-up.
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        bankReference: `FAILED|${trackingId}|${bankRefNo}|${response.failure_message || ""}`,
      },
    })

    // Notify parent about the failure (but don't cancel anything)
    if (payment.student.parent?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: payment.student.parent.user.id,
          type: "PAYMENT",
          title: "Payment Unsuccessful",
          message: `Your payment of $${amount} (Ref: ${orderId}) was not successful: ${response.failure_message || "Card declined"}. Your booking is still reserved — you can retry from the Payments tab.`,
        },
      })
    }

    return NextResponse.redirect(
      new URL(
        `${appUrl}/parent/payment-status?status=failed&order=${orderId}&message=${encodeURIComponent(response.failure_message || "Payment failed")}`
      ),
      { status: 303 }
    )

  } catch (error) {
    console.error("[CCAvenue Callback] Error:", error)
    return NextResponse.redirect(
      new URL(
        `${appUrl}/parent/payment-status?status=error&message=processing-error`
      ),
      { status: 303 }
    )
  }
}
