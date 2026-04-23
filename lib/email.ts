import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = "Expert Guru <noreply@expertguru.net>"

type SendEmailParams = {
  to: string | string[]
  cc?: string | string[]
  subject: string
  react: React.ReactElement
  replyTo?: string
}

type SendEmailResult = {
  success: boolean
  messageId?: string
  error?: unknown
}

async function logEmail(
  to: string | string[],
  cc: string | string[] | undefined,
  subject: string,
  status: "sent" | "failed" | "skipped",
  messageId?: string,
  error?: string
) {
  try {
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(to) ? to.join(", ") : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : null,
        subject,
        status,
        messageId: messageId || null,
        error: error || null,
      },
    })
  } catch (logErr) {
    console.error("[Email] Failed to write email log:", logErr)
  }
}

export async function sendEmail({
  to,
  cc,
  subject,
  react,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email send")
    console.log(`[Email] Would have sent to: ${to}, subject: "${subject}"`)
    await logEmail(to, cc, subject, "skipped", "dev-skipped")
    return { success: true, messageId: "dev-skipped" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      subject,
      react,
      replyTo: replyTo || "info@expertguru.net",
    })

    if (error) {
      console.error("[Email] Send failed:", error)
      await logEmail(to, cc, subject, "failed", undefined, JSON.stringify(error))
      return { success: false, error }
    }

    await logEmail(to, cc, subject, "sent", data?.id)
    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error("[Email] Unexpected error:", err)
    await logEmail(
      to,
      cc,
      subject,
      "failed",
      undefined,
      err instanceof Error ? err.message : String(err)
    )
    return { success: false, error: err }
  }
}
