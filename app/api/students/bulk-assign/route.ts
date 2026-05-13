import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { sendEmail } from "@/lib/email"
import CoordinatorAssigned from "@/emails/coordinator-assigned"

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await req.json()
    const { studentIds, coordinatorId } = body

    if (
      !studentIds ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one student must be selected." },
        { status: 400 }
      )
    }

    if (!coordinatorId) {
      return NextResponse.json(
        { error: "Coordinator is required." },
        { status: 400 }
      )
    }

    // Verify coordinator exists and is active
    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { id: coordinatorId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        _count: { select: { students: true } },
      },
    })

    if (!coordinator) {
      return NextResponse.json(
        { error: "Coordinator not found." },
        { status: 404 }
      )
    }

    // Check bucket capacity
    const newTotal = coordinator._count.students + studentIds.length
    if (newTotal > coordinator.bucketSize) {
      return NextResponse.json(
        {
          error: `Coordinator ${coordinator.user.firstName} ${coordinator.user.lastName} has ${coordinator.bucketSize - coordinator._count.students} available slots but ${studentIds.length} students selected.`,
        },
        { status: 400 }
      )
    }

    // Bulk update
    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { coordinatorId },
    })

    // Send notification emails to parents (non-blocking)
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        parent: {
          include: {
            user: { select: { firstName: true, email: true } },
          },
        },
      },
    })

    const appUrl = process.env.NEXTAUTH_URL || ""
    const coordName = `${coordinator.user.firstName} ${coordinator.user.lastName}`

    for (const student of students) {
      if (student.parent?.user?.email) {
        sendEmail({
          to: student.parent.user.email,
          subject: `Coordinator assigned for ${student.firstName} — Expert Guru`,
          react: CoordinatorAssigned({
            parentName: student.parent.user.firstName,
            studentName: `${student.firstName} ${student.lastName}`,
            coordinatorName: coordName,
            coordinatorEmail: coordinator.user.email,
            dashboardUrl: `${appUrl}/parent`,
          }),
        }).catch((err) =>
          console.error(
            `[Bulk Assign] Email failed for ${student.parent?.user?.email}:`,
            err
          )
        )
      }
    }

    return NextResponse.json({
      message: `${result.count} student${result.count !== 1 ? "s" : ""} assigned to ${coordName}.`,
      updated: result.count,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("PATCH /api/students/bulk-assign error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
