import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { evaluateReschedulePolicy, evaluateCancelPolicy } from "@/lib/policyEngine"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")
    const action = searchParams.get("action") // "reschedule" or "cancel"

    if (!classId || !action) {
      return NextResponse.json({ error: "classId and action are required" }, { status: 400 })
    }

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: { package: { select: { pricePerClass: true } } },
    })
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const settings = await prisma.platformSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ error: "Platform settings not found" }, { status: 500 })
    }

    const now = new Date()
    const pricePerClass = cls.package ? Number(cls.package.pricePerClass) : 0

    if (action === "reschedule") {
      const result = evaluateReschedulePolicy(cls.scheduledAt, now, cls.rescheduleCount, settings)
      const feeAmount = pricePerClass > 0 ? (pricePerClass * result.feePercent) / 100 : 0
      return NextResponse.json({
        ...result,
        feeAmount: Math.round(feeAmount * 100) / 100,
        pricePerClass,
        rescheduleCount: cls.rescheduleCount,
        maxReschedules: settings.maxReschedulesPerClass,
        hoursUntilClass: Math.max(0, (cls.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)),
      })
    }

    if (action === "cancel") {
      const result = evaluateCancelPolicy(cls.scheduledAt, now, settings)
      const feeAmount = pricePerClass > 0 ? (pricePerClass * result.feePercent) / 100 : 0
      return NextResponse.json({
        ...result,
        feeAmount: Math.round(feeAmount * 100) / 100,
        pricePerClass,
        hoursUntilClass: Math.max(0, (cls.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)),
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("GET /api/classes/policy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
