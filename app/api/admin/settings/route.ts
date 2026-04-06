import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — fetch current platform settings
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Upsert ensures the singleton row exists
  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  })

  return NextResponse.json({
    settings: {
      ...settings,
      teacherNoShowRatingHit: Number(settings.teacherNoShowRatingHit),
    },
  })
}

// PATCH — update specific settings fields
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { tab, ...fields } = body

  if (!tab) {
    return NextResponse.json({ error: "Tab identifier is required" }, { status: 400 })
  }

  // Whitelist fields per tab to prevent accidental overwrites
  const allowed: Record<string, string[]> = {
    general: ["platformName", "supportEmail", "supportPhone", "defaultTimezone", "currency"],
    cancellation: [
      "studentFreeWindow", "lateCancelPenalty", "noShowPenalty",
      "teacherMaxCancellations", "teacherNoShowRatingHit",
      "rescheduleWindowHours", "rescheduleLateFeePercent", "rescheduleHardCutoffHours",
      "cancelFreeWindowHours", "cancelLateFeePercent", "cancelHardCutoffHours",
      "cancelHardCutoffFeePercent", "maxReschedulesPerClass",
    ],
    packages: ["trialClassEnabled", "lowBalanceThreshold"],
    users: ["minPasswordLength", "passwordResetExpiry", "maxLoginAttempts", "lockoutDuration"],
  }

  const tabAllowed = allowed[tab]
  if (!tabAllowed) {
    return NextResponse.json({ error: "Invalid tab" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  for (const key of tabAllowed) {
    if (fields[key] !== undefined) {
      data[key] = fields[key]
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const updated = await prisma.platformSettings.update({
    where: { id: "default" },
    data,
  })

  return NextResponse.json({
    message: "Settings updated successfully",
    settings: {
      ...updated,
      teacherNoShowRatingHit: Number(updated.teacherNoShowRatingHit),
    },
  })
}
