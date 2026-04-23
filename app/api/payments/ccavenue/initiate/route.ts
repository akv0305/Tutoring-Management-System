import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  encrypt,
  buildOrderString,
  buildPaymentUrl,
  CCAVENUE_MERCHANT_ID,
} from "@/lib/ccavenue"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["PARENT", "ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      )
    }

    // Fetch the payment with related data
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        package: {
          select: { name: true },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending payments can be processed via CCAvenue" },
        { status: 400 }
      )
    }

    // Verify the parent owns this student (if role is PARENT)
    if (session.user.role === "PARENT") {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (
        !parentProfile ||
        !parentProfile.students.some((s) => s.id === payment.studentId)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Find the booking order for order reference
    const bookingOrder = await prisma.bookingOrder.findUnique({
      where: { paymentId: payment.id },
    })

    const appUrl = process.env.NEXTAUTH_URL || ""
    const parentUser = payment.student.parent?.user
    const orderRef = bookingOrder?.orderRef || payment.id

    // ── Deduplication: prevent double-initiation within 5 minutes ──
    if (
      payment.method === "CCAVENUE" &&
      payment.bankReference?.startsWith("CCAV_INITIATED_")
    ) {
      const initiatedAgo = Date.now() - new Date(payment.updatedAt).getTime()
      if (initiatedAgo < 5 * 60 * 1000) {
        // Re-build the payment URL (CCAvenue will resume the session for the same order_id)
        const dedupeParams: Record<string, string> = {
          merchant_id: CCAVENUE_MERCHANT_ID,
          order_id: orderRef,
          currency: "INR",
          amount: Number(payment.amount).toFixed(2),
          redirect_url: `${appUrl}/api/payments/ccavenue/callback`,
          cancel_url: `${appUrl}/api/payments/ccavenue/callback`,
          language: "EN",
          billing_name: parentUser
            ? `${parentUser.firstName} ${parentUser.lastName}`
            : "",
          billing_email: parentUser?.email || "",
          billing_tel: parentUser?.phone || "",
          billing_address: "",
          billing_city: "",
          billing_state: "",
          billing_zip: "",
          billing_country: "India",
          merchant_param1: payment.id,
          merchant_param2: bookingOrder?.id || "",
          merchant_param3: payment.studentId,
          merchant_param4: session.user.id,
          merchant_param5: payment.package?.name || "Direct Payment",
        }

        const dedupeOrderString = buildOrderString(dedupeParams)
        const dedupeEncRequest = encrypt(dedupeOrderString)
        const dedupePaymentUrl = buildPaymentUrl(dedupeEncRequest)

        return NextResponse.json({ paymentUrl: dedupePaymentUrl, orderRef })
      }
    }

    // Determine currency — default INR, can be extended later
    const currency = "INR"

    // Build CCAvenue order parameters
    const orderParams: Record<string, string> = {
      merchant_id: CCAVENUE_MERCHANT_ID,
      order_id: orderRef,
      currency: currency,
      amount: Number(payment.amount).toFixed(2),
      redirect_url: `${appUrl}/api/payments/ccavenue/callback`,
      cancel_url: `${appUrl}/api/payments/ccavenue/callback`,
      language: "EN",
      // Billing details
      billing_name: parentUser
        ? `${parentUser.firstName} ${parentUser.lastName}`
        : "",
      billing_email: parentUser?.email || "",
      billing_tel: parentUser?.phone || "",
      billing_address: "",
      billing_city: "",
      billing_state: "",
      billing_zip: "",
      billing_country: "India",
      // Custom parameters to identify our records
      merchant_param1: payment.id,       // paymentId
      merchant_param2: bookingOrder?.id || "", // bookingOrderId
      merchant_param3: payment.studentId, // studentId
      merchant_param4: session.user.id,   // userId who initiated
      merchant_param5: payment.package?.name || "Direct Payment", // package name for reference
    }

    const orderString = buildOrderString(orderParams)
    const encRequest = encrypt(orderString)
    const paymentUrl = buildPaymentUrl(encRequest)

    // Update payment method to indicate CCAvenue was initiated
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        method: "CCAVENUE",
        bankReference: `CCAV_INITIATED_${orderRef}`,
      },
    })

    return NextResponse.json({
      paymentUrl,
      orderRef,
    })
  } catch (error) {
    console.error("CCAvenue initiate error:", error)
    return NextResponse.json(
      { error: "Failed to initiate payment. Please try again." },
      { status: 500 }
    )
  }
}
