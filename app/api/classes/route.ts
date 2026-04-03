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

// PATCH /api/classes — update a class (confirm, complete, cancel, reschedule, rate, meeting link, notes, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { classId, action } = body

    if (!classId || !action) {
      return NextResponse.json(
        { error: "classId and action are required" },
        { status: 400 }
      )
    }

    // Fetch the class with relations
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, parentId: true } },
        teacher: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        subject: { select: { name: true } },
        package: { select: { id: true, classesUsed: true, classesIncluded: true } },
      },
    })

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const userRole = session.user.role
    const userId = session.user.id

    // ──────────────────────────────────────────────
    // ACTION: confirm
    // ──────────────────────────────────────────────
    if (action === "confirm") {
      if (!["ADMIN", "COORDINATOR", "TEACHER"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (classRecord.status !== "SCHEDULED") {
        return NextResponse.json({ error: "Only scheduled classes can be confirmed" }, { status: 400 })
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: { status: "CONFIRMED" },
      })

      return NextResponse.json({
        message: "Class confirmed",
        classId: updated.id,
        status: updated.status,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: complete
    // ──────────────────────────────────────────────
    if (action === "complete") {
      if (!["ADMIN", "COORDINATOR", "TEACHER"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "Only scheduled or confirmed classes can be completed" }, { status: 400 })
      }

      const { topicCovered, sessionNotes } = body

      const updateData: any = {
        status: "COMPLETED",
        completedAt: new Date(),
      }
      if (topicCovered !== undefined) updateData.topicCovered = topicCovered
      if (sessionNotes !== undefined) updateData.sessionNotes = sessionNotes

      const updated = await prisma.class.update({
        where: { id: classId },
        data: updateData,
      })

      // Update package usage if linked to a package
      if (classRecord.packageId && classRecord.package) {
        await prisma.package.update({
          where: { id: classRecord.packageId },
          data: { classesUsed: { increment: 1 } },
        })
      }

      // Notify parent
      if (classRecord.student.parentId) {
        const parent = await prisma.parentProfile.findUnique({
          where: { id: classRecord.student.parentId },
          select: { userId: true },
        })
        if (parent) {
          await prisma.notification.create({
            data: {
              userId: parent.userId,
              type: "CLASS",
              title: "Class Completed",
              message: `${classRecord.subject.name} class with ${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName} for ${classRecord.student.firstName} has been completed.`,
            },
          })
        }
      }

      return NextResponse.json({
        message: "Class marked as completed",
        classId: updated.id,
        status: updated.status,
        completedAt: updated.completedAt?.toISOString(),
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: cancel_student
    // ──────────────────────────────────────────────
    if (action === "cancel_student") {
      if (!["ADMIN", "COORDINATOR", "PARENT"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (!["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "This class cannot be cancelled" }, { status: 400 })
      }

      const { reason } = body

      // Evaluate cancellation policy for non-pending classes
      if (["SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        const settings = await prisma.platformSettings.findFirst()
        if (settings) {
          const policy = evaluateCancelPolicy(classRecord.scheduledAt, new Date(), {
            rescheduleWindowHours: settings.rescheduleWindowHours,
            rescheduleLateFeePercent: Number(settings.rescheduleLateFeePercent),
            rescheduleHardCutoffHours: settings.rescheduleHardCutoffHours,
            cancelFreeWindowHours: settings.cancelFreeWindowHours,
            cancelLateFeePercent: Number(settings.cancelLateFeePercent),
            cancelHardCutoffHours: settings.cancelHardCutoffHours,
            cancelHardCutoffFeePercent: Number(settings.cancelHardCutoffFeePercent),
            maxReschedulesPerClass: settings.maxReschedulesPerClass,
          })
          if (!policy.allowed) {
            return NextResponse.json({ error: policy.message || "Cancellation not allowed" }, { status: 400 })
          }
        }
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          status: "CANCELLED_STUDENT",
          cancelledAt: new Date(),
          cancelReason: reason || "Cancelled by student/parent",
        },
      })

      // Notify teacher
      await prisma.notification.create({
        data: {
          userId: classRecord.teacher.user.id,
          type: "CLASS",
          title: "Class Cancelled",
          message: `${classRecord.student.firstName} ${classRecord.student.lastName}'s ${classRecord.subject.name} class on ${classRecord.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} has been cancelled by the student.`,
        },
      })

      return NextResponse.json({
        message: "Class cancelled by student",
        classId: updated.id,
        status: updated.status,
      })
    }


    // ──────────────────────────────────────────────
    // ACTION: cancel_teacher
    // ──────────────────────────────────────────────
    if (action === "cancel_teacher") {
      if (!["ADMIN", "COORDINATOR", "TEACHER"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "This class cannot be cancelled" }, { status: 400 })
      }

      const { reason } = body

      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          status: "CANCELLED_TEACHER",
          cancelledAt: new Date(),
          cancelReason: reason || "Cancelled by teacher",
        },
      })

      // Notify parent
      if (classRecord.student.parentId) {
        const parent = await prisma.parentProfile.findUnique({
          where: { id: classRecord.student.parentId },
          select: { userId: true },
        })
        if (parent) {
          await prisma.notification.create({
            data: {
              userId: parent.userId,
              type: "CLASS",
              title: "Class Cancelled by Teacher",
              message: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName} has cancelled the ${classRecord.subject.name} class on ${classRecord.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
            },
          })
        }
      }

      return NextResponse.json({
        message: "Class cancelled by teacher",
        classId: updated.id,
        status: updated.status,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: no_show_student
    // ──────────────────────────────────────────────
    if (action === "no_show_student") {
      if (!["ADMIN", "COORDINATOR", "TEACHER"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "Invalid class status for no-show" }, { status: 400 })
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: { status: "NO_SHOW_STUDENT" },
      })

      return NextResponse.json({
        message: "Student marked as no-show",
        classId: updated.id,
        status: updated.status,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: no_show_teacher
    // ──────────────────────────────────────────────
    if (action === "no_show_teacher") {
      if (!["ADMIN", "COORDINATOR"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "Invalid class status for no-show" }, { status: 400 })
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: { status: "NO_SHOW_TEACHER" },
      })

      return NextResponse.json({
        message: "Teacher marked as no-show",
        classId: updated.id,
        status: updated.status,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: rate
    // ──────────────────────────────────────────────
    if (action === "rate") {
      if (!["ADMIN", "COORDINATOR", "PARENT"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (classRecord.status !== "COMPLETED") {
        return NextResponse.json({ error: "Only completed classes can be rated" }, { status: 400 })
      }

      const { rating, feedback } = body
      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          parentRating: rating,
          parentFeedback: feedback || null,
        },
      })

      // Update teacher's average rating
      const allRatings = await prisma.class.findMany({
        where: {
          teacherId: classRecord.teacherId,
          parentRating: { not: null },
        },
        select: { parentRating: true },
      })
      const avgRating =
        allRatings.reduce((sum, c) => sum + (c.parentRating as number), 0) / allRatings.length
      await prisma.teacherProfile.update({
        where: { id: classRecord.teacherId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      })

      // Notify teacher
      await prisma.notification.create({
        data: {
          userId: classRecord.teacher.user.id,
          type: "CLASS",
          title: "New Rating Received",
          message: `${classRecord.student.firstName}'s parent rated your ${classRecord.subject.name} class ${rating}/5 stars.${feedback ? ` Feedback: "${feedback}"` : ""}`,
        },
      })

      return NextResponse.json({
        message: "Class rated successfully",
        classId: updated.id,
        rating: updated.parentRating,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: reschedule
    // ──────────────────────────────────────────────
    if (action === "reschedule") {
      if (!["ADMIN", "COORDINATOR", "PARENT", "TEACHER"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (!["SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "Only scheduled or confirmed classes can be rescheduled" }, { status: 400 })
      }

      const { newScheduledAt, reason } = body
      if (!newScheduledAt) {
        return NextResponse.json({ error: "newScheduledAt is required" }, { status: 400 })
      }

      // Evaluate reschedule policy
      const settings = await prisma.platformSettings.findFirst()
      if (settings) {
        const rescheduleCount = classRecord.rescheduleCount ?? 0
        const policy = evaluateReschedulePolicy(classRecord.scheduledAt, new Date(), rescheduleCount, {
          rescheduleWindowHours: settings.rescheduleWindowHours,
          rescheduleLateFeePercent: Number(settings.rescheduleLateFeePercent),
          rescheduleHardCutoffHours: settings.rescheduleHardCutoffHours,
          cancelFreeWindowHours: settings.cancelFreeWindowHours,
          cancelLateFeePercent: Number(settings.cancelLateFeePercent),
          cancelHardCutoffHours: settings.cancelHardCutoffHours,
          cancelHardCutoffFeePercent: Number(settings.cancelHardCutoffFeePercent),
          maxReschedulesPerClass: settings.maxReschedulesPerClass,
        })
        if (!policy.allowed) {
          return NextResponse.json({ error: policy.message || "Reschedule not allowed by policy" }, { status: 400 })
        }
      }

      // Check for conflicts at new time
      const newDate = new Date(newScheduledAt)
      const classDuration = classRecord.duration || 60
      const newEnd = new Date(newDate.getTime() + classDuration * 60000)

      const conflict = await prisma.class.findFirst({
        where: {
          teacherId: classRecord.teacherId,
          id: { not: classId },
          status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"] },
          scheduledAt: { lt: newEnd },
          AND: {
            scheduledAt: {
              gte: new Date(newDate.getTime() - classDuration * 60000 + 1),
            },
          },
        },
      })

      if (conflict) {
        return NextResponse.json(
          { error: "Teacher has a scheduling conflict at the new time" },
          { status: 409 }
        )
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          scheduledAt: newDate,
          status: "SCHEDULED",
          cancelReason: reason ? `Rescheduled: ${reason}` : null,
          rescheduleCount: { increment: 1 },
        },
      })

      // Notify the other party
      const initiator = ["PARENT"].includes(userRole) ? "student" : "teacher"
      if (initiator === "student") {
        await prisma.notification.create({
          data: {
            userId: classRecord.teacher.user.id,
            type: "CLASS",
            title: "Class Rescheduled",
            message: `${classRecord.student.firstName}'s ${classRecord.subject.name} class has been rescheduled to ${newDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${newDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
          },
        })
      } else if (classRecord.student.parentId) {
        const parent = await prisma.parentProfile.findUnique({
          where: { id: classRecord.student.parentId },
          select: { userId: true },
        })
        if (parent) {
          await prisma.notification.create({
            data: {
              userId: parent.userId,
              type: "CLASS",
              title: "Class Rescheduled by Teacher",
              message: `${classRecord.teacher.user.firstName} has rescheduled the ${classRecord.subject.name} class to ${newDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${newDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`,
            },
          })
        }
      }

      return NextResponse.json({
        message: "Class rescheduled successfully",
        classId: updated.id,
        newScheduledAt: updated.scheduledAt.toISOString(),
        status: updated.status,
      })
    }


    // ──────────────────────────────────────────────
    // ACTION: update_meeting_link
    // ──────────────────────────────────────────────
    if (action === "update_meeting_link") {
      // Only the assigned teacher, admin, or coordinator can update the meeting link
      if (userRole === "TEACHER") {
        const teacherProfile = await prisma.teacherProfile.findUnique({
          where: { userId },
        })
        if (!teacherProfile || teacherProfile.id !== classRecord.teacherId) {
          return NextResponse.json({ error: "You can only update meeting links for your own classes" }, { status: 403 })
        }
      } else if (!["ADMIN", "COORDINATOR"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (!["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "Meeting link can only be set for upcoming classes" }, { status: 400 })
      }

      const { meetingLink, generateJitsi } = body

      let finalLink: string

      if (generateJitsi) {
        // Auto-generate a Jitsi Meet room URL
        const shortId = classId.slice(-8)
        const roomName = `ExpertGuru-${shortId}`
        finalLink = `https://meet.jit.si/${roomName}`
      } else if (meetingLink) {
        finalLink = meetingLink
      } else {
        return NextResponse.json(
          { error: "Provide meetingLink or set generateJitsi: true" },
          { status: 400 }
        )
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: { meetingLink: finalLink },
      })

      // Notify parent that meeting link is available
      if (classRecord.student.parentId) {
        const parent = await prisma.parentProfile.findUnique({
          where: { id: classRecord.student.parentId },
          select: { userId: true },
        })
        if (parent) {
          await prisma.notification.create({
            data: {
              userId: parent.userId,
              type: "CLASS",
              title: "Meeting Link Added",
              message: `A meeting link has been added for ${classRecord.student.firstName}'s ${classRecord.subject.name} class on ${classRecord.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${classRecord.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. You can join from your dashboard.`,
            },
          })
        }
      }

      return NextResponse.json({
        message: "Meeting link updated",
        classId: updated.id,
        meetingLink: updated.meetingLink,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: update_notes
    // ──────────────────────────────────────────────
    if (action === "update_notes") {
      // Only the assigned teacher, admin, or coordinator can update notes
      if (userRole === "TEACHER") {
        const teacherProfile = await prisma.teacherProfile.findUnique({
          where: { userId },
        })
        if (!teacherProfile || teacherProfile.id !== classRecord.teacherId) {
          return NextResponse.json({ error: "You can only update notes for your own classes" }, { status: 403 })
        }
      } else if (!["ADMIN", "COORDINATOR"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const { topicCovered, sessionNotes } = body

      const updateData: any = {}
      if (topicCovered !== undefined) updateData.topicCovered = topicCovered
      if (sessionNotes !== undefined) updateData.sessionNotes = sessionNotes

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "Provide at least one of: topicCovered, sessionNotes" },
          { status: 400 }
        )
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: updateData,
      })

      return NextResponse.json({
        message: "Class notes updated",
        classId: updated.id,
        topicCovered: updated.topicCovered,
        sessionNotes: updated.sessionNotes,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: confirm_payment
    // ──────────────────────────────────────────────
    if (action === "confirm_payment") {
      if (!["ADMIN", "COORDINATOR"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (classRecord.status !== "PENDING_PAYMENT") {
        return NextResponse.json({ error: "Class is not pending payment" }, { status: 400 })
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: { status: "SCHEDULED" },
      })

      return NextResponse.json({
        message: "Payment confirmed, class scheduled",
        classId: updated.id,
        status: updated.status,
      })
    }

    // ──────────────────────────────────────────────
    // ACTION: reject_payment
    // ──────────────────────────────────────────────
    if (action === "reject_payment") {
      if (!["ADMIN", "COORDINATOR"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (classRecord.status !== "PENDING_PAYMENT") {
        return NextResponse.json({ error: "Class is not pending payment" }, { status: 400 })
      }

      const { reason } = body

      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          status: "CANCELLED_STUDENT",
          cancelledAt: new Date(),
          cancelReason: reason || "Payment rejected",
        },
      })

      return NextResponse.json({
        message: "Payment rejected, class cancelled",
        classId: updated.id,
        status: updated.status,
      })
    }

    // ──────────────────────────────────────────────
    // Unknown action
    // ──────────────────────────────────────────────
    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported: confirm, complete, cancel_student, cancel_teacher, no_show_student, no_show_teacher, rate, reschedule, update_meeting_link, update_notes, confirm_payment, reject_payment` },
      { status: 400 }
    )
  } catch (error) {
    console.error("PATCH /api/classes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
