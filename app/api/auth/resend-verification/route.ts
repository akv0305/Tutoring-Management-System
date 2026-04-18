import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import VerifyEmail from "@/emails/verify-email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: "If an account exists, a verification email has been sent." },
        { status: 200 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, firstName: true, emailVerified: true, status: true },
    })

    // Generic response for security — don't reveal if email exists
    if (!user || user.emailVerified || user.status !== "INACTIVE") {
      return NextResponse.json(
        { message: "If an account exists, a verification email has been sent." },
        { status: 200 }
      )
    }

    // Generate new token and save
    const emailVerifyToken = crypto.randomBytes(32).toString("hex")

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken },
    })

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${emailVerifyToken}`

    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Verify your email — Expert Guru",
      react: VerifyEmail({
        parentName: user.firstName,
        verifyUrl,
      }),
    })

    return NextResponse.json(
      { message: "Verification email sent! Please check your inbox." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { message: "If an account exists, a verification email has been sent." },
      { status: 200 }
    )
  }
}
