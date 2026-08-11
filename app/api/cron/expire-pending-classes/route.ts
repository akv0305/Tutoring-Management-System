import { NextRequest, NextResponse } from "next/server"
import { expirePendingClasses } from "@/lib/expire-pending-classes"

export async function GET(req: NextRequest) {
  // Validate cron secret
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await expirePendingClasses()
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
