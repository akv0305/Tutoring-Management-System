import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt, parseResponseString } from "@/lib/ccavenue"
import { sendEmail } from "@/lib/email"
import PaymentConfirmed from "@/emails/payment-confirmed"
import PaymentRejected from "@/emails/payment-rejected"

export async function POST(req: NextRequest) {
  try {
    // CCAvenue sends form-urlencoded data with encResp field
    const formData = await req.formData()
    const encResp = formData.get("encResp") as string

    if (!encResp) {
      console.error("[CCAvenue Callback] No encResp received")
      return NextResponse.redirect(
        new URL("/parent/payment-status?status=error&message=no-response", req.url)
      )
    }

    // Decrypt the response
    const decryptedString = decrypt(encResp)
    const response = parseResponseString(decryptedString)

    console.log("[CCAvenue Callback] Order status:", response.order_status)
    console.log("[CCAvenue Callback] Order ID:", response.order_id)
    console.log("[CCAvenue Callback] Tracking ID:", response.tracking_id)

    // Extract our custom params
    const paymentId = response.merchant_param1
    const bookingOrderId = response.merchant_param2
    const studentId = response.merchant_param3
    const orderStatus = response.order_status // "Success", "Failure", "Aborted", "Invalid"
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
        new URL("/parent/payment-status?status=error&message=invalid-payment", req.url)
      )
    }

    // Fetch payment to verify it exists
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
        new URL("/parent/payment-status?status=error&message=payment-not-found", req.url)
      )
    }

    // Prevent double-processing
    if (payment.status === "CONFIRMED") {
      return NextResponse.redirect(
        new URL(
          `/parent/payment-status?status=already-confirmed&order=${orderId}`,
          req.url
        )
      )
    }

    const appUrl = process.env.NEXTAUTH_URL || ""

    if (orderStatus === "Success") {
      // ─── PAYMENT SUCCESSFUL ───

      // Update payment status
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

      // Update booking order and classes if exists
      if (bookingOrderId) {
        const bookingOrder = await prisma.bookingOrder.findUnique({
          where: { id: bookingOrderId },
        })

        if (bookingOrder) {
          // Update BookingOrder status to PAID
          await prisma.bookingOrder.update({
            where: { id: bookingOrder.id },
            data: { status: "PAID" },
          })

          // Update all PENDING_PAYMENT classes to SCHEDULED
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

      // Send notification to parent
      if (payment.student.parent?.user) {
        await prisma.notification.create({
          data: {
            userId: payment.student.parent.user.id,
            type: "PAYMENT",
            title: "Payment Confirmed — Classes Scheduled",
            message: `Your payment of $${amount} (Ref: ${orderId}) via CCAvenue has been confirmed. ${classesConfirmed} class${classesConfirmed > 1 ? "es are" : " is"} now scheduled.`,
          },
        })

        // Send confirmation email
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
          `/parent/payment-status?status=success&order=${orderId}&amount=${amount}&classes=${classesConfirmed}`,
          req.url
        )
      )
    } else if (orderStatus === "Aborted") {
      // ─── PAYMENT CANCELLED BY USER ───

      // Keep payment as PENDING so user can retry
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          bankReference: `ABORTED|${trackingId}|${transDate}`,
        },
      })

      return NextResponse.redirect(
        new URL(
          `/parent/payment-status?status=cancelled&order=${orderId}`,
          req.url
        )
      )
    } else {
      // ─── PAYMENT FAILED ("Failure" or "Invalid") ───

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          method: "CCAVENUE",
          bankReference: `${orderStatus}|${trackingId}|${bankRefNo}|${response.failure_message || ""}`,
        },
      })

      // Cancel booking order and classes
      let classesCancelled = 0

      if (bookingOrderId) {
        const bookingOrder = await prisma.bookingOrder.findUnique({
          where: { id: bookingOrderId },
        })

        if (bookingOrder) {
          await prisma.bookingOrder.update({
            where: { id: bookingOrder.id },
            data: { status: "CANCELLED" },
          })

          const result = await prisma.class.updateMany({
            where: {
              bookingOrderId: bookingOrder.id,
              status: "PENDING_PAYMENT",
            },
            data: {
              status: "CANCELLED_STUDENT",
              cancelledAt: new Date(),
              cancelReason: `Payment failed via CCAvenue: ${response.failure_message || orderStatus}`,
            },
          })

          classesCancelled = result.count
        }
      }

      // Send notification to parent
      if (payment.student.parent?.user) {
        await prisma.notification.create({
          data: {
            userId: payment.student.parent.user.id,
            type: "PAYMENT",
            title: "Payment Failed",
            message: `Your payment of $${amount} (Ref: ${orderId}) was not successful. ${classesCancelled > 0 ? `${classesCancelled} class${classesCancelled > 1 ? "es have" : " has"} been cancelled.` : ""} You can retry from your dashboard.`,
          },
        })

        // Send rejection email
        if (payment.student.parent.user.email) {
          sendEmail({
            to: payment.student.parent.user.email,
            subject: `Payment update — ${orderId} — Expert Guru`,
            react: PaymentRejected({
              parentName: payment.student.parent.user.firstName,
              studentName: `${payment.student.firstName} ${payment.student.lastName}`,
              orderRef: orderId,
              amount: amount,
              classesCancelled: classesCancelled,
              reason: response.failure_message || "Payment was not completed",
              dashboardUrl: `${appUrl}/parent`,
            }),
          }).catch((err) =>
            console.error("[CCAvenue] Rejection email failed:", err)
          )
        }
      }

      return NextResponse.redirect(
        new URL(
          `/parent/payment-status?status=failed&order=${orderId}&message=${encodeURIComponent(response.failure_message || "Payment failed")}`,
          req.url
        )
      )
    }
  } catch (error) {
    console.error("[CCAvenue Callback] Error:", error)
    return NextResponse.redirect(
      new URL("/parent/payment-status?status=error&message=processing-error", req.url)
    )
  }
}
