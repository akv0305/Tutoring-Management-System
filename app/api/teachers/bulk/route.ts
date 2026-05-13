import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import WelcomeStaff from "@/emails/welcome-staff"

interface TeacherRow {
  firstName: string
  lastName: string
  email: string
  phone?: string
  qualification?: string
  bio?: string
  experience?: number
  compensationRate: number
  studentFacingRate: number
  subjects?: string[] // subject names
  timezone?: string
}

interface ResultRow {
  row: number
  email: string
  name: string
  status: "created" | "skipped" | "error"
  message: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { teachers } = body as { teachers: TeacherRow[] }

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json(
        { error: "No teacher data provided." },
        { status: 400 }
      )
    }

    if (teachers.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 teachers per batch." },
        { status: 400 }
      )
    }

    // Pre-fetch all subjects for name matching
    const allSubjects = await prisma.subject.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    })
    const subjectMap = new Map(
      allSubjects.map((s) => [s.name.toLowerCase().trim(), s.id])
    )

    // Pre-fetch existing emails for duplicate detection
    const incomingEmails = teachers.map((t) => t.email?.toLowerCase().trim()).filter(Boolean)
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: incomingEmails } },
      select: { email: true },
    })
    const existingEmailSet = new Set(existingUsers.map((u) => u.email))

    // Track emails within this batch to detect intra-batch duplicates
    const batchEmailSet = new Set<string>()

    const results: ResultRow[] = []
    const appUrl = process.env.NEXTAUTH_URL || ""
    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i]
      const rowNum = i + 1

      // --- Validation ---
      if (!t.firstName?.trim() || !t.lastName?.trim()) {
        results.push({
          row: rowNum,
          email: t.email || "",
          name: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
          status: "error",
          message: "First name and last name are required.",
        })
        errorCount++
        continue
      }

      if (!t.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email.trim())) {
        results.push({
          row: rowNum,
          email: t.email || "",
          name: `${t.firstName} ${t.lastName}`,
          status: "error",
          message: "Valid email is required.",
        })
        errorCount++
        continue
      }

      const email = t.email.toLowerCase().trim()

      if (
        !t.compensationRate ||
        !t.studentFacingRate ||
        Number(t.compensationRate) < 0 ||
        Number(t.studentFacingRate) < 0
      ) {
        results.push({
          row: rowNum,
          email,
          name: `${t.firstName} ${t.lastName}`,
          status: "error",
          message: "Valid compensation rate and student-facing rate are required.",
        })
        errorCount++
        continue
      }

      // Check existing email
      if (existingEmailSet.has(email)) {
        results.push({
          row: rowNum,
          email,
          name: `${t.firstName} ${t.lastName}`,
          status: "skipped",
          message: "Email already exists in the system.",
        })
        skippedCount++
        continue
      }

      // Check intra-batch duplicate
      if (batchEmailSet.has(email)) {
        results.push({
          row: rowNum,
          email,
          name: `${t.firstName} ${t.lastName}`,
          status: "skipped",
          message: "Duplicate email within this batch.",
        })
        skippedCount++
        continue
      }

      batchEmailSet.add(email)

      // Resolve subject names to IDs
      const subjectIds: string[] = []
      const unmatchedSubjects: string[] = []
      if (t.subjects && Array.isArray(t.subjects)) {
        for (const subName of t.subjects) {
          const id = subjectMap.get(subName.toLowerCase().trim())
          if (id) {
            subjectIds.push(id)
          } else if (subName.trim()) {
            unmatchedSubjects.push(subName.trim())
          }
        }
      }

      // --- Create teacher ---
      try {
        // Generate a random temporary password
        const tempPassword =
          t.firstName.trim().charAt(0).toUpperCase() +
          t.lastName.trim().charAt(0).toLowerCase() +
          "_" +
          Math.random().toString(36).slice(2, 10) +
          "!"

        const passwordHash = await bcrypt.hash(tempPassword, 12)

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              role: "TEACHER",
              status: "ACTIVE",
              firstName: t.firstName.trim(),
              lastName: t.lastName.trim(),
              phone: t.phone?.trim() || null,
            },
          })

          const teacherProfile = await tx.teacherProfile.create({
            data: {
              userId: user.id,
              qualification: t.qualification?.trim() || null,
              bio: t.bio?.trim() || null,
              experience: Number(t.experience) || 0,
              compensationRate: Number(t.compensationRate),
              studentFacingRate: Number(t.studentFacingRate),
              timezone: t.timezone?.trim() || "America/New_York",
              status: "ACTIVE",
            },
          })

          // Link subjects
          for (const subjectId of subjectIds) {
            await tx.teacherSubject.create({
              data: { teacherId: teacherProfile.id, subjectId },
            })
          }
        })

        let message = "Created successfully."
        if (unmatchedSubjects.length > 0) {
          message += ` Warning: subjects not found: ${unmatchedSubjects.join(", ")}.`
        }

        results.push({
          row: rowNum,
          email,
          name: `${t.firstName} ${t.lastName}`,
          status: "created",
          message,
        })

        // Also add to existing set so subsequent rows can't duplicate
        existingEmailSet.add(email)
        createdCount++

        // Send welcome email (non-blocking)
        sendEmail({
          to: email,
          subject: "Welcome to Expert Guru — Your Teacher Account",
          react: WelcomeStaff({
            name: t.firstName.trim(),
            role: "TEACHER",
            email,
            loginUrl: `${appUrl}/login`,
          }),
        }).catch((err) =>
          console.error(`[Bulk Onboard] Welcome email failed for ${email}:`, err)
        )
      } catch (err: any) {
        console.error(`[Bulk Onboard] Error creating row ${rowNum}:`, err)
        results.push({
          row: rowNum,
          email,
          name: `${t.firstName} ${t.lastName}`,
          status: "error",
          message: err?.message || "Unexpected error creating teacher.",
        })
        errorCount++
      }
    }

    return NextResponse.json({
      message: `Bulk onboarding complete: ${createdCount} created, ${skippedCount} skipped, ${errorCount} errors.`,
      summary: { total: teachers.length, created: createdCount, skipped: skippedCount, errors: errorCount },
      results,
    })
  } catch (error) {
    console.error("POST /api/teachers/bulk error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
