import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "COORDINATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find coordinator profile
    const coordinator = await prisma.coordinatorProfile.findFirst({
      where: { user: { email: session.user.email! } },
      select: { id: true },
    })
    if (!coordinator) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const studentIds = await prisma.student.findMany({
      where: { coordinatorId: coordinator.id },
      select: { id: true },
    })
    const ids = studentIds.map((s) => s.id)

    const [totalStudents, pendingOnboarding, pendingPayments] = await Promise.all([
      // My Students badge — total assigned
      prisma.student.count({
        where: { coordinatorId: coordinator.id },
      }),
      // Onboarding badge — students not yet converted
      prisma.student.count({
        where: {
          coordinatorId: coordinator.id,
          onboardingStage: { in: ["NEW_LEAD", "TRIAL_SCHEDULED", "TRIAL_COMPLETED"] },
        },
      }),
      // Payments badge — pending payments from coordinator's students
      prisma.payment.count({
        where: {
          studentId: { in: ids },
          status: "PENDING",
        },
      }),
    ])

    return NextResponse.json({ totalStudents, pendingOnboarding, pendingPayments })
  } catch (error) {
    console.error("GET /api/coordinator/badge-counts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
