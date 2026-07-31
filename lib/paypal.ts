// lib/paypal.ts

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ""
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ""
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"

const PAYPAL_BASE_URL =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

export async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64")

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error("[PayPal] Token error:", res.status, errorBody)
    throw new Error(`PayPal token error: ${res.status}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function createPayPalOrder(params: {
  amount: string
  currency: string
  orderRef: string
  paymentId: string
  bookingOrderId: string
  returnUrl?: string
  cancelUrl?: string
}): Promise<{ id: string; approvalUrl: string }> {
  const token = await getPayPalAccessToken()
  const appUrl = process.env.NEXTAUTH_URL || ""

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderRef,
          custom_id: `${params.paymentId}|${params.bookingOrderId}`,
          amount: {
            currency_code: params.currency,
            value: params.amount,
          },
          description: `Expert Guru — ${params.orderRef}`,
        },
      ],
      application_context: {
        brand_name: "Expert Guru",
        return_url: params.returnUrl || `${appUrl}/api/payments/paypal/capture`,
        cancel_url: params.cancelUrl || `${appUrl}/api/payments/paypal/cancel`,
        user_action: "PAY_NOW",
        landing_page: "LOGIN",
      },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error("[PayPal] Create order error:", res.status, errorBody)
    throw new Error(`PayPal create order error: ${res.status}`)
  }

  const data = await res.json()
  const approvalLink = data.links?.find(
    (l: { rel: string; href: string }) => l.rel === "approve"
  )

  if (!approvalLink) {
    throw new Error("No PayPal approval link found in response")
  }

  return { id: data.id, approvalUrl: approvalLink.href }
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  status: string
  captureId: string
  payerEmail: string
  amount: string
  customId: string
}> {
  const token = await getPayPalAccessToken()

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!res.ok) {
    const errorBody = await res.text()
    console.error("[PayPal] Capture error:", res.status, errorBody)
    throw new Error(`PayPal capture error: ${res.status}`)
  }

  const data = await res.json()
  const capture =
    data.purchase_units?.[0]?.payments?.captures?.[0]

  const customId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ||
    data.purchase_units?.[0]?.custom_id ||
    ""

  return {
    status: data.status, // "COMPLETED" on success
    captureId: capture?.id || "",
    payerEmail: data.payer?.email_address || "",
    amount:
      capture?.amount?.value ||
      data.purchase_units?.[0]?.amount?.value ||
      "",
    customId,
  }
}

export async function getPayPalOrderDetails(paypalOrderId: string): Promise<{
  status: string
  customId: string
}> {
  const token = await getPayPalAccessToken()

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!res.ok) {
    const errorBody = await res.text()
    console.error("[PayPal] Get order error:", res.status, errorBody)
    throw new Error(`PayPal get order error: ${res.status}`)
  }

  const data = await res.json()

  return {
    status: data.status,
    customId: data.purchase_units?.[0]?.custom_id || "",
  }
}

export { PAYPAL_CLIENT_ID, PAYPAL_BASE_URL, PAYPAL_MODE }
