import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPayPalOrder } from "@/lib/paypal"

// POST /api/wallet/topup
// Body: { amount: number, gateway: "PAYPAL" | "CCAVENUE" }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount, gateway } = body

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Get platform settings for min amount
    const settings = await prisma.platformSettings.findFirst()
    const minAmount = settings && "walletTopupMinAmount" in settings
      ? Number(settings.walletTopupMinAmount)
      : 15
    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Minimum top-up amount is $${minAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Get parent profile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    })

    if (!parentProfile) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    const orderRef = `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const appUrl = process.env.NEXTAUTH_URL || ""

    if (gateway === "PAYPAL") {
      const result = await createPayPalOrder({
        amount: amount.toFixed(2),
        currency: "USD",
        orderRef,
        paymentId: `topup_${orderRef}`,
        bookingOrderId: `topup_${orderRef}`,
        returnUrl: `${appUrl}/api/wallet/topup/capture?orderRef=${orderRef}&amount=${amount}`,
        cancelUrl: `${appUrl}/api/wallet/topup/cancel?orderRef=${orderRef}`,
      })

      return NextResponse.json({
        approvalUrl: result.approvalUrl,
        paypalOrderId: result.id,
        orderRef,
      })
    }

    if (gateway === "CCAVENUE") {
      return NextResponse.json({
        redirectUrl: "/api/payments/ccavenue/redirect",
        formFields: {
          paymentId: `topup_${orderRef}`,
          amount: amount.toFixed(2),
          isTopup: "true",
        },
      })
    }

    return NextResponse.json({ error: "Unsupported gateway" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/wallet/topup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
