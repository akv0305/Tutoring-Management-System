import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      // Step 1 — Parent info
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      password,
      // Step 2 — Child info
      childFirstName,
      childLastName,
      childGrade,
      childSchool,
      childSubjects,
      childTimezone,
      scheduleNotes,
    } = body

    // ─── Validation ───
    if (!parentFirstName || !parentLastName || !parentEmail || !password) {
      return NextResponse.json(
        { error: "Parent name, email, and password are required." },
        { status: 400 }
      )
    }

    if (!childFirstName || !childLastName || !childGrade) {
      return NextResponse.json(
        { error: "Child name and grade are required." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parentEmail.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    // ─── Find a coordinator with available slots ───
    const coordinator = await prisma.coordinatorProfile.findFirst({
      where: { status: "ACTIVE" },
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    let assignedCoordinatorId: string | null = null
    if (coordinator && coordinator._count.students < coordinator.bucketSize) {
      assignedCoordinatorId = coordinator.id
    }

    // ─── Create everything in a transaction ───
    const hash = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create parent user
      const user = await tx.user.create({
        data: {
          email: parentEmail.toLowerCase().trim(),
          passwordHash: hash,
          role: "PARENT",
          firstName: parentFirstName.trim(),
          lastName: parentLastName.trim(),
          phone: parentPhone?.trim() || null,
        },
      })

      // 2. Create parent profile
      const parentProfile = await tx.parentProfile.create({
        data: {
          userId: user.id,
          timezone: childTimezone || "America/New_York",
        },
      })

      // 3. Create student
      const student = await tx.student.create({
        data: {
          firstName: childFirstName.trim(),
          lastName: childLastName.trim(),
          grade: childGrade,
          school: childSchool?.trim() || null,
          timezone: childTimezone || "America/New_York",
          scheduleNotes: scheduleNotes?.trim() || null,
          parentId: parentProfile.id,
          coordinatorId: assignedCoordinatorId,
          status: "TRIAL_PENDING",
          onboardingStage: "NEW_LEAD",
        },
      })

      // 4. Link subjects
      if (childSubjects && Array.isArray(childSubjects) && childSubjects.length > 0) {
        const subjects = await tx.subject.findMany({
          where: { name: { in: childSubjects } },
        })

        for (const subject of subjects) {
          await tx.studentSubject.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              trialTaken: false,
            },
          })
        }
      }

      // 5. Create welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Welcome to Expert Guru!",
          message: `Hi ${parentFirstName}, your account has been created. ${assignedCoordinatorId ? "A coordinator will reach out within 24 hours to schedule your child's trial class." : "Our team will assign a coordinator to you shortly."}`,
        },
      })

      return { user, student }
    })

    return NextResponse.json(
      {
        message: "Account created successfully!",
        userId: result.user.id,
        studentId: result.student.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
