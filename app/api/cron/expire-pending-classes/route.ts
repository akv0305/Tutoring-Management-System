import { NextRequest, NextResponse } from "next/server"
import { expirePendingClasses } from "@/lib/expire-pending-classes"

// Ensure this route is not statically cached
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // ── Auth: accept secret via query param OR header ──
  const secret = process.env.CRON_SECRET
  if (secret) {
    const { searchParams } = new URL(req.url)
    const querySecret = searchParams.get("secret")
    const headerAuth = req.headers.get("authorization")

    const isValidQuery = querySecret === secret
    const isValidHeader = headerAuth === `Bearer ${secret}`

    if (!isValidQuery && !isValidHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await expirePendingClasses()
    console.log("[Cron] expire-pending-classes result:", result)
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] expire-pending-classes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
