// app/api/payments/paypal/capture/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { capturePayPalOrder } from "@/lib/paypal"
import { sendEmail } from "@/lib/email"
import PaymentConfirmed from "@/emails/payment-confirmed"

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || ""

  try {
    const { searchParams } = new URL(req.url)
    const paypalOrderId = searchParams.get("token") // PayPal sends order ID as "token"

    if (!paypalOrderId) {
      console.error("[PayPal Capture] No token in query params")
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=error&message=no-token`
        ),
        { status: 303 }
      )
    }

    console.log(`[PayPal Capture] Capturing order: ${paypalOrderId}`)

    // Capture the payment
    let captureResult
    try {
      captureResult = await capturePayPalOrder(paypalOrderId)
    } catch (captureError) {
      console.error("[PayPal Capture] Capture API failed:", captureError)

      // Find the payment via bankReference
      const payment = await prisma.payment.findFirst({
        where: {
          bankReference: `PAYPAL_INITIATED_${paypalOrderId}`,
        },
      })

      if (payment) {
        // Capture failed — keep as PENDING so parent can retry (mirrors CCAvenue Aborted)
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            bankReference: `PAYPAL_CAPTURE_FAILED_${paypalOrderId}`,
          },
        })
      }

      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=failed&message=${encodeURIComponent("Payment capture failed. You can retry from your dashboard.")}`
        ),
        { status: 303 }
      )
    }

    // Parse custom_id to get paymentId and bookingOrderId
    const [paymentId, bookingOrderId] = (captureResult.customId || "").split("|")

    if (!paymentId) {
      console.error("[PayPal Capture] No paymentId in custom_id:", captureResult.customId)
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
      console.error("[PayPal Capture] Payment not found:", paymentId)
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=error&message=payment-not-found`
        ),
        { status: 303 }
      )
    }

    if (payment.status === "CONFIRMED") {
      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=already-confirmed`
        ),
        { status: 303 }
      )
    }

    const amount = captureResult.amount || Number(payment.amount).toFixed(2)

    // ─── SUCCESS ─────────────────────────────────────────
    if (captureResult.status === "COMPLETED") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "CONFIRMED",
          method: "PAYPAL",
          bankReference: `PAYPAL|${captureResult.captureId}|${captureResult.payerEmail}`,
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

      // Send notification + email (same as CCAvenue success)
      if (payment.student.parent?.user) {
        const parentUser = payment.student.parent.user

        await prisma.notification.create({
          data: {
            userId: parentUser.id,
            type: "PAYMENT",
            title: "Payment Confirmed — Classes Scheduled",
            message: `Your payment of $${amount} via PayPal has been confirmed. ${classesConfirmed} class${classesConfirmed > 1 ? "es are" : " is"} now scheduled.`,
          },
        })

        if (parentUser.email) {
          const confirmedFormatted = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })

          sendEmail({
            to: parentUser.email,
            subject: `Payment confirmed — PayPal — Expert Guru`,
            react: PaymentConfirmed({
              parentName: parentUser.firstName,
              studentName: `${payment.student.firstName} ${payment.student.lastName}`,
              orderRef: paypalOrderId,
              amount: amount,
              classesScheduled: classesConfirmed,
              confirmedAt: confirmedFormatted,
              dashboardUrl: `${appUrl}/parent`,
            }),
          }).catch((err) =>
            console.error("[PayPal] Confirmation email failed:", err)
          )
        }
      }

      console.log(
        `[PayPal Capture] SUCCESS — Payment ${paymentId}, ${classesConfirmed} classes scheduled`
      )

      return NextResponse.redirect(
        new URL(
          `${appUrl}/parent/payment-status?status=success&order=${paypalOrderId}&amount=${amount}&classes=${classesConfirmed}`
        ),
        { status: 303 }
      )
    }

    // ─── NOT COMPLETED ───────────────────────────────────
    // Keep payment as PENDING so parent can retry (mirrors CCAvenue Aborted behavior)
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        bankReference: `PAYPAL_INCOMPLETE|${captureResult.status}|${paypalOrderId}`,
      },
    })

    console.log(
      `[PayPal Capture] Not completed — status: ${captureResult.status}, payment stays PENDING`
    )

    return NextResponse.redirect(
      new URL(
        `${appUrl}/parent/payment-status?status=failed&message=${encodeURIComponent("Payment was not completed. You can retry from your payments page.")}`
      ),
      { status: 303 }
    )
  } catch (error) {
    console.error("[PayPal Capture] Error:", error)
    return NextResponse.redirect(
      new URL(
        `${appUrl}/parent/payment-status?status=error&message=processing-error`
      ),
      { status: 303 }
    )
  }
}
