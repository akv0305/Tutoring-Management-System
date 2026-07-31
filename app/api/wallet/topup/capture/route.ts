import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { capturePayPalOrder } from "@/lib/paypal"

// GET /api/wallet/topup/capture?token=PAYPAL_ORDER_ID&orderRef=...&amount=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const paypalOrderId = searchParams.get("token") || ""
    const orderRef = searchParams.get("orderRef") || ""
    const amount = parseFloat(searchParams.get("amount") || "0")

    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (!paypalOrderId || !amount) {
      return NextResponse.redirect(
        new URL("/parent/wallet?topup=failed&reason=missing_params", req.url)
      )
    }

    // Capture the PayPal order
    const capture = await capturePayPalOrder(paypalOrderId)

    if (capture.status !== "COMPLETED") {
      return NextResponse.redirect(
        new URL("/parent/wallet?topup=failed&reason=payment_not_completed", req.url)
      )
    }

    // Find parent profile and wallet
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!parentProfile) {
      return NextResponse.redirect(
        new URL("/parent/wallet?topup=failed&reason=profile_not_found", req.url)
      )
    }

    // Credit wallet in a transaction
    await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: { parentProfileId: parentProfile.id },
      })

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { parentProfileId: parentProfile.id, balance: 0 },
        })
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "SELF_TOP_UP",
          description: `Wallet top-up via PayPal - ${orderRef}`,
          referenceId: `PAYPAL-${capture.captureId || paypalOrderId}`,
        },
      })

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      })

      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: "SYSTEM",
          title: "Wallet Top-Up Successful",
          message: `$${amount.toFixed(2)} has been added to your wallet via PayPal.`,
        },
      })
    })

    return NextResponse.redirect(
      new URL(`/parent/wallet?topup=success&amount=${amount.toFixed(2)}`, req.url)
    )
  } catch (error) {
    console.error("GET /api/wallet/topup/capture error:", error)
    return NextResponse.redirect(
      new URL("/parent/wallet?topup=failed&reason=server_error", req.url)
    )
  }
}
