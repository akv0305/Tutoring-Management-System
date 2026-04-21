import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import WelcomeStaff from "@/emails/welcome-staff"

// GET /api/teachers — public fields for parents, full fields for admin
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const subject = searchParams.get("subject")
    const search = searchParams.get("search")
    const id = searchParams.get("id")

    // Single teacher fetch (for profile page)
    if (id) {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          subjects: {
            include: { subject: { select: { id: true, name: true, category: true } } },
          },
          availabilities: {
            where: { isEnabled: true },
            orderBy: { dayOfWeek: "asc" },
          },
          blockedDates: {
            where: { blockedDate: { gte: new Date() } },
            orderBy: { blockedDate: "asc" },
          },
          _count: {
            select: { classes: true, packages: true },
          },
        },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
      }

      const profile: any = {
        id: teacher.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        avatarUrl: teacher.user.avatarUrl,
        qualification: teacher.qualification,
        bio: teacher.bio,
        experience: teacher.experience,
        studentFacingRate: Number(teacher.studentFacingRate),
        rating: Number(teacher.rating),
        totalReviews: teacher.totalReviews,
        status: teacher.status,
        timezone: teacher.timezone,
        subjects: teacher.subjects.map((ts) => ({
          id: ts.subject.id,
          name: ts.subject.name,
          category: ts.subject.category,
        })),
        availability: teacher.availabilities.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
        totalClasses: teacher._count.classes,
        totalPackages: teacher._count.packages,
      }

      // Admin-only fields
      if (role === "ADMIN") {
        profile.phone = teacher.user.phone
        profile.compensationRate = Number(teacher.compensationRate)
        profile.blockedDates = teacher.blockedDates.map((bd) => ({
          date: bd.blockedDate,
          reason: bd.reason,
        }))
      }

      return NextResponse.json({ teacher: profile })
    }

    // List all teachers
    const where: any = {}
    if (status) where.status = status
    if (subject) {
      where.subjects = { some: { subject: { name: subject } } }
    }
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const teachers = await prisma.teacherProfile.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        subjects: {
          include: { subject: { select: { name: true } } },
        },
        _count: {
          select: {
            classes: true,
            packages: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    })

    const data = teachers.map((t) => {
      const base: any = {
        id: t.id,
        firstName: t.user.firstName,
        lastName: t.user.lastName,
        email: t.user.email,
        qualification: t.qualification,
        bio: t.bio,
        experience: t.experience,
        studentFacingRate: Number(t.studentFacingRate),
        rating: Number(t.rating),
        totalReviews: t.totalReviews,
        status: t.status,
        timezone: t.timezone,
        subjects: t.subjects.map((ts) => ts.subject.name),
        totalClasses: t._count.classes,
        activePackages: t._count.packages,
      }

      // Admin-only: compensation rate and phone
      if (role === "ADMIN") {
        base.compensationRate = Number(t.compensationRate)
        base.phone = t.user.phone
      }

      return base
    })

    // Summary
    const total = data.length
    const active = data.filter((t) => t.status === "ACTIVE").length
    const onLeave = data.filter((t) => t.status === "ON_LEAVE").length
    const avgRating = total > 0
      ? Number((data.reduce((sum, t) => sum + t.rating, 0) / total).toFixed(1))
      : 0

    return NextResponse.json({
      teachers: data,
      total,
      summary: { total, active, onLeave, avgRating },
    })
  } catch (error) {
    console.error("GET /api/teachers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/teachers — admin can create a new teacher
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const {
      firstName, lastName, email, password, phone,
      qualification, bio, experience,
      compensationRate, studentFacingRate,
      subjectIds, timezone,
    } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required." },
        { status: 400 }
      )
    }
    if (!compensationRate || !studentFacingRate) {
      return NextResponse.json(
        { error: "Compensation rate and student-facing rate are required." },
        { status: 400 }
      )
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "TEACHER",
          status: "ACTIVE",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
        },
      })

      const teacherProfile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          qualification: qualification?.trim() || null,
          bio: bio?.trim() || null,
          experience: experience ?? 0,
          compensationRate,
          studentFacingRate,
          timezone: timezone || "America/New_York",
          status: "ACTIVE",
        },
      })

      // Link subjects
      if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
        for (const subjectId of subjectIds) {
          await tx.teacherSubject.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId,
            },
          })
        }
      }

      return { user, teacherProfile }
    })

    // Send welcome email to new teacher (non-blocking)
    const appUrl = process.env.NEXTAUTH_URL || ""

    sendEmail({
      to: result.user.email,
      subject: "Welcome to Expert Guru — Your Teacher Account",
      react: WelcomeStaff({
        name: result.user.firstName,
        role: "TEACHER",
        email: result.user.email,
        loginUrl: `${appUrl}/login`,
      }),
    }).catch((err) =>
      console.error("[Create Teacher] Welcome email failed:", err)
    )    

    return NextResponse.json(
      {
        message: "Teacher created successfully",
        teacher: {
          id: result.teacherProfile.id,
          name: `${result.user.firstName} ${result.user.lastName}`,
          email: result.user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/teachers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/teachers — admin can update teacher profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Teacher profile ID is required." },
        { status: 400 }
      )
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Action: toggle status
    if (action === "toggle_status") {
      const newStatus = teacher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      const updated = await prisma.teacherProfile.update({
        where: { id },
        data: { status: newStatus },
      })
      return NextResponse.json({ teacher: updated })
    }

    // Action: update compensation rate
    if (action === "update_rate") {
      const { compensationRate } = updates
      if (compensationRate === undefined || compensationRate === null || Number(compensationRate) < 0) {
        return NextResponse.json(
          { error: "Valid compensation rate is required." },
          { status: 400 }
        )
      }
      const updated = await prisma.teacherProfile.update({
        where: { id },
        data: { compensationRate: Number(compensationRate) },
      })
      return NextResponse.json({ teacher: updated })
    }

    // Generic update (status, qualification, bio, etc.)
    const allowedFields = ["status", "qualification", "bio", "experience", "compensationRate", "studentFacingRate", "timezone"]
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        data[key] = updates[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      )
    }

    const updated = await prisma.teacherProfile.update({
      where: { id },
      data,
    })

    return NextResponse.json({ teacher: updated })
  } catch (error) {
    console.error("PATCH /api/teachers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
