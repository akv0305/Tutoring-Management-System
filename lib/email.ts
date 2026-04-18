// lib/email.ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = "Expert Guru <noreply@expertguru.net>"

type SendEmailParams = {
  to: string | string[]
  subject: string
  react: React.ReactElement
  replyTo?: string
}

type SendEmailResult = {
  success: boolean
  messageId?: string
  error?: unknown
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  // Skip sending if API key is not configured (local dev without Resend)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email send")
    console.log(`[Email] Would have sent to: ${to}, subject: "${subject}"`)
    return { success: true, messageId: "dev-skipped" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo: replyTo || "info@expertguru.net",
    })

    if (error) {
      console.error("[Email] Send failed:", error)
      return { success: false, error }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error("[Email] Unexpected error:", err)
    return { success: false, error: err }
  }
}
