import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth-utils"
import { sendEmail } from "@/lib/email"
import CoordinatorAssigned from "@/emails/coordinator-assigned"

// GET /api/students — filtered by role
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}

    // Role-based filtering
    if (role === "COORDINATOR") {
      // Coordinator only sees students in their bucket
      const coordProfile = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!coordProfile) {
        return NextResponse.json({ students: [], total: 0 })
      }
      where.coordinatorId = coordProfile.id
    } else if (role === "TEACHER") {
      // Teacher only sees their assigned students (via packages)
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!teacherProfile) {
        return NextResponse.json({ students: [], total: 0 })
      }
      where.packages = { some: { teacherId: teacherProfile.id } }
    } else if (role === "PARENT") {
      // Parent only sees their own children
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!parentProfile) {
        return NextResponse.json({ students: [], total: 0 })
      }
      where.parentId = parentProfile.id
    }
    // ADMIN sees all — no filter

    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        coordinator: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subjects: {
          include: {
            subject: { select: { name: true } },
          },
        },
        _count: {
          select: {
            packages: true,
            classes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const data = students.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      school: s.school,
      timezone: s.timezone,
      status: s.status,
      onboardingStage: s.onboardingStage,
      scheduleNotes: s.scheduleNotes,
      createdAt: s.createdAt,
      parent: s.parent ? {
        name: `${s.parent.user.firstName} ${s.parent.user.lastName}`,
        email: s.parent.user.email,
        phone: s.parent.user.phone,
      } : null,
      coordinator: s.coordinator ? {
        name: `${s.coordinator.user.firstName} ${s.coordinator.user.lastName}`,
      } : null,
      subjects: s.subjects.map((ss) => ({
        name: ss.subject.name,
        trialTaken: ss.trialTaken,
      })),
      totalPackages: s._count.packages,
      totalClasses: s._count.classes,
    }))

    // Summary counts for KPI cards
    const total = data.length
    const active = data.filter((s) => s.status === "ACTIVE").length
    const inactive = data.filter((s) => s.status === "INACTIVE").length
    const trialPending = data.filter((s) => s.status === "TRIAL_PENDING").length

    return NextResponse.json({
      students: data,
      total,
      summary: { total, active, inactive, trialPending },
    })
  } catch (error) {
    console.error("GET /api/students error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/students — admin or coordinator can add students
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "COORDINATOR"])

    const body = await req.json()
    const {
      firstName, lastName, grade, school,
      parentEmail, subjects, coordinatorId, timezone,
    } = body

    if (!firstName || !lastName || !grade || !parentEmail) {
      return NextResponse.json(
        { error: "Student name, grade, and parent email are required." },
        { status: 400 }
      )
    }

    // Find parent by email
    const parentUser = await prisma.user.findUnique({
      where: { email: parentEmail.toLowerCase().trim() },
      include: { parentProfile: true },
    })

    if (!parentUser || !parentUser.parentProfile) {
      return NextResponse.json(
        { error: "No parent account found with this email." },
        { status: 404 }
      )
    }

    // Determine coordinator
    let assignCoordId = coordinatorId
    if (!assignCoordId && session.user.role === "COORDINATOR") {
      const coordProfile = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
      })
      assignCoordId = coordProfile?.id
    }

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          grade,
          school: school?.trim() || null,
          timezone: timezone || "America/New_York",
          parentId: parentUser.parentProfile!.id,
          coordinatorId: assignCoordId || null,
          status: "TRIAL_PENDING",
          onboardingStage: "NEW_LEAD",
        },
      })

      // Link subjects if provided
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        const subjectRecords = await tx.subject.findMany({
          where: { name: { in: subjects } },
        })
        for (const sub of subjectRecords) {
          await tx.studentSubject.create({
            data: {
              studentId: newStudent.id,
              subjectId: sub.id,
              trialTaken: false,
            },
          })
        }
      }

      return newStudent
    })

    return NextResponse.json({ student }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("POST /api/students error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/students — admin or coordinator
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "COORDINATOR"])

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required." },
        { status: 400 }
      )
    }

    // Check if coordinator is being assigned (for email notification)
    const previousStudent = await prisma.student.findUnique({
      where: { id },
      select: { coordinatorId: true },
    })

    const student = await prisma.student.update({
      where: { id },
      data: updates,
    })

    // Send coordinator-assigned email to parent if coordinator changed
    if (
      updates.coordinatorId &&
      updates.coordinatorId !== previousStudent?.coordinatorId
    ) {
      const studentWithParent = await prisma.student.findUnique({
        where: { id },
        include: {
          parent: {
            include: {
              user: { select: { firstName: true, email: true } },
            },
          },
          coordinator: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      })

      if (
        studentWithParent?.parent?.user?.email &&
        studentWithParent?.coordinator?.user
      ) {
        const appUrl = process.env.NEXTAUTH_URL || ""
        const coord = studentWithParent.coordinator.user

        sendEmail({
          to: studentWithParent.parent.user.email,
          subject: `Coordinator assigned for ${student.firstName} — Expert Guru`,
          react: CoordinatorAssigned({
            parentName: studentWithParent.parent.user.firstName,
            studentName: `${student.firstName} ${student.lastName}`,
            coordinatorName: `${coord.firstName} ${coord.lastName}`,
            coordinatorEmail: coord.email,
            dashboardUrl: `${appUrl}/parent`,
          }),
        }).catch((err) =>
          console.error("[Student Update] Coordinator assigned email failed:", err)
        )
      }
    }

    return NextResponse.json({ student })    

    return NextResponse.json({ student })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("PATCH /api/students error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
