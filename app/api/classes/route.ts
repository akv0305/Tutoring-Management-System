import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { evaluateReschedulePolicy, evaluateCancelPolicy } from "@/lib/policyEngine"

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

// POST /api/classes — schedule a new class
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
    const { studentId, teacherId, subjectId, packageId, scheduledAt, duration, topicCovered, meetingLink, isTrial } = body

    // Parents can only book for their own children
    if (session.user.role === "PARENT") {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } },
      })
      if (!parent || !parent.students.some((s) => s.id === studentId)) {
        return NextResponse.json({ error: "You can only book classes for your own children" }, { status: 403 })
      }
    }

    if (!studentId || !teacherId || !subjectId || !scheduledAt) {
      return NextResponse.json({ error: "studentId, teacherId, subjectId, and scheduledAt are required" }, { status: 400 })
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify teacher exists
    const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId } })
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Check for scheduling conflicts (teacher)
    const scheduledDate = new Date(scheduledAt)
    const classDuration = duration || 60
    const endTime = new Date(scheduledDate.getTime() + classDuration * 60000)

    const teacherConflict = await prisma.class.findFirst({
      where: {
        teacherId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        scheduledAt: { lt: endTime },
        AND: {
          scheduledAt: {
            gte: new Date(scheduledDate.getTime() - classDuration * 60000),
          },
        },
      },
    })

    if (teacherConflict) {
      return NextResponse.json({ error: "Teacher has a scheduling conflict at this time" }, { status: 409 })
    }

    const newClass = await prisma.class.create({
      data: {
        studentId,
        teacherId,
        subjectId,
        packageId: packageId || null,
        scheduledAt: scheduledDate,
        duration: classDuration,
        topicCovered: topicCovered || null,
        meetingLink: meetingLink || null,
        isTrial: isTrial || false,
        status: "SCHEDULED",
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        subject: { select: { name: true } },
      },
    })

    return NextResponse.json({
      message: "Class scheduled successfully",
      class: {
        id: newClass.id,
        student: `${newClass.student.firstName} ${newClass.student.lastName}`,
        teacher: `${newClass.teacher.user.firstName} ${newClass.teacher.user.lastName}`,
        subject: newClass.subject.name,
        scheduledAt: newClass.scheduledAt.toISOString(),
        status: newClass.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("POST /api/classes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/classes — update class status (confirm, complete, cancel, rate)
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
      case "confirm":
        if (existingClass.status !== "SCHEDULED") {
          return NextResponse.json({ error: "Can only confirm a scheduled class" }, { status: 400 })
        }
        updateData = { status: "CONFIRMED", meetingLink: updates.meetingLink || existingClass.meetingLink }
        break

      case "complete":
        if (!["SCHEDULED", "CONFIRMED"].includes(existingClass.status)) {
          return NextResponse.json({ error: "Can only complete a scheduled or confirmed class" }, { status: 400 })
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
          // Check if package is now exhausted
          const updatedPkg = await prisma.package.findUnique({ where: { id: existingClass.packageId } })
          if (updatedPkg && updatedPkg.classesUsed >= updatedPkg.classesIncluded) {
            await prisma.package.update({
              where: { id: existingClass.packageId },
              data: { status: "EXHAUSTED" },
            })
          }
        }
        break

      case "cancel_student":
        if (!["SCHEDULED", "CONFIRMED"].includes(existingClass.status)) {
          return NextResponse.json({ error: "Can only cancel a scheduled or confirmed class" }, { status: 400 })
        }
        updateData = {
          status: "CANCELLED_STUDENT",
          cancelledAt: new Date(),
          cancelReason: updates.cancelReason || "Cancelled by student/parent",
        }
        break

      case "cancel_teacher":
        if (!["SCHEDULED", "CONFIRMED"].includes(existingClass.status)) {
          return NextResponse.json({ error: "Can only cancel a scheduled or confirmed class" }, { status: 400 })
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
          return NextResponse.json({ error: "Only parents can rate classes" }, { status: 403 })
        }
        if (existingClass.status !== "COMPLETED") {
          return NextResponse.json({ error: "Can only rate a completed class" }, { status: 400 })
        }
        if (!updates.parentRating || updates.parentRating < 1 || updates.parentRating > 5) {
          return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
        }
        updateData = {
          parentRating: updates.parentRating,
          parentFeedback: updates.parentFeedback || null,
        }
        break

        case "reschedule": {
          if (!["SCHEDULED", "CONFIRMED"].includes(existingClass.status)) {
            return NextResponse.json({ error: "Can only reschedule a scheduled or confirmed class" }, { status: 400 })
          }
          if (!updates.scheduledAt) {
            return NextResponse.json({ error: "New scheduledAt is required" }, { status: 400 })
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
              return NextResponse.json({ error: result.reason || result.message }, { status: 400 })
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
              status: { in: ["SCHEDULED", "CONFIRMED"] },
              scheduledAt: { lt: newEnd },
              AND: { scheduledAt: { gte: new Date(newDate.getTime() - dur * 60000) } },
            },
          })
          if (conflict) {
            return NextResponse.json({ error: "Teacher has a conflict at the new time" }, { status: 409 })
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
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
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
