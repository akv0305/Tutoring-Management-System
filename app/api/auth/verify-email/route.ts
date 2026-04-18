import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    })

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    if (user.emailVerified) {
      return NextResponse.redirect(new URL("/login?verified=already", req.url))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifyToken: null,
        status: "ACTIVE",
      },
    })

    return NextResponse.redirect(new URL("/login?verified=true", req.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/login?error=verification-failed", req.url))
  }
}
