import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ needsVerification: false })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { emailVerified: true, status: true },
    })

    // Don't reveal whether the email exists — only flag verification need
    if (user && !user.emailVerified && user.status === "INACTIVE") {
      return NextResponse.json({ needsVerification: true })
    }

    return NextResponse.json({ needsVerification: false })
  } catch (error) {
    console.error("Check email status error:", error)
    return NextResponse.json({ needsVerification: false })
  }
}
