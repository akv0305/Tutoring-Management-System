import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || "Expert Guru <noreply@expertguru.net>"

// ── Cached global CC address (5-minute TTL) ──
let cachedCc: string | null = null
let cachedCcAt = 0
const CC_TTL = 5 * 60 * 1000 // 5 minutes

async function getGlobalCc(): Promise<string | null> {
  const now = Date.now()
  if (cachedCc !== null && now - cachedCcAt < CC_TTL) return cachedCc || null
  // If cache is empty string from a previous fetch, and TTL hasn't expired, skip
  if (cachedCcAt > 0 && now - cachedCcAt < CC_TTL) return cachedCc || null

  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { emailCcAddress: true },
    })
    cachedCc = settings?.emailCcAddress?.trim() || ""
    cachedCcAt = now
    return cachedCc || null
  } catch (err) {
    console.error("[Email] Failed to fetch global CC:", err)
    return cachedCc || null
  }
}

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
  // Merge caller-provided CC with global CC from platform settings
  const globalCc = await getGlobalCc()
  const toArray = Array.isArray(to) ? to : [to]
  let mergedCc: string[] = []

  if (cc) {
    mergedCc = Array.isArray(cc) ? [...cc] : [cc]
  }
  if (globalCc) {
    mergedCc.push(globalCc)
  }

  // Remove duplicates and exclude any address that's already a "to" recipient
  const toSet = new Set(toArray.map((a) => a.toLowerCase()))
  mergedCc = [...new Set(mergedCc.map((a) => a.trim()).filter((a) => a && !toSet.has(a.toLowerCase())))]

  const finalCc = mergedCc.length > 0 ? mergedCc : undefined

  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email send")
    console.log(`[Email] Would have sent to: ${to}, cc: ${finalCc || "none"}, subject: "${subject}"`)
    await logEmail(to, finalCc, subject, "skipped", "dev-skipped")
    return { success: true, messageId: "dev-skipped" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: toArray,
      cc: finalCc,
      subject,
      react,
      replyTo: replyTo || "info@expertguru.net",
    })

    if (error) {
      console.error("[Email] Send failed:", error)
      await logEmail(to, finalCc, subject, "failed", undefined, JSON.stringify(error))
      return { success: false, error }
    }

    await logEmail(to, finalCc, subject, "sent", data?.id)
    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error("[Email] Unexpected error:", err)
    await logEmail(
      to,
      finalCc,
      subject,
      "failed",
      undefined,
      err instanceof Error ? err.message : String(err)
    )
    return { success: false, error: err }
  }
}