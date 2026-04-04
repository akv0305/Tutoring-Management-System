import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ─── GET: Fetch teacher's availability + blocked dates ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

  const availabilities = await prisma.teacherAvailability.findMany({
    where: { teacherId: teacher.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  const blockedDates = await prisma.teacherBlockedDate.findMany({
    where: { teacherId: teacher.id },
    orderBy: { blockedDate: "asc" },
  })

  return NextResponse.json({
    availabilities: availabilities.map((a) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isEnabled: a.isEnabled,
    })),
    blockedDates: blockedDates.map((b) => ({
      id: b.id,
      date: b.blockedDate.toISOString().split("T")[0],
      reason: b.reason || "Unavailable",
    })),
    timezone: teacher.timezone,
  })
}

// ─── PUT: Save weekly schedule (bulk replace) ───
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

  const { days } = await req.json()

  if (!Array.isArray(days)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  // Delete existing and re-create
  await prisma.teacherAvailability.deleteMany({
    where: { teacherId: teacher.id },
  })

  const records: {
    teacherId: string
    dayOfWeek: any
    startTime: string
    endTime: string
    isEnabled: boolean
  }[] = []

  for (const day of days) {
    if (day.enabled && day.slots?.length > 0) {
      for (const slot of day.slots) {
        records.push({
          teacherId: teacher.id,
          dayOfWeek: day.name.toUpperCase() as any,
          startTime: slot.start,
          endTime: slot.end,
          isEnabled: true,
        })
      }
    }
  }

  if (records.length > 0) {
    await prisma.teacherAvailability.createMany({ data: records })
  }

  return NextResponse.json({ success: true })
}

// ─── POST: Add blocked date (with class conflict check) ───
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

  const { date, reason } = await req.json()

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 })
  }

  const blockedDate = new Date(date + "T00:00:00Z")

  // Check if date is in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (blockedDate < today) {
    return NextResponse.json({ error: "Cannot block a date in the past" }, { status: 400 })
  }

  // Check if already blocked
  const existing = await prisma.teacherBlockedDate.findFirst({
    where: { teacherId: teacher.id, blockedDate },
  })
  if (existing) {
    return NextResponse.json({ error: "This date is already blocked" }, { status: 400 })
  }

  // Check for scheduled/confirmed classes on that date
  const dayStart = new Date(blockedDate)
  const dayEnd = new Date(blockedDate)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

  const conflictingClasses = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      subject: { select: { name: true } },
    },
  })

  if (conflictingClasses.length > 0) {
    const classList = conflictingClasses.map((c) => {
      const time = c.scheduledAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      return `${c.subject.name} with ${c.student.firstName} ${c.student.lastName} at ${time}`
    })

    return NextResponse.json(
      {
        error: "conflict",
        message: `You have ${conflictingClasses.length} class${conflictingClasses.length > 1 ? "es" : ""} scheduled on this date. Please reschedule or cancel them before blocking this date.`,
        classes: classList,
      },
      { status: 409 }
    )
  }

  // Create blocked date
  const blocked = await prisma.teacherBlockedDate.create({
    data: {
      teacherId: teacher.id,
      blockedDate,
      reason: reason || "Unavailable",
    },
  })

  return NextResponse.json({
    success: true,
    blockedDate: {
      id: blocked.id,
      date: blocked.blockedDate.toISOString().split("T")[0],
      reason: blocked.reason,
    },
  })
}

// ─── DELETE: Remove blocked date ───
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: "Blocked date ID required" }, { status: 400 })
  }

  // Verify ownership
  const blocked = await prisma.teacherBlockedDate.findFirst({
    where: { id, teacherId: teacher.id },
  })
  if (!blocked) {
    return NextResponse.json({ error: "Blocked date not found" }, { status: 404 })
  }

  await prisma.teacherBlockedDate.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
