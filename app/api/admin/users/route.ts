import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"
import ResetPassword from "@/emails/reset-password"

// GET /api/admin/users — list all users with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const role = searchParams.get("role") // TEACHER | PARENT | COORDINATOR | null
    const status = searchParams.get("status") // ACTIVE | INACTIVE | SUSPENDED | null
    const search = searchParams.get("search")

    const where: any = {
      role: { not: "ADMIN" }, // Don't list admin accounts
    }

    if (role) where.role = role
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const summary = {
      total: users.length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      inactive: users.filter((u) => u.status === "INACTIVE").length,
      suspended: users.filter((u) => u.status === "SUSPENDED").length,
      locked: users.filter(
        (u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()
      ).length,
    }

    return NextResponse.json({ users, summary })
  } catch (error) {
    console.error("GET /api/admin/users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users — perform actions on a user
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId and action are required." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    // Prevent admin from modifying their own account through this endpoint
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account from User Management." },
        { status: 400 }
      )
    }

    const fullName = `${user.firstName} ${user.lastName}`

    // ── Action: Activate user ──
    if (action === "activate") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      })

      // Also activate the role-specific profile if applicable
      if (user.role === "TEACHER") {
        await prisma.teacherProfile.updateMany({
          where: { userId },
          data: { status: "ACTIVE" },
        })
      } else if (user.role === "COORDINATOR") {
        await prisma.coordinatorProfile.updateMany({
          where: { userId },
          data: { status: "ACTIVE" },
        })
      }

      return NextResponse.json({
        message: `${fullName} has been activated.`,
      })
    }

    // ── Action: Deactivate user ──
    if (action === "deactivate") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "INACTIVE" },
      })

      if (user.role === "TEACHER") {
        await prisma.teacherProfile.updateMany({
          where: { userId },
          data: { status: "INACTIVE" },
        })
      } else if (user.role === "COORDINATOR") {
        await prisma.coordinatorProfile.updateMany({
          where: { userId },
          data: { status: "INACTIVE" },
        })
      }

      return NextResponse.json({
        message: `${fullName} has been deactivated.`,
      })
    }

    // ── Action: Suspend user ──
    if (action === "suspend") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      })

      return NextResponse.json({
        message: `${fullName} has been suspended.`,
      })
    }

    // ── Action: Unlock account ──
    if (action === "unlock") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })

      return NextResponse.json({
        message: `Account unlocked for ${fullName}.`,
      })
    }

    // ── Action: Send password reset email ──
    if (action === "send_reset_email") {
      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.user.update({
        where: { id: userId },
        data: { resetToken, resetTokenExpiry },
      })

      const appUrl = process.env.NEXTAUTH_URL || ""
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

      await sendEmail({
        to: user.email,
        subject: "Reset Your Password — Expert Guru",
        react: ResetPassword({
          userName: user.firstName,
          resetUrl,
        }),
      })

      return NextResponse.json({
        message: `Password reset email sent to ${user.email}.`,
      })
    }

    // ── Action: Set temporary password ──
    if (action === "set_password") {
      const { newPassword } = body

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 }
        )
      }

      const passwordHash = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })

      return NextResponse.json({
        message: `Password updated for ${fullName}.`,
      })
    }

    return NextResponse.json(
      {
        error:
          "Invalid action. Supported: activate, deactivate, suspend, unlock, send_reset_email, set_password.",
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
