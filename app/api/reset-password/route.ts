import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
      select: { id: true, resetTokenExpiry: true, status: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      // Clear the expired token
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      })

      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Hash new password and clear token
    const hash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
