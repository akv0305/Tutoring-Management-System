import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"
import ResetPassword from "@/emails/reset-password"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, firstName: true, status: true, emailVerified: true },
    })

    // Always return success even if user not found (security best practice)
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with that email, a reset link has been sent.",
      })
    }

    // Don't send reset email if account is suspended
    if (user.status === "SUSPENDED") {
      return NextResponse.json({
        message: "If an account exists with that email, a reset link has been sent.",
      })
    }

    // Generate token and set 24-hour expiry
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Reset your password — Expert Guru",
      react: ResetPassword({
        userName: user.firstName,
        resetUrl,
      }),
    }).catch((err) => {
      console.error("[Forgot Password] Failed to send reset email:", err)
    })

    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
