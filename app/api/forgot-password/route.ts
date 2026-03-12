import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

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
    })

    // Always return success even if user not found (security best practice)
    if (!user) {
      console.log(`[Forgot Password] No account found for: ${email}`)
      return NextResponse.json({
        message: "If an account exists with that email, a reset link has been sent.",
      })
    }

    // Generate a reset token (in production, store this in DB with expiry)
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // TODO: Send real email via SendGrid/Resend/Nodemailer
    // For now, log to console (visible in dev terminal)
    console.log("─────────────────────────────────────")
    console.log("📧 PASSWORD RESET EMAIL (Dev Mock)")
    console.log(`   To: ${user.email}`)
    console.log(`   Name: ${user.firstName} ${user.lastName}`)
    console.log(`   Token: ${resetToken}`)
    console.log(`   Link: ${resetUrl}`)
    console.log(`   Expires: 24 hours`)
    console.log("─────────────────────────────────────")

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
