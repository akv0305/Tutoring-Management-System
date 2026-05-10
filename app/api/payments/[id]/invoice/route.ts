import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
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
        package: { select: { name: true } },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
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

    if (payment.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Invoice available only for confirmed payments" },
        { status: 400 }
      )
    }

    // Find booking order for order ref
    const bookingOrder = await prisma.bookingOrder.findUnique({
      where: { paymentId: payment.id },
    })

    // Count classes in this booking
    let classCount = 0
    if (bookingOrder) {
      classCount = await prisma.class.count({
        where: { bookingOrderId: bookingOrder.id },
      })
    }

    const parentUser = payment.student.parent?.user
    const parentName = parentUser
      ? `${parentUser.firstName} ${parentUser.lastName}`
      : "N/A"
    const studentName = `${payment.student.firstName} ${payment.student.lastName}`
    const orderRef = bookingOrder?.orderRef || payment.id.slice(-8).toUpperCase()
    const amount = Number(payment.amount).toFixed(2)
    const invoiceNumber = `INV-${payment.id.slice(-6).toUpperCase()}`
    const paidDate = payment.confirmedAt
      ? payment.confirmedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : payment.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

    const bankRef = payment.bankReference || "—"
    const paymentMethod = payment.method.replace(/_/g, " ")

    // Generate HTML invoice
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #f8fafc; }
    .invoice { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #1E3A5F; color: #fff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { font-size: 28px; font-weight: 700; }
    .header .brand { font-size: 14px; opacity: 0.8; margin-top: 4px; }
    .header .invoice-info { text-align: right; font-size: 14px; }
    .header .invoice-info .inv-num { font-size: 18px; font-weight: 600; }
    .body { padding: 32px 40px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .party { flex: 1; }
    .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; font-weight: 600; }
    .party p { font-size: 14px; line-height: 1.6; }
    .party .name { font-weight: 600; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f1f5f9; padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    tbody td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .text-right { text-align: right; }
    .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #1E3A5F; border-bottom: none; }
    .total-row .amount { color: #1E3A5F; font-size: 20px; }
    .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .payment-info h3 { font-size: 13px; font-weight: 600; color: #166534; margin-bottom: 8px; }
    .payment-info .row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
    .payment-info .label { color: #4ade80; }
    .payment-info .value { color: #166534; font-weight: 500; }
    .footer { text-align: center; padding: 24px 40px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; }
    .print-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: #1E3A5F; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 20px auto; }
    .print-btn:hover { background: #152d4a; }
    .actions { text-align: center; padding: 16px; }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="invoice">
    <div class="header">
      <div>
        <h1>INVOICE</h1>
        <div class="brand">Expert Guru — Tutoring Services</div>
      </div>
      <div class="invoice-info">
        <div class="inv-num">${invoiceNumber}</div>
        <div style="margin-top:4px;">Date: ${paidDate}</div>
        <div>Order Ref: ${orderRef}</div>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        <div class="party">
          <h3>Bill To</h3>
          <p class="name">${parentName}</p>
          <p>${parentUser?.email || ""}</p>
          <p>${parentUser?.phone || ""}</p>
        </div>
        <div class="party" style="text-align:right;">
          <h3>From</h3>
          <p class="name">Expert Guru</p>
          <p>app.expertguru.net</p>
          <p>support@expertguru.net</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Student</th>
            <th>Classes</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${payment.package?.name || "Direct Class Booking"}</td>
            <td>${studentName}</td>
            <td>${classCount || "—"}</td>
            <td class="text-right">$${amount}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" class="text-right">Total Paid</td>
            <td class="text-right amount">$${amount}</td>
          </tr>
        </tbody>
      </table>

      <div class="payment-info">
        <h3>✓ Payment Confirmed</h3>
        <div class="row"><span class="label">Method</span><span class="value">${paymentMethod}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${paidDate}</span></div>
        <div class="row"><span class="label">Reference</span><span class="value">${bankRef}</span></div>
      </div>
    </div>
    <div class="footer">
      Thank you for choosing Expert Guru. This is a computer-generated invoice and does not require a signature.
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    console.error("Invoice generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}
