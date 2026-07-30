// app/api/payments/paypal/cancel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPayPalOrderDetails } from "@/lib/paypal"

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || ""

  try {
    const { searchParams } = new URL(req.url)
    const paypalOrderId = searchParams.get("token")

    if (!paypalOrderId) {
      return NextResponse.redirect(
        new URL(`${appUrl}/parent/payment-status?status=cancelled`),
        { status: 303 }
      )
    }

    console.log(`[PayPal Cancel] User cancelled order: ${paypalOrderId}`)

    // Try to get order details to find our payment
    try {
      const orderDetails = await getPayPalOrderDetails(paypalOrderId)
      const [paymentId] = (orderDetails.customId || "").split("|")

      if (paymentId) {
        // Update bankReference but keep payment as PENDING (mirrors CCAvenue Aborted)
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            bankReference: `PAYPAL_CANCELLED|${paypalOrderId}`,
          },
        })
      }
    } catch (detailsError) {
      // If we can't get details, try finding by bankReference
      console.error("[PayPal Cancel] Could not get order details:", detailsError)

      const payment = await prisma.payment.findFirst({
        where: {
          bankReference: `PAYPAL_INITIATED_${paypalOrderId}`,
        },
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            bankReference: `PAYPAL_CANCELLED|${paypalOrderId}`,
          },
        })
      }
    }

    return NextResponse.redirect(
      new URL(`${appUrl}/parent/payment-status?status=cancelled`),
      { status: 303 }
    )
  } catch (error) {
    console.error("[PayPal Cancel] Error:", error)
    return NextResponse.redirect(
      new URL(`${appUrl}/parent/payment-status?status=cancelled`),
      { status: 303 }
    )
  }
}
