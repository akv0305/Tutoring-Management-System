// app/api/payments/paypal/create-order/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPayPalOrder } from "@/lib/paypal"

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
    const paymentId = body.paymentId as string

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      )
    }

    // Fetch the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
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

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending payments can be processed" },
        { status: 400 }
      )
    }

    // Verify parent ownership
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

    // Find the booking order
    const bookingOrder = await prisma.bookingOrder.findUnique({
      where: { paymentId: payment.id },
    })

    const orderRef = bookingOrder?.orderRef || payment.id
    const amount = Number(payment.amount).toFixed(2)

    // Create PayPal order
    const paypalOrder = await createPayPalOrder({
      amount,
      currency: "USD",
      orderRef,
      paymentId: payment.id,
      bookingOrderId: bookingOrder?.id || "",
    })

    // Update payment to mark PayPal initiation
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        method: "PAYPAL",
        bankReference: `PAYPAL_INITIATED_${paypalOrder.id}`,
      },
    })

    console.log(
      `[PayPal] Order created: ${paypalOrder.id} for payment ${payment.id}`
    )

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      approvalUrl: paypalOrder.approvalUrl,
    })
  } catch (error) {
    console.error("[PayPal Create Order] Error:", error)
    return NextResponse.json(
      { error: "Failed to create PayPal order" },
      { status: 500 }
    )
  }
}
