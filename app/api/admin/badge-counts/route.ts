import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [pendingPayments, pendingRefunds] = await Promise.all([
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.refundRequest.count({ where: { status: "PENDING" } }),
  ])

  return NextResponse.json({ pendingPayments, pendingRefunds })
}
