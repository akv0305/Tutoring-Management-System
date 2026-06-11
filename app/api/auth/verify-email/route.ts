import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", BASE_URL))
    }

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    })

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", BASE_URL))
    }

    if (user.emailVerified) {
      return NextResponse.redirect(new URL("/login?verified=already", BASE_URL))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifyToken: null,
        status: "ACTIVE",
      },
    })

    return NextResponse.redirect(new URL("/login?verified=true", BASE_URL))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/login?error=verification-failed", BASE_URL))
  }
}
