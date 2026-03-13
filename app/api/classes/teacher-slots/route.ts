import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const teacherId = new URL(req.url).searchParams.get("teacherId")
    if (!teacherId) return NextResponse.json({ error: "teacherId required" }, { status: 400 })

    const now = new Date()
    const fourWeeks = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

    const [availability, bookedClasses, blockedDates] = await Promise.all([
      prisma.teacherAvailability.findMany({
        where: { teacherId, isEnabled: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      }),
      prisma.class.findMany({
        where: { teacherId, status: { in: ["SCHEDULED", "CONFIRMED"] }, scheduledAt: { gte: now, lte: fourWeeks } },
        select: { scheduledAt: true, duration: true },
      }),
      prisma.teacherBlockedDate.findMany({
        where: { teacherId, blockedDate: { gte: now } },
        select: { blockedDate: true },
      }),
    ])

    return NextResponse.json({
      availability: availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })),
      bookedSlots: bookedClasses.map((c) => ({ start: c.scheduledAt.toISOString(), duration: c.duration })),
      blockedDates: blockedDates.map((b) => b.blockedDate.toISOString().split("T")[0]),
    })
  } catch (error) {
    console.error("GET /api/classes/teacher-slots error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
