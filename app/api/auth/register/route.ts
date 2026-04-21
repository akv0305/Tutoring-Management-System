import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import VerifyEmail from "@/emails/verify-email"
import NewRegistrationAlert from "@/emails/new-registration-alert"

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
    const emailVerifyToken = crypto.randomBytes(32).toString("hex")

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create parent user (INACTIVE until email is verified)
      const user = await tx.user.create({
        data: {
          email: parentEmail.toLowerCase().trim(),
          passwordHash: hash,
          role: "PARENT",
          status: "INACTIVE",
          firstName: parentFirstName.trim(),
          lastName: parentLastName.trim(),
          phone: parentPhone?.trim() || null,
          emailVerifyToken,
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

    // ─── Send verification email (non-blocking) ───
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${emailVerifyToken}`

    sendEmail({
      to: parentEmail.toLowerCase().trim(),
      subject: "Verify your email — Expert Guru",
      react: VerifyEmail({
        parentName: parentFirstName.trim(),
        verifyUrl,
      }),
    }).catch((err) => {
      console.error("[Register] Failed to send verification email:", err)
    })

    // ─── Send new registration alert to admin + coordinator (non-blocking) ───
    const appUrl = process.env.NEXTAUTH_URL || ""

    // Fetch admin email(s)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { email: true, firstName: true },
    })

    // Fetch assigned coordinator's email (if one was assigned)
    let coordinatorEmail: string | null = null
    let coordinatorName: string | null = null

    if (assignedCoordinatorId) {
      const coordProfile = await prisma.coordinatorProfile.findUnique({
        where: { id: assignedCoordinatorId },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      })
      if (coordProfile) {
        coordinatorEmail = coordProfile.user.email
        coordinatorName = `${coordProfile.user.firstName} ${coordProfile.user.lastName}`
      }
    }

    // Build CC list: coordinator if assigned and not already an admin
    const ccList: string[] = []
    if (coordinatorEmail && !admins.some((a) => a.email === coordinatorEmail)) {
      ccList.push(coordinatorEmail)
    }

    // Send to each admin (with coordinator in CC)
    for (const admin of admins) {
      sendEmail({
        to: admin.email,
        cc: ccList.length > 0 ? ccList : undefined,
        subject: `New registration — ${childFirstName} ${childLastName} (${parentFirstName} ${parentLastName}) — Expert Guru`,
        react: NewRegistrationAlert({
          recipientName: admin.firstName,
          parentName: `${parentFirstName.trim()} ${parentLastName.trim()}`,
          parentEmail: parentEmail.toLowerCase().trim(),
          parentPhone: parentPhone?.trim() || undefined,
          studentName: `${childFirstName.trim()} ${childLastName.trim()}`,
          studentGrade: childGrade,
          subjects: childSubjects || [],
          coordinatorName: coordinatorName || undefined,
          scheduleNotes: scheduleNotes?.trim() || undefined,
          dashboardUrl: `${appUrl}/admin`,
        }),
      }).catch((err) =>
        console.error("[Register] Admin alert email failed:", err)
      )
    }    

    return NextResponse.json(
      {
        message: "Account created! Please check your email to verify your account.",
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
