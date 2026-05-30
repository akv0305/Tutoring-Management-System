import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notifications — fetch current user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const type = searchParams.get("type") // CLASS, PAYMENT, SYSTEM

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build filter
    const where: any = { userId: user.id }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type.toUpperCase()

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    })

    const mapped = notifications.map((n) => ({
      id: n.id,
      type: n.type.toLowerCase(),
      title: n.title,
      message: n.message,
      isUnread: !n.isRead,
      createdAt: n.createdAt.toISOString(),
      // Relative time label
      timestamp: getRelativeTime(n.createdAt),
    }))

    return NextResponse.json({
      notifications: mapped,
      unreadCount,
      total: mapped.length,
    })
  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/notifications — parent sends a message/callback request to their coordinator
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only parents can use this endpoint
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can send messages to coordinators" }, { status: 403 })
    }

    const body = await req.json()
    const { recipientType, title, message } = body

    if (!recipientType || recipientType !== "coordinator") {
      return NextResponse.json(
        { error: "recipientType must be 'coordinator'" },
        { status: 400 }
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Find the parent profile and their students to locate the coordinator
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { firstName: true, lastName: true } },
        students: {
          select: {
            coordinatorId: true,
            coordinator: {
              select: {
                userId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    })

    if (!parentProfile) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    // Find the first coordinator assigned to any of the parent's children
    const studentWithCoord = parentProfile.students.find((s) => s.coordinatorId && s.coordinator)

    if (!studentWithCoord || !studentWithCoord.coordinator) {
      return NextResponse.json(
        { error: "No coordinator assigned to your children yet. Please contact support." },
        { status: 404 }
      )
    }

    const coordinatorUserId = studentWithCoord.coordinator.userId
    const parentName = `${parentProfile.user.firstName} ${parentProfile.user.lastName}`

    // Create the notification for the coordinator
    const notification = await prisma.notification.create({
      data: {
        userId: coordinatorUserId,
        type: "SYSTEM",
        title: title.trim(),
        message: `From parent ${parentName}: ${message.trim()}`,
      },
    })

    return NextResponse.json(
      {
        message: "Message sent to your coordinator successfully",
        notificationId: notification.id,
        coordinatorName: `${studentWithCoord.coordinator.user.firstName} ${studentWithCoord.coordinator.user.lastName}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/notifications — mark read, mark all read, dismiss
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { action, id } = body

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 })
    }

    switch (action) {
      case "mark_read": {
        if (!id) {
          return NextResponse.json({ error: "Notification id is required" }, { status: 400 })
        }
        // Verify ownership
        const notif = await prisma.notification.findFirst({
          where: { id, userId: user.id },
        })
        if (!notif) {
          return NextResponse.json({ error: "Notification not found" }, { status: 404 })
        }
        await prisma.notification.update({
          where: { id },
          data: { isRead: true },
        })
        return NextResponse.json({ message: "Notification marked as read" })
      }

      case "mark_all_read": {
        const result = await prisma.notification.updateMany({
          where: { userId: user.id, isRead: false },
          data: { isRead: true },
        })
        return NextResponse.json({
          message: `${result.count} notification${result.count !== 1 ? "s" : ""} marked as read`,
          count: result.count,
        })
      }

      case "dismiss": {
        if (!id) {
          return NextResponse.json({ error: "Notification id is required" }, { status: 400 })
        }
        // Verify ownership then delete
        const notif = await prisma.notification.findFirst({
          where: { id, userId: user.id },
        })
        if (!notif) {
          return NextResponse.json({ error: "Notification not found" }, { status: 404 })
        }
        await prisma.notification.delete({ where: { id } })
        return NextResponse.json({ message: "Notification dismissed" })
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'mark_read', 'mark_all_read', or 'dismiss'" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("PATCH /api/notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── Helper: relative time ──────────────────────────────
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay} days ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? "s" : ""} ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
