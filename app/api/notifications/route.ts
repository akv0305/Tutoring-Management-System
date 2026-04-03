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
