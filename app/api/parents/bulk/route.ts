import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import WelcomeParent from "@/emails/welcome-parent"

interface StudentRow {
  firstName: string
  lastName: string
  grade: string
  subjects?: string[]
}

interface ParentRow {
  firstName: string
  lastName: string
  email: string
  phone?: string
  timezone?: string
  coordinatorId?: string
  students: StudentRow[]
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
    if (!session?.user || !["ADMIN", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Admin or Coordinator only" }, { status: 403 })
    }

    const body = await req.json()
    const { parents } = body as { parents: ParentRow[] }

    if (!parents || !Array.isArray(parents) || parents.length === 0) {
      return NextResponse.json({ error: "No parent data provided." }, { status: 400 })
    }

    if (parents.length > 100) {
      return NextResponse.json({ error: "Maximum 100 parents per batch." }, { status: 400 })
    }

    // Pre-fetch subjects for name matching
    const allSubjects = await prisma.subject.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    })
    const subjectMap = new Map(
      allSubjects.map((s) => [s.name.toLowerCase().trim(), s.id])
    )

    // Pre-fetch grades for name matching
    const allGrades = await prisma.grade.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })
    const gradeMap = new Map(
      allGrades.map((g) => [g.name.toLowerCase().trim(), g.id])
    )

    // Pre-fetch existing emails
    const incomingEmails = parents
      .map((p) => p.email?.toLowerCase().trim())
      .filter(Boolean)
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: incomingEmails } },
      select: { email: true },
    })
    const existingEmailSet = new Set(existingUsers.map((u) => u.email))

    const batchEmailSet = new Set<string>()
    const results: ResultRow[] = []
    const appUrl = process.env.NEXTAUTH_URL || ""
    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (let i = 0; i < parents.length; i++) {
      const p = parents[i]
      const rowNum = i + 1

      // --- Validation ---
      if (!p.firstName?.trim() || !p.lastName?.trim()) {
        results.push({
          row: rowNum,
          email: p.email || "",
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          status: "error",
          message: "Parent first name and last name are required.",
        })
        errorCount++
        continue
      }

      if (!p.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) {
        results.push({
          row: rowNum,
          email: p.email || "",
          name: `${p.firstName} ${p.lastName}`,
          status: "error",
          message: "Valid email is required.",
        })
        errorCount++
        continue
      }

      const email = p.email.toLowerCase().trim()

      if (!p.students || !Array.isArray(p.students) || p.students.length === 0) {
        results.push({
          row: rowNum,
          email,
          name: `${p.firstName} ${p.lastName}`,
          status: "error",
          message: "At least one student (child) is required.",
        })
        errorCount++
        continue
      }

      // Validate each student
      let studentError = false
      for (let j = 0; j < p.students.length; j++) {
        const s = p.students[j]
        if (!s.firstName?.trim() || !s.lastName?.trim() || !s.grade?.trim()) {
          results.push({
            row: rowNum,
            email,
            name: `${p.firstName} ${p.lastName}`,
            status: "error",
            message: `Student ${j + 1}: first name, last name, and grade are required.`,
          })
          errorCount++
          studentError = true
          break
        }
      }
      if (studentError) continue

      // Check existing email
      if (existingEmailSet.has(email)) {
        results.push({
          row: rowNum,
          email,
          name: `${p.firstName} ${p.lastName}`,
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
          name: `${p.firstName} ${p.lastName}`,
          status: "skipped",
          message: "Duplicate email within this batch.",
        })
        skippedCount++
        continue
      }

      batchEmailSet.add(email)

      // --- Create parent + students ---
      try {
        const tempPassword =
          p.firstName.trim().charAt(0).toUpperCase() +
          p.lastName.trim().charAt(0).toLowerCase() +
          "_" +
          Math.random().toString(36).slice(2, 10) +
          "!"

        const passwordHash = await bcrypt.hash(tempPassword, 12)

        await prisma.$transaction(async (tx) => {
          // 1. Create User
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              role: "PARENT",
              status: "ACTIVE",
              firstName: p.firstName.trim(),
              lastName: p.lastName.trim(),
              phone: p.phone?.trim() || null,
            },
          })

          // 2. Create ParentProfile
          const parentProfile = await tx.parentProfile.create({
            data: {
              userId: user.id,
              timezone: p.timezone?.trim() || "America/New_York",
            },
          })

          // 3. Create each Student
          for (const s of p.students) {
            const matchedGradeId = gradeMap.get(s.grade.trim().toLowerCase()) || null

            const student = await tx.student.create({
              data: {
                firstName: s.firstName.trim(),
                lastName: s.lastName.trim(),
                grade: s.grade.trim(),
                gradeId: matchedGradeId,
                parentId: parentProfile.id,
                coordinatorId: p.coordinatorId || null,
                status: "ACTIVE",
                onboardingStage: "CONVERTED",
                timezone: p.timezone?.trim() || "America/New_York",
              },
            })

            // 4. Link subjects
            if (s.subjects && Array.isArray(s.subjects)) {
              for (const subName of s.subjects) {
                const subId = subjectMap.get(subName.toLowerCase().trim())
                if (subId) {
                  await tx.studentSubject.create({
                    data: { studentId: student.id, subjectId: subId },
                  })
                }
              }
            }
          }
        })

        const unmatchedGrades = p.students
          .filter((s) => !gradeMap.has(s.grade.trim().toLowerCase()))
          .map((s) => s.grade.trim())

        results.push({
          row: rowNum,
          email,
          name: `${p.firstName} ${p.lastName}`,
          status: "created",
          message: unmatchedGrades.length > 0
            ? `Created with ${p.students.length} student(s). Unrecognized grade(s): ${unmatchedGrades.join(", ")} — saved as text only.`
            : `Created with ${p.students.length} student(s).`,
        })

        existingEmailSet.add(email)
        createdCount++

        // Send welcome email (non-blocking)
        sendEmail({
          to: email,
          subject: "Welcome to Expert Guru — Your Parent Account",
          react: WelcomeParent({
            name: p.firstName.trim(),
            email,
            loginUrl: `${appUrl}/login`,
          }),
        }).catch((err) =>
          console.error(`[Bulk Parent] Welcome email failed for ${email}:`, err)
        )
      } catch (err: any) {
        console.error(`[Bulk Parent] Error creating row ${rowNum}:`, err)
        results.push({
          row: rowNum,
          email,
          name: `${p.firstName} ${p.lastName}`,
          status: "error",
          message: err?.message || "Unexpected error creating parent.",
        })
        errorCount++
      }
    }

    return NextResponse.json({
      message: `Bulk onboarding complete: ${createdCount} created, ${skippedCount} skipped, ${errorCount} errors.`,
      summary: {
        total: parents.length,
        created: createdCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      results,
    })
  } catch (error) {
    console.error("POST /api/parents/bulk error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
