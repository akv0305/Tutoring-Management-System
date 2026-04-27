// app/api/payments/ccavenue/test/route.ts  (DELETE AFTER TESTING)
import { NextResponse } from "next/server"
import { encrypt, buildOrderString, CCAVENUE_MERCHANT_ID, CCAVENUE_ACCESS_CODE } from "@/lib/ccavenue"

export async function GET() {
  const testParams: Record<string, string> = {
    merchant_id: CCAVENUE_MERCHANT_ID,
    order_id: `TEST_${Date.now()}`,
    currency: "INR",
    amount: "1.00",
    redirect_url: `${process.env.NEXTAUTH_URL}/api/payments/ccavenue/callback`,
    cancel_url: `${process.env.NEXTAUTH_URL}/api/payments/ccavenue/callback`,
    language: "EN",
    billing_name: "Test User",
    billing_email: "test@expertguru.net",
    billing_tel: "9999999999",
    billing_address: "Test",
    billing_city: "Mumbai",
    billing_state: "MH",
    billing_zip: "400001",
    billing_country: "India",
  }

  const orderString = buildOrderString(testParams)
  const encRequest = encrypt(orderString)

  const mode = process.env.CCAVENUE_MODE || "test"
  const ccavenueUrl = mode === "production"
    ? "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    : "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"

  // Return an auto-submitting form for manual testing
  const html = `<!DOCTYPE html>
<html><head><title>CCAvenue Test</title></head>
<body>
  <h2>CCAvenue Integration Test</h2>
  <p><strong>Mode:</strong> ${mode}</p>
  <p><strong>Merchant ID:</strong> ${CCAVENUE_MERCHANT_ID}</p>
  <p><strong>Access Code:</strong> ${CCAVENUE_ACCESS_CODE.substring(0, 4)}...${CCAVENUE_ACCESS_CODE.substring(CCAVENUE_ACCESS_CODE.length - 4)}</p>
  <p><strong>Working Key:</strong> (${process.env.CCAVENUE_WORKING_KEY?.length || 0} chars)</p>
  <p><strong>Target URL:</strong> ${ccavenueUrl}</p>
  <p><strong>Order String:</strong><br><code style="word-break:break-all">${orderString}</code></p>
  <p><strong>encRequest:</strong><br><code style="word-break:break-all">${encRequest}</code></p>
  <hr>
  <p>Click to submit to CCAvenue:</p>
  <form method="POST" action="${ccavenueUrl}">
    <input type="hidden" name="encRequest" value="${encRequest}" />
    <input type="hidden" name="access_code" value="${CCAVENUE_ACCESS_CODE}" />
    <button type="submit" style="padding:10px 20px;font-size:16px;cursor:pointer;">
      Submit to CCAvenue (${mode})
    </button>
  </form>
</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  })
}
