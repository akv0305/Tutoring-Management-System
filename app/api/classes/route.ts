import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { evaluateReschedulePolicy, evaluateCancelPolicy } from "@/lib/policyEngine"

// Generate a unique order reference like "ORD-20260402-A1B2C3"
function generateOrderRef(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let suffix = ""
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `ORD-${dateStr}-${suffix}`
}

// GET /api/classes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")
    const teacherId = searchParams.get("teacherId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Build where clause based on role
    const where: any = {}

    if (session.user.role === "TEACHER") {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
      })
      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
      }
      where.teacherId = teacherProfile.id
    }

    if (session.user.role === "PARENT") {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!parentProfile) {
        return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
      }
      where.studentId = { in: parentProfile.students.map((s) => s.id) }
    }

    if (session.user.role === "COORDINATOR") {
      const coordProfile = await prisma.coordinatorProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!coordProfile) {
        return NextResponse.json({ error: "Coordinator profile not found" }, { status: 404 })
      }
      where.studentId = { in: coordProfile.students.map((s) => s.id) }
    }

    // Optional filters
    if (status) {
      where.status = status.toUpperCase()
    }
    if (studentId) {
      where.studentId = studentId
    }
    if (teacherId) {
      where.teacherId = teacherId
    }
    if (from || to) {
      where.scheduledAt = {}
      if (from) where.scheduledAt.gte = new Date(from)
      if (to) where.scheduledAt.lte = new Date(to)
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, grade: true } },
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        subject: { select: { name: true } },
        package: { select: { name: true } },
      },
      orderBy: { scheduledAt: "desc" },
    })

    const mapped = classes.map((c) => ({
      id: c.id,
      studentName: `${c.student.firstName} ${c.student.lastName}`,
      studentGrade: c.student.grade,
      teacherName: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      teacherInitials: `${c.teacher.user.firstName[0]}${c.teacher.user.lastName[0]}`,
      subject: c.subject.name,
      packageName: c.package?.name ?? "—",
      scheduledAt: c.scheduledAt.toISOString(),
      day: c.scheduledAt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      time: `${c.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(c.scheduledAt.getTime() + c.duration * 60000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      duration: c.duration,
      status: c.status,
      meetingLink: c.meetingLink,
      topicCovered: c.topicCovered,
      sessionNotes: c.sessionNotes,
      parentRating: c.parentRating,
      parentFeedback: c.parentFeedback,
      isTrial: c.isTrial,
      cancelReason: c.cancelReason,
      completedAt: c.completedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    }))

    // Summary
    const summary = {
      total: mapped.length,
      pendingPayment: mapped.filter((c) => c.status === "PENDING_PAYMENT").length,
      scheduled: mapped.filter((c) => c.status === "SCHEDULED").length,
      confirmed: mapped.filter((c) => c.status === "CONFIRMED").length,
      completed: mapped.filter((c) => c.status === "COMPLETED").length,
      cancelled: mapped.filter((c) => c.status.startsWith("CANCELLED")).length,
      noShow: mapped.filter((c) => c.status.startsWith("NO_SHOW")).length,
    }

    return NextResponse.json({ classes: mapped, total: mapped.length, summary })
  } catch (error) {
    console.error("GET /api/classes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/classes — book one or more classes
// Accepts either { scheduledAt: "..." } for a single slot
// or { slots: ["...", "..."] } for multiple slots in one booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "COORDINATOR", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      studentId,
      teacherId,
      subjectId,
      packageId,
      scheduledAt,
      slots,
      duration,
      topicCovered,
      meetingLink,
      isTrial,
    } = body

    // Parents can only book for their own children
    if (session.user.role === "PARENT") {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!parent || !parent.students.some((s) => s.id === studentId)) {
        return NextResponse.json(
          { error: "You can only book classes for your own children" },
          { status: 403 }
        )
      }
    }

    if (!studentId || !teacherId || !subjectId) {
      return NextResponse.json(
        { error: "studentId, teacherId, and subjectId are required" },
        { status: 400 }
      )
    }

    // Normalize slots: support both single scheduledAt and slots array
    const slotList: string[] = slots && Array.isArray(slots) && slots.length > 0
      ? slots
      : scheduledAt
        ? [scheduledAt]
        : []

    if (slotList.length === 0) {
      return NextResponse.json(
        { error: "At least one slot (scheduledAt or slots[]) is required" },
        { status: 400 }
      )
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify teacher exists (need rate for amount calculation)
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: { select: { firstName: true, lastName: true } } },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const classDuration = duration || 60
    const isTrialClass = isTrial || false

    // Check for scheduling conflicts for ALL slots before creating anything
    for (const slot of slotList) {
      const slotDate = new Date(slot)
      const slotEnd = new Date(slotDate.getTime() + classDuration * 60000)

      const conflict = await prisma.class.findFirst({
        where: {
          teacherId,
          status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"] },
          scheduledAt: { lt: slotEnd },
          AND: {
            scheduledAt: {
              gte: new Date(slotDate.getTime() - classDuration * 60000 + 1),
            },
          },
        },
      })

      if (conflict) {
        return NextResponse.json(
          {
            error: `Teacher has a scheduling conflict at ${slotDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${slotDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
          },
          { status: 409 }
        )
      }
    }

    // ─── TRIAL CLASS: skip BookingOrder/Payment, create directly as SCHEDULED ───
    if (isTrialClass) {
      const trialClasses = await prisma.$transaction(
        slotList.map((slot) =>
          prisma.class.create({
            data: {
              studentId,
              teacherId,
              subjectId,
              packageId: packageId || null,
              scheduledAt: new Date(slot),
              duration: classDuration,
              topicCovered: topicCovered || null,
              meetingLink: meetingLink || null,
              isTrial: true,
              status: "SCHEDULED",
            },
          })
        )
      )

      return NextResponse.json(
        {
          message: `${trialClasses.length} trial class${trialClasses.length > 1 ? "es" : ""} scheduled successfully`,
          classIds: trialClasses.map((c) => c.id),
          totalClasses: trialClasses.length,
          pendingPayment: false,
        },
        { status: 201 }
      )
    }

    // ─── NON-TRIAL: create BookingOrder + Payment + Classes in a transaction ───

    // Calculate total amount: classes × teacher's student-facing rate × (duration / 60)
    const hourlyRate = Number(teacher.studentFacingRate.toString())
    const perClassAmount = hourlyRate * (classDuration / 60)
    const totalAmount = perClassAmount * slotList.length
    const orderRef = generateOrderRef()

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Payment record (PENDING)
      const payment = await tx.payment.create({
        data: {
          studentId,
          packageId: packageId || null,
          amount: totalAmount,
          method: "BANK_TRANSFER",
          status: "PENDING",
        },
      })

      // 2. Create the BookingOrder
      const bookingOrder = await tx.bookingOrder.create({
        data: {
          orderRef,
          studentId,
          packageId: packageId || null,
          teacherId,
          subjectId,
          totalClasses: slotList.length,
          totalAmount,
          status: "PENDING_PAYMENT",
          paymentId: payment.id,
        },
      })

      // 3. Create all Class records linked to the BookingOrder
      const classRecords = []
      for (const slot of slotList) {
        const newClass = await tx.class.create({
          data: {
            studentId,
            teacherId,
            subjectId,
            packageId: packageId || null,
            bookingOrderId: bookingOrder.id,
            scheduledAt: new Date(slot),
            duration: classDuration,
            topicCovered: topicCovered || null,
            meetingLink: meetingLink || null,
            isTrial: false,
            status: "PENDING_PAYMENT",
          },
        })
        classRecords.push(newClass)
      }

      return { payment, bookingOrder, classRecords }
    })

    // Send notifications to admin(s) and coordinator (outside transaction, non-blocking)
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      })

      const coordUser = student.coordinatorId
        ? await prisma.coordinatorProfile.findUnique({
            where: { id: student.coordinatorId },
            select: { userId: true },
          })
        : null

      const notifyUserIds = [
        ...admins.map((a) => a.id),
        ...(coordUser ? [coordUser.userId] : []),
      ]

      const uniqueNotifyIds = [...new Set(notifyUserIds)].filter(
        (uid) => uid !== session.user.id
      )

      if (uniqueNotifyIds.length > 0) {
        const studentName = `${student.firstName} ${student.lastName}`
        const teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`

        await prisma.notification.createMany({
          data: uniqueNotifyIds.map((userId) => ({
            userId,
            type: "PAYMENT" as const,
            title: "New Booking — Payment Pending",
            message: `${studentName} booked ${slotList.length} class${slotList.length > 1 ? "es" : ""} with ${teacherName}. Order: ${orderRef}. Amount: $${totalAmount.toFixed(2)}. Awaiting payment confirmation.`,
          })),
        })
      }
    } catch (notifyError) {
      console.error("Failed to send booking notifications:", notifyError)
    }

    return NextResponse.json(
      {
        message: `${slotList.length} class${slotList.length > 1 ? "es" : ""} reserved — awaiting payment confirmation`,
        orderRef: result.bookingOrder.orderRef,
        bookingOrderId: result.bookingOrder.id,
        paymentId: result.payment.id,
        classIds: result.classRecords.map((c) => c.id),
        totalClasses: slotList.length,
        totalAmount: `$${totalAmount.toFixed(2)}`,
        pendingPayment: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/classes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/classes — update class status (confirm, complete, cancel, rate, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Class id is required" }, { status: 400 })
    }

    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: { package: true },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case "confirm_payment": {
        if (existingClass.status !== "PENDING_PAYMENT") {
          return NextResponse.json(
            { error: "Can only confirm payment for a pending-payment class" },
            { status: 400 }
          )
        }
        if (!["ADMIN", "COORDINATOR"].includes(session.user.role)) {
          return NextResponse.json(
            { error: "Only admin or coordinator can confirm payment" },
            { status: 403 }
          )
        }
        updateData = { status: "SCHEDULED" }
        break
      }

      case "reject_payment": {
        if (existingClass.status !== "PENDING_PAYMENT") {
          return NextResponse.json(
            { error: "Can only reject payment for a pending-payment class" },
            { status: 400 }
          )
        }
        if (!["ADMIN", "COORDINATOR"].includes(session.user.role)) {
          return NextResponse.json(
            { error: "Only admin or coordinator can reject payment" },
            { status: 403 }
          )
        }
        updateData = {
          status: "CANCELLED_STUDENT",
          cancelledAt: new Date(),
          cancelReason:
            updates.cancelReason || "Payment not completed — slot released",
        }
        break
      }

      case "confirm":
        if (existingClass.status !== "SCHEDULED") {
          return NextResponse.json(
            { error: "Can only confirm a scheduled class" },
            { status: 400 }
          )
        }
        updateData = {
          status: "CONFIRMED",
          meetingLink: updates.meetingLink || existingClass.meetingLink,
        }
        break

      case "complete":
        if (!["SCHEDULED", "CONFIRMED"].includes(existingClass.status)) {
          return NextResponse.json(
            { error: "Can only complete a scheduled or confirmed class" },
            { status: 400 }
          )
        }
        updateData = {
          status: "COMPLETED",
          completedAt: new Date(),
          topicCovered: updates.topicCovered || existingClass.topicCovered,
          sessionNotes: updates.sessionNotes || existingClass.sessionNotes,
        }
        // Update package usage
        if (existingClass.packageId && existingClass.package) {
          await prisma.package.update({
            where: { id: existingClass.packageId },
            data: { classesUsed: { increment: 1 } },
          })
          const updatedPkg = await prisma.package.findUnique({
            where: { id: existingClass.packageId },
          })
          if (
            updatedPkg &&
            updatedPkg.classesUsed >= updatedPkg.classesIncluded
          ) {
            await prisma.package.update({
              where: { id: existingClass.packageId },
              data: { status: "EXHAUSTED" },
            })
          }
        }
        break

      case "cancel_student":
        if (
          !["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(
            existingClass.status
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Can only cancel a pending, scheduled, or confirmed class",
            },
            { status: 400 }
          )
        }
        updateData = {
          status: "CANCELLED_STUDENT",
          cancelledAt: new Date(),
          cancelReason:
            updates.cancelReason || "Cancelled by student/parent",
        }
        break

      case "cancel_teacher":
        if (
          !["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(
            existingClass.status
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Can only cancel a pending, scheduled, or confirmed class",
            },
            { status: 400 }
          )
        }
        updateData = {
          status: "CANCELLED_TEACHER",
          cancelledAt: new Date(),
          cancelReason: updates.cancelReason || "Cancelled by teacher",
        }
        break

      case "no_show_student":
        updateData = { status: "NO_SHOW_STUDENT" }
        break

      case "no_show_teacher":
        updateData = { status: "NO_SHOW_TEACHER" }
        break

      case "rate":
        if (session.user.role !== "PARENT") {
          return NextResponse.json(
            { error: "Only parents can rate classes" },
            { status: 403 }
          )
        }
        if (existingClass.status !== "COMPLETED") {
          return NextResponse.json(
            { error: "Can only rate a completed class" },
            { status: 400 }
          )
        }
        if (
          !updates.parentRating ||
          updates.parentRating < 1 ||
          updates.parentRating > 5
        ) {
          return NextResponse.json(
            { error: "Rating must be between 1 and 5" },
            { status: 400 }
          )
        }
        updateData = {
          parentRating: updates.parentRating,
          parentFeedback: updates.parentFeedback || null,
        }
        break

      case "reschedule": {
        if (!["SCHEDULED", "CONFIRMED"].includes(existingClass.status)) {
          return NextResponse.json(
            { error: "Can only reschedule a scheduled or confirmed class" },
            { status: 400 }
          )
        }
        if (!updates.scheduledAt) {
          return NextResponse.json(
            { error: "New scheduledAt is required" },
            { status: 400 }
          )
        }

        // Policy check
        const settings = await prisma.platformSettings.findFirst()
        if (settings) {
          const result = evaluateReschedulePolicy(
            existingClass.scheduledAt,
            new Date(),
            existingClass.rescheduleCount,
            settings
          )
          if (!result.allowed) {
            return NextResponse.json(
              { error: result.reason || result.message },
              { status: 400 }
            )
          }
        }

        // Conflict check for new time
        const newDate = new Date(updates.scheduledAt)
        const dur = existingClass.duration
        const newEnd = new Date(newDate.getTime() + dur * 60000)
        const conflict = await prisma.class.findFirst({
          where: {
            teacherId: existingClass.teacherId,
            id: { not: existingClass.id },
            status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"] },
            scheduledAt: { lt: newEnd },
            AND: {
              scheduledAt: {
                gte: new Date(newDate.getTime() - dur * 60000),
              },
            },
          },
        })
        if (conflict) {
          return NextResponse.json(
            { error: "Teacher has a conflict at the new time" },
            { status: 409 }
          )
        }

        updateData = {
          scheduledAt: newDate,
          status: "SCHEDULED",
          rescheduleCount: { increment: 1 },
        }
        break
      }
    }

    const updated = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { firstName: true, lastName: true } },
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        subject: { select: { name: true } },
      },
    })

    return NextResponse.json({
      message: `Class ${action || "updated"} successfully`,
      class: {
        id: updated.id,
        student: `${updated.student.firstName} ${updated.student.lastName}`,
        teacher: `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}`,
        subject: updated.subject.name,
        status: updated.status,
        scheduledAt: updated.scheduledAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("PATCH /api/classes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
