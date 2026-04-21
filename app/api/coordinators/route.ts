import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/email"
import WelcomeStaff from "@/emails/welcome-staff"

// GET /api/coordinators
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const coordinators = await prisma.coordinatorProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const data = coordinators.map((c) => ({
      id: c.id,
      name: `${c.user.firstName} ${c.user.lastName}`,
      email: c.user.email,
      phone: c.user.phone,
      bucketSize: c.bucketSize,
      currentStudents: c._count.students,
      availableSlots: Math.max(0, c.bucketSize - c._count.students),
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }))

    return NextResponse.json({ coordinators: data, total: data.length })
  } catch (error) {
    console.error("GET /api/coordinators error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/coordinators — admin creates a new coordinator
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { firstName, lastName, email, password, phone, bucketSize } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required." },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
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
          role: "COORDINATOR",
          status: "ACTIVE",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
        },
      })

      const coordinatorProfile = await tx.coordinatorProfile.create({
        data: {
          userId: user.id,
          bucketSize: bucketSize ?? 50,
          status: "ACTIVE",
        },
      })

      return { user, coordinatorProfile }
    })

    // Send welcome email to new coordinator (non-blocking)
    const appUrl = process.env.NEXTAUTH_URL || ""

    sendEmail({
      to: result.user.email,
      subject: "Welcome to Expert Guru — Your Coordinator Account",
      react: WelcomeStaff({
        name: result.user.firstName,
        role: "COORDINATOR",
        email: result.user.email,
        loginUrl: `${appUrl}/login`,
      }),
    }).catch((err) =>
      console.error("[Create Coordinator] Welcome email failed:", err)
    )    

    return NextResponse.json(
      {
        message: "Coordinator created successfully",
        coordinator: {
          id: result.coordinatorProfile.id,
          name: `${result.user.firstName} ${result.user.lastName}`,
          email: result.user.email,
          bucketSize: result.coordinatorProfile.bucketSize,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/coordinators error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/coordinators — update bucket size or status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { id, bucketSize, status } = body

    if (!id) {
      return NextResponse.json({ error: "Coordinator profile id is required" }, { status: 400 })
    }

    const updateData: any = {}
    if (bucketSize !== undefined) updateData.bucketSize = bucketSize
    if (status !== undefined) updateData.status = status

    const updated = await prisma.coordinatorProfile.update({
      where: { id },
      data: updateData,
      include: { user: { select: { firstName: true, lastName: true } } },
    })

    return NextResponse.json({
      message: "Coordinator updated successfully",
      coordinator: {
        id: updated.id,
        name: `${updated.user.firstName} ${updated.user.lastName}`,
        bucketSize: updated.bucketSize,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("PATCH /api/coordinators error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
