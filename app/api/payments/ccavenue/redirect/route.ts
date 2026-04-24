import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  encrypt,
  buildOrderString,
  CCAVENUE_MERCHANT_ID,
  CCAVENUE_ACCESS_CODE,
} from "@/lib/ccavenue"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!["PARENT", "ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const formData = await req.formData()
    const paymentId = formData.get("paymentId") as string

    if (!paymentId) {
      return new NextResponse("paymentId is required", { status: 400 })
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
      return new NextResponse("Payment not found", { status: 404 })
    }

    if (payment.status !== "PENDING") {
      return new NextResponse("Only pending payments can be processed", { status: 400 })
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
        return new NextResponse("Forbidden", { status: 403 })
      }
    }

    // Find the booking order
    const bookingOrder = await prisma.bookingOrder.findUnique({
      where: { paymentId: payment.id },
    })

    const appUrl = process.env.NEXTAUTH_URL || ""
    const parentUser = payment.student.parent?.user
    const orderRef = bookingOrder?.orderRef || payment.id

    // Build CCAvenue order parameters
    const orderParams: Record<string, string> = {
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

    const orderString = buildOrderString(orderParams)
    const encRequest = encrypt(orderString)

    // Update payment to mark CCAvenue initiation
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        method: "CCAVENUE",
        bankReference: `CCAV_INITIATED_${orderRef}`,
      },
    })

    // Determine CCAvenue URL
    const ccavenueMode = process.env.CCAVENUE_MODE || "test"
    const ccavenueUrl =
      ccavenueMode === "production"
        ? "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
        : "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"

    // Return an HTML page with an auto-submitting form
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to payment gateway...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #1e293b;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #0d9488;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Redirecting to CCAvenue...</h2>
    <p>Please wait while we connect you to the secure payment gateway.</p>
    <p style="font-size:0.75rem;color:#94a3b8;">Order Ref: ${orderRef}</p>
  </div>
  <form id="ccavenue_form" method="POST" action="${ccavenueUrl}">
    <input type="hidden" name="encRequest" value="${encRequest}" />
    <input type="hidden" name="access_code" value="${CCAVENUE_ACCESS_CODE}" />
  </form>
  <script>document.getElementById('ccavenue_form').submit();</script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    console.error("CCAvenue redirect error:", error)
    return new NextResponse(
      `<html><body><h2>Error</h2><p>Failed to initiate payment. <a href="/parent/payments">Go back</a></p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    )
  }
}
