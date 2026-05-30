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
      // ── Referral (optional) ──
      referralCode,
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

    // ─── Validate referral code (if provided) ───
    let referrerId: string | null = null
    let referrerUser: { id: string; firstName: string; lastName: string } | null = null

    if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
      const cleanCode = referralCode.trim().toUpperCase()

      // Check if referral program is enabled
      const settings = await prisma.platformSettings.findFirst({
        where: { id: "default" },
        select: { referralEnabled: true },
      })

      if (settings?.referralEnabled) {
        const referrer = await prisma.user.findFirst({
          where: {
            referralCode: cleanCode,
            role: "PARENT",
            status: "ACTIVE",
          },
          select: { id: true, firstName: true, lastName: true },
        })

        if (referrer) {
          referrerId = referrer.id
          referrerUser = referrer
        }
      }
      // If code is invalid or program disabled, silently ignore — registration proceeds
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
          // ── Store referral info on user ──
          referredByCode: referrerId ? referralCode.trim().toUpperCase() : null,
        },
      })

      // 2. Create parent profile
      const parentProfile = await tx.parentProfile.create({
        data: {
          userId: user.id,
          timezone: childTimezone || "America/New_York",
        },
      })

      // 3. Create wallet for the parent (starts at $0)
      await tx.wallet.create({
        data: {
          parentProfileId: parentProfile.id,
          balance: 0,
        },
      })

      // 4. Create student
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

      // 5. Link subjects
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

      // 6. Create referral record (if valid referrer found)
      let referralCreated = false
      if (referrerId) {
        await tx.referral.create({
          data: {
            referralCode: `${referralCode.trim().toUpperCase()}-${user.id.slice(-6)}`,
            referredById: referrerId,
            referredToId: user.id,
            status: "PENDING",
          },
        })

        // Notify the referrer that someone signed up using their code
        await tx.notification.create({
          data: {
            userId: referrerId,
            type: "SYSTEM",
            title: "New Referral Sign-up!",
            message: `${parentFirstName.trim()} ${parentLastName.trim()} signed up using your referral link! You'll earn your reward once they book their first paid class.`,
          },
        })

        referralCreated = true
      }

      // 7. Create welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Welcome to Expert Guru!",
          message: `Hi ${parentFirstName}, your account has been created. ${assignedCoordinatorId ? "A coordinator will reach out within 24 hours to schedule your child's trial class." : "Our team will assign a coordinator to you shortly."}`,
        },
      })

      return { user, student, referralCreated }
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
        referralApplied: result.referralCreated,
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
