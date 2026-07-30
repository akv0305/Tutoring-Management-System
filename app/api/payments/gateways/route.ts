// app/api/payments/gateways/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    })

    // Defaults: CCAvenue enabled, PayPal disabled
    const ccavenueEnabled = settings?.paymentGatewayCcavenue ?? true
    const paypalEnabled = settings?.paymentGatewayPaypal ?? false
    const defaultGateway = settings?.defaultPaymentGateway ?? "CCAVENUE"

    const gateways: string[] = []
    if (ccavenueEnabled) gateways.push("CCAVENUE")
    if (paypalEnabled) gateways.push("PAYPAL")

    // Ensure at least one gateway
    if (gateways.length === 0) gateways.push("CCAVENUE")

    // Ensure default is valid
    const resolvedDefault = gateways.includes(defaultGateway)
      ? defaultGateway
      : gateways[0]

    return NextResponse.json({
      gateways,
      default: resolvedDefault,
    })
  } catch (error) {
    console.error("[Gateways API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch gateways" },
      { status: 500 }
    )
  }
}
