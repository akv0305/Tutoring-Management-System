import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { evaluateReschedulePolicy, evaluateCancelPolicy } from "@/lib/policyEngine"
import { sendEmail } from "@/lib/email"
import BookingConfirmation from "@/emails/booking-confirmation"
import TeacherNewClass from "@/emails/teacher-new-class"
import ClassCancelled from "@/emails/class-cancelled"
import ClassRescheduled from "@/emails/class-rescheduled"
import MeetingLinkShared from "@/emails/meeting-link-shared"
import ClassCompleted from "@/emails/class-completed"
import { formatDateTime, getTzAbbr } from "@/lib/timezone"
import PaymentPendingAdmin from "@/emails/payment-pending-admin"

// ── Timezone-aware date formatter (used throughout for emails & notifications) ──
function fmtDateTz(date: Date, timezone: string): string {
  const abbr = getTzAbbr(timezone, date)
  return `${formatDateTime(date, timezone)} ${abbr}`
}

function fmtShortDateTz(date: Date, timezone: string): string {
  const abbr = getTzAbbr(timezone, date)
  const short = date.toLocaleDateString("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  })
  const time = date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  })
  return `${short} at ${time} ${abbr}`
}

// ── Referral conversion & wallet deduction helper ──
async function handleReferralConversion(
  tx: any,
  parentUserId: string,
  parentProfileId: string
) {
  try {
    const parentUser = await tx.user.findUnique({
      where: { id: parentUserId },
      select: { referredByCode: true },
    })

    if (!parentUser?.referredByCode) return

    const pendingReferral = await tx.referral.findFirst({
      where: {
        referredToId: parentUserId,
        status: "PENDING",
      },
      include: {
        referredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentProfile: { select: { id: true } },
          },
        },
      },
    })

    if (!pendingReferral || !pendingReferral.referredBy?.parentProfile) return

    const settings = await tx.platformSettings.findFirst({
      where: { id: "default" },
      select: { referralEnabled: true, referralRewardAmount: true },
    })

    if (!settings?.referralEnabled) return

    const rewardAmount = Number(settings.referralRewardAmount)
    if (rewardAmount <= 0) return

    const referrerParentProfileId = pendingReferral.referredBy.parentProfile.id

    let referrerWallet = await tx.wallet.findUnique({
      where: { parentProfileId: referrerParentProfileId },
    })

    if (!referrerWallet) {
      referrerWallet = await tx.wallet.create({
        data: {
          parentProfileId: referrerParentProfileId,
          balance: 0,
        },
      })
    }

    const walletTx = await tx.walletTransaction.create({
      data: {
        walletId: referrerWallet.id,
        amount: rewardAmount,
        type: "REFERRAL_REWARD",
        description: `Referral reward — ${parentUser.referredByCode} converted`,
        referenceId: pendingReferral.id,
      },
    })

    await tx.wallet.update({
      where: { id: referrerWallet.id },
      data: { balance: { increment: rewardAmount } },
    })

    await tx.referral.update({
      where: { id: pendingReferral.id },
      data: {
        status: "SUCCESSFUL",
        rewardAmount: rewardAmount,
        walletTransactionId: walletTx.id,
        convertedAt: new Date(),
      },
    })

    await tx.notification.create({
      data: {
        userId: pendingReferral.referredById,
        type: "SYSTEM",
        title: "Referral Reward Earned!",
        message: `You earned $${rewardAmount.toFixed(2)} because your referral just booked their first paid class! The amount has been added to your wallet.`,
      },
    })
  } catch (err) {
    console.error("[Referral conversion] Error:", err)
  }
}

async function applyWalletDiscount(
  tx: any,
  parentProfileId: string,
  totalAmount: number
): Promise<{ walletDeduction: number; amountDue: number }> {
  try {
    const wallet = await tx.wallet.findUnique({
      where: { parentProfileId },
    })

    if (!wallet || Number(wallet.balance) <= 0) {
      return { walletDeduction: 0, amountDue: totalAmount }
    }

    const walletBalance = Number(wallet.balance)
    const walletDeduction = Math.min(walletBalance, totalAmount)
    const amountDue = totalAmount - walletDeduction

    if (walletDeduction > 0) {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -walletDeduction,
          type: "BOOKING_DISCOUNT",
          description: `Wallet used for class booking — $${walletDeduction.toFixed(2)} deducted`,
        },
      })

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: walletDeduction } },
      })
    }

    return { walletDeduction, amountDue }
  } catch (err) {
    console.error("[Wallet discount] Error:", err)
    return { walletDeduction: 0, amountDue: totalAmount }
  }
}

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
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: true,
            parent: {
              select: { timezone: true },
            },
          },
        },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subject: { select: { name: true } },
        package: { select: { name: true } },
      },
      orderBy: { scheduledAt: "desc" },
    })

    // Determine the viewer's timezone for formatting
    let viewerTz = "America/New_York"
    if (session.user.role === "TEACHER") {
      const tp = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        select: { timezone: true },
      })
      viewerTz = tp?.timezone || "Asia/Kolkata"
    } else if (session.user.role === "PARENT") {
      const pp = await prisma.parentProfile.findUnique({
        where: { userId: session.user.id },
        select: { timezone: true },
      })
      viewerTz = pp?.timezone || "America/New_York"
    }
    // ADMIN / COORDINATOR default to America/New_York

    const mapped = classes.map((c) => {
      const tz = viewerTz
      const tzAbbr = getTzAbbr(tz, c.scheduledAt)
      return {
        id: c.id,
        studentName: `${c.student.firstName} ${c.student.lastName}`,
        studentGrade: c.student.grade,
        teacherName: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
        teacherInitials: `${c.teacher.user.firstName[0]}${c.teacher.user.lastName[0]}`,
        subject: c.subject.name,
        packageName: c.package?.name ?? "—",
        scheduledAt: c.scheduledAt.toISOString(),
        day: c.scheduledAt.toLocaleDateString("en-US", {
          timeZone: tz,
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        time: `${c.scheduledAt.toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "2-digit",
        })} – ${new Date(c.scheduledAt.getTime() + c.duration * 60000).toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "2-digit",
        })} ${tzAbbr}`,
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
      }
    })

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
      templateId,
      scheduledAt,
      slots,
      duration,
      topicCovered,
      meetingLink,
      isTrial,
      couponCode,
      discountMethod,
      gradeBandId: requestedGradeBandId,
    } = body

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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: {
            user: { select: { firstName: true, email: true } },
          },
        },
        gradeRef: {
          include: {
            gradeBand: { select: { id: true, displayName: true } },
          },
        },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    })
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { name: true },
    })
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Fetch timezones for email formatting
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { id: student.parentId! },
      select: { id: true, timezone: true },
    })
    const parentTZ = parentProfile?.timezone || "America/New_York"
    const teacherTZ = teacher.timezone || "Asia/Kolkata"

    const classDuration = duration || 60
    const isTrialClass = isTrial || false

    // ── Validate templateId if provided ──
    let template: {
      id: string
      name: string
      subjectId: string
      classesIncluded: number
      validityDays: number
      suggestedPrice: number
    } | null = null

    if (templateId) {
      const templateRaw = await prisma.packageTemplate.findUnique({
        where: { id: templateId },
      })
      if (!templateRaw) {
        return NextResponse.json({ error: "Package template not found" }, { status: 404 })
      }
      if (templateRaw.status !== "ACTIVE") {
        return NextResponse.json({ error: "This package template is no longer available" }, { status: 400 })
      }
      if (templateRaw.subjectId !== subjectId) {
        return NextResponse.json({ error: "Package template subject does not match selected subject" }, { status: 400 })
      }
      if (slotList.length !== templateRaw.classesIncluded) {
        return NextResponse.json(
          { error: `This package requires exactly ${templateRaw.classesIncluded} classes. You selected ${slotList.length}.` },
          { status: 400 }
        )
      }
      template = {
        id: templateRaw.id,
        name: templateRaw.name,
        subjectId: templateRaw.subjectId,
        classesIncluded: templateRaw.classesIncluded,
        validityDays: templateRaw.validityDays,
        suggestedPrice: Number(templateRaw.suggestedPrice),
      }
    }

    // ── Package expiry & balance check ──
    if (packageId && !templateId) {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
      })
      if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 })
      }
      if (pkg.status !== "ACTIVE") {
        return NextResponse.json(
          { error: `Package is ${pkg.status.toLowerCase()}. Cannot book classes.` },
          { status: 400 }
        )
      }
      if (new Date() > pkg.expiryDate) {
        return NextResponse.json(
          { error: "Package has expired. Please purchase a new package." },
          { status: 400 }
        )
      }
      const remaining = pkg.classesIncluded - pkg.classesUsed
      if (!isTrialClass && slotList.length > remaining) {
        return NextResponse.json(
          {
            error: `Only ${remaining} class${remaining !== 1 ? "es" : ""} remaining in this package. You're trying to book ${slotList.length}.`,
          },
          { status: 400 }
        )
      }
    }

    // Check for scheduling conflicts
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
            error: `Teacher has a scheduling conflict at ${fmtShortDateTz(slotDate, teacherTZ)}`,
          },
          { status: 409 }
        )
      }
    }

    // ── Grade-based rate lookup ──
    let gradeBandId: string | null = requestedGradeBandId || null
    let snapshotCompensationRate: number | null = null
    let snapshotStudentFacingRate: number | null = null

    if (!gradeBandId && (student as any).gradeRef?.gradeBand?.id) {
      gradeBandId = (student as any).gradeRef.gradeBand.id
    }

    if (gradeBandId) {
      const gradeRate = await prisma.teacherSubjectRate.findFirst({
        where: {
          teacherId,
          subjectId,
          gradeBandId,
          isActive: true,
        },
      })

      if (gradeRate) {
        snapshotCompensationRate = Number(gradeRate.compensationRate)
        snapshotStudentFacingRate = Number(gradeRate.studentFacingRate)
      }
    }

    if (snapshotCompensationRate === null) {
      snapshotCompensationRate = Number(teacher.compensationRate)
    }
    if (snapshotStudentFacingRate === null) {
      snapshotStudentFacingRate = Number(teacher.studentFacingRate)
    }

    // ─── TRIAL CLASS ───
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
              snapshotCompensationRate,
              snapshotStudentFacingRate,
            },
          })
        )
      )

      try {
        const existingLink = await prisma.studentSubject.findFirst({
          where: { studentId, subjectId },
        })
        if (existingLink) {
          await prisma.studentSubject.update({
            where: { id: existingLink.id },
            data: { trialTaken: true },
          })
        } else {
          await prisma.studentSubject.create({
            data: {
              studentId,
              subjectId,
              trialTaken: true,
            },
          })
        }
      } catch (trialErr) {
        console.error("[Booking] Failed to update trialTaken:", trialErr)
      }

      // ─── Send booking emails (non-blocking) ───
      const appUrl = process.env.NEXTAUTH_URL || ""
      const teacherFullName = `${teacher.user.firstName} ${teacher.user.lastName}`
      const studentFullName = `${student.firstName} ${student.lastName}`

      const parentFormattedSlots = slotList.map((slot) =>
        fmtDateTz(new Date(slot), parentTZ)
      )
      const teacherFormattedSlots = slotList.map((slot) =>
        fmtDateTz(new Date(slot), teacherTZ)
      )

      if (student.parent?.user?.email) {
        sendEmail({
          to: student.parent.user.email,
          subject: `Trial class booked for ${student.firstName} — Expert Guru`,
          react: BookingConfirmation({
            parentName: student.parent.user.firstName,
            studentName: studentFullName,
            teacherName: teacherFullName,
            teacherEmail: teacher.user.email,
            subject: subject.name,
            scheduledSlots: parentFormattedSlots,
            duration: classDuration,
            totalClasses: trialClasses.length,
            isTrial: true,
            dashboardUrl: `${appUrl}/parent`,
          }),
        }).catch((err) => console.error("[Booking] Parent email failed:", err))
      }

      sendEmail({
        to: teacher.user.email,
        subject: `New trial class assigned — ${studentFullName} — Expert Guru`,
        react: TeacherNewClass({
          teacherName: teacher.user.firstName,
          studentName: studentFullName,
          studentGrade: student.grade,
          subject: subject.name,
          scheduledSlots: teacherFormattedSlots,
          duration: classDuration,
          totalClasses: trialClasses.length,
          isTrial: true,
          dashboardUrl: `${appUrl}/teacher`,
        }),
      }).catch((err) => console.error("[Booking] Teacher email failed:", err))

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

    // ─── NON-TRIAL ───
    const hourlyRate = snapshotStudentFacingRate
    const perClassAmount = hourlyRate * (classDuration / 60)
    const totalAmount = template
      ? template.suggestedPrice
      : perClassAmount * slotList.length
    const orderRef = generateOrderRef()

    const result = await prisma.$transaction(async (tx) => {
      // Conflict check INSIDE transaction
      for (const slot of slotList) {
        const slotDate = new Date(slot)
        const slotEnd = new Date(slotDate.getTime() + classDuration * 60000)

        const conflict = await tx.class.findFirst({
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
          throw new Error(
            `Teacher has a scheduling conflict at ${fmtShortDateTz(slotDate, teacherTZ)}`
          )
        }
      }

      let createdPackageId: string | null = packageId || null

      if (template) {
        const now = new Date()
        const expiryDate = new Date(now.getTime() + template.validityDays * 24 * 60 * 60 * 1000)

        const newPackage = await tx.package.create({
          data: {
            name: template.name,
            studentId,
            teacherId,
            subjectId,
            classesIncluded: template.classesIncluded,
            classesUsed: 0,
            pricePerClass: template.suggestedPrice / template.classesIncluded,
            totalPrice: template.suggestedPrice,
            validityDays: template.validityDays,
            startDate: now,
            expiryDate,
            status: "ACTIVE",
            templateId: template.id,
          },
        })

        createdPackageId = newPackage.id
      }

      // 1. Create the Payment record (PENDING)
      const txParentProfile = await tx.parentProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })

      let walletDeduction = 0
      let couponDiscount = 0
      let appliedCouponId: string | null = null
      let amountDue = totalAmount
      let discountNotes: string | null = null

      // ── COUPON + WALLET (combined flow) ──
      // Coupon is applied first (if code provided), then wallet auto-applies
      // on whatever amount remains. discountMethod value is ignored — both
      // always run when applicable.

      // ── Step 1: Apply coupon (if couponCode provided) ──
      if (couponCode && txParentProfile) {
        const coupon = await tx.coupon.findFirst({
          where: {
            code: { equals: couponCode.trim().toUpperCase(), mode: "insensitive" },
            status: "ACTIVE",
          },
          include: {
            assignments: { select: { parentProfileId: true } },
          },
        })

        if (coupon) {
          const now = new Date()
          const isWithinDates =
            now >= new Date(coupon.validFrom) && now <= new Date(coupon.validUntil)
          const isUnderGlobalCap =
            coupon.maxUsesTotal === null || coupon.usedCount < coupon.maxUsesTotal
          const meetsMinOrder =
            !coupon.minOrderAmount || totalAmount >= Number(coupon.minOrderAmount)

          let scopeValid = coupon.scope === "ALL_USERS"
          if (
            !scopeValid &&
            (coupon.scope === "SINGLE_USER" || coupon.scope === "MULTI_USER")
          ) {
            scopeValid = coupon.assignments.some(
              (a) => a.parentProfileId === txParentProfile.id
            )
          }

          const userUsageCount = await tx.couponUsage.count({
            where: { couponId: coupon.id, parentProfileId: txParentProfile.id },
          })
          const isUnderUserCap = userUsageCount < coupon.maxUsesPerUser

          if (
            isWithinDates &&
            isUnderGlobalCap &&
            meetsMinOrder &&
            scopeValid &&
            isUnderUserCap
          ) {
            if (coupon.discountType === "PERCENTAGE") {
              couponDiscount = (totalAmount * Number(coupon.discountValue)) / 100
              if (
                coupon.maxDiscountAmount &&
                couponDiscount > Number(coupon.maxDiscountAmount)
              ) {
                couponDiscount = Number(coupon.maxDiscountAmount)
              }
            } else {
              couponDiscount = Number(coupon.discountValue)
            }

            if (couponDiscount > totalAmount) {
              couponDiscount = totalAmount
            }

            couponDiscount = Math.round(couponDiscount * 100) / 100
            amountDue = Math.round((totalAmount - couponDiscount) * 100) / 100
            appliedCouponId = coupon.id

            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                parentProfileId: txParentProfile.id,
                bookingOrderId: null,
                discountApplied: couponDiscount,
              },
            })

            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            })

            const discountLabel =
              coupon.discountType === "PERCENTAGE"
                ? `${Number(coupon.discountValue)}% off`
                : `$${Number(coupon.discountValue).toFixed(2)} off`
            discountNotes = `Coupon ${coupon.code} applied (${discountLabel}): -$${couponDiscount.toFixed(2)}. Original total: $${totalAmount.toFixed(2)}`
          }
        }
      }

      // ── Step 2: Auto-apply wallet on remaining amount ──
      if (txParentProfile && amountDue > 0) {
        const walletResult = await applyWalletDiscount(
          tx,
          txParentProfile.id,
          amountDue
        )
        walletDeduction = walletResult.walletDeduction
        amountDue = walletResult.amountDue
        if (walletDeduction > 0) {
          const walletNote = `Wallet applied: -$${walletDeduction.toFixed(2)}`
          discountNotes = discountNotes
            ? `${discountNotes}. ${walletNote}`
            : `${walletNote}. Original total: $${totalAmount.toFixed(2)}`
        }
      }

      const finalAmountDue = amountDue
      const paymentMethod = finalAmountDue === 0
        ? (couponDiscount > 0 ? "OTHER" : "WALLET")
        : "BANK_TRANSFER"
      const paymentStatus = finalAmountDue === 0 ? "CONFIRMED" : "PENDING"

      const payment = await tx.payment.create({
        data: {
          studentId,
          packageId: createdPackageId || packageId || null,
          amount: finalAmountDue,
          walletDeduction: walletDeduction,
          couponId: appliedCouponId,
          couponDiscount: couponDiscount,
          method: paymentMethod,
          status: paymentStatus,
          adminNotes: discountNotes,
        },
      })

      const bookingOrder = await tx.bookingOrder.create({
        data: {
          orderRef,
          studentId,
          packageId: createdPackageId,
          teacherId,
          subjectId,
          totalClasses: slotList.length,
          totalAmount,
          walletDeduction: walletDeduction,
          couponId: appliedCouponId,
          couponDiscount: couponDiscount,
          status: finalAmountDue === 0 ? "PAID" : "PENDING_PAYMENT",
          paymentId: payment.id,
        },
      })

      if (appliedCouponId && txParentProfile) {
        await tx.couponUsage.updateMany({
          where: {
            couponId: appliedCouponId,
            parentProfileId: txParentProfile.id,
            bookingOrderId: null,
          },
          data: { bookingOrderId: bookingOrder.id },
        })
      }

      // After bookingOrder is created, link wallet transaction to this order
      if (walletDeduction > 0 && txParentProfile) {
        const wallet = await tx.wallet.findUnique({
          where: { parentProfileId: txParentProfile.id },
        })
        if (wallet) {
          // Update the most recent BOOKING_DISCOUNT transaction for this wallet to include the booking reference
          const recentWalletTx = await tx.walletTransaction.findFirst({
            where: {
              walletId: wallet.id,
              type: "BOOKING_DISCOUNT",
              referenceId: null,
            },
            orderBy: { createdAt: "desc" },
          })
          if (recentWalletTx) {
            await tx.walletTransaction.update({
              where: { id: recentWalletTx.id },
              data: { referenceId: bookingOrder.id },
            })
          }
        }
      }

      const classStatus = finalAmountDue === 0 ? "SCHEDULED" : "PENDING_PAYMENT"
      const classRecords = []
      for (const slot of slotList) {
        const newClass = await tx.class.create({
          data: {
            studentId,
            teacherId,
            subjectId,
            packageId: createdPackageId,
            bookingOrderId: bookingOrder.id,
            scheduledAt: new Date(slot),
            duration: classDuration,
            topicCovered: topicCovered || null,
            meetingLink: meetingLink || null,
            isTrial: false,
            status: classStatus,
            snapshotCompensationRate,
            snapshotStudentFacingRate,
          },
        })
        classRecords.push(newClass)
      }

      return { payment, bookingOrder, classRecords, createdPackageId }
    })

    // ── Referral conversion trigger ──
    if (!isTrialClass && session.user.role === "PARENT") {
      if (parentProfile) {
        prisma.$transaction(async (tx) => {
          await handleReferralConversion(tx, session.user.id, parentProfile.id)
        }).catch((err) => {
          console.error("[Referral conversion] Failed:", err)
        })
      }
    }

    // Send notifications to admin(s) and coordinator
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
        const packageNote = template ? ` (Package: ${template.name})` : ""

        await prisma.notification.createMany({
          data: uniqueNotifyIds.map((userId) => ({
            userId,
            type: "PAYMENT" as const,
            title: result.bookingOrder.status === "PAID"
              ? "New Booking — Paid"
              : "New Booking — Payment Pending",
            message: result.bookingOrder.status === "PAID"
              ? `${studentName} booked ${slotList.length} class${slotList.length > 1 ? "es" : ""} with ${teacherName}${packageNote}. Order: ${orderRef}. Amount: $${totalAmount.toFixed(2)} — fully paid via ${Number(result.bookingOrder.walletDeduction) > 0 ? "wallet" : "coupon"}.`
              : `${studentName} booked ${slotList.length} class${slotList.length > 1 ? "es" : ""} with ${teacherName}${packageNote}. Order: ${orderRef}. Amount: $${totalAmount.toFixed(2)}. Awaiting payment confirmation.`,
          })),
        })
      }
    } catch (notifyError) {
      console.error("Failed to send booking notifications:", notifyError)
    }

    // ── Send admin email for pending (bank transfer / offline) payments ──
    if (result.bookingOrder.status === "PENDING_PAYMENT") {
      try {
        const { default: PaymentPendingAdmin } = await import("@/emails/payment-pending-admin")
        const adminsForEmail = await prisma.user.findMany({
          where: { role: "ADMIN", status: "ACTIVE" },
          select: { email: true, firstName: true },
        })
        const studentFullNameAdmin = `${student.firstName} ${student.lastName}`
        const teacherFullNameAdmin = `${teacher.user.firstName} ${teacher.user.lastName}`
        const adminDashUrl = `${process.env.NEXTAUTH_URL || ""}/admin`
        const parentFormattedSlotsAdmin = slotList.map((slot: string) =>
          fmtDateTz(new Date(slot), parentTZ)
        )

        const hasWalletAdmin = Number(result.bookingOrder.walletDeduction) > 0
        const hasCouponAdmin = Number(result.bookingOrder.couponDiscount) > 0

        for (const admin of adminsForEmail) {
          sendEmail({
            to: admin.email,
            subject: `Payment Pending — ${result.bookingOrder.orderRef} — ${studentFullNameAdmin} — Expert Guru`,
            react: PaymentPendingAdmin({
              adminName: admin.firstName,
              studentName: studentFullNameAdmin,
              teacherName: teacherFullNameAdmin,
              subject: subject.name,
              totalClasses: slotList.length,
              scheduledSlots: parentFormattedSlotsAdmin,
              duration: classDuration,
              orderRef: result.bookingOrder.orderRef,
              totalAmount: `$${totalAmount.toFixed(2)}`,
              walletDeduction: hasWalletAdmin
                ? `$${Number(result.bookingOrder.walletDeduction).toFixed(2)}`
                : undefined,
              couponDiscount: hasCouponAdmin
                ? `$${Number(result.bookingOrder.couponDiscount).toFixed(2)}`
                : undefined,
              amountDue: `$${Number(result.payment.amount).toFixed(2)}`,
              parentName: student.parent?.user?.firstName || "Parent",
              parentEmail: student.parent?.user?.email || "",
              dashboardUrl: adminDashUrl,
            }),
          }).catch((err) => console.error("[Booking] Admin pending-payment email failed:", err))
        }
      } catch (adminEmailErr) {
        console.error("[Booking] Failed to send admin pending-payment emails:", adminEmailErr)
      }
    }    

    // ─── Send booking emails (non-blocking) ───
    const appUrl = process.env.NEXTAUTH_URL || ""
    const teacherFullName = `${teacher.user.firstName} ${teacher.user.lastName}`
    const studentFullName = `${student.firstName} ${student.lastName}`

    const parentFormattedSlots = slotList.map((slot) =>
      fmtDateTz(new Date(slot), parentTZ)
    )
    const teacherFormattedSlots = slotList.map((slot) =>
      fmtDateTz(new Date(slot), teacherTZ)
    )

    if (student.parent?.user?.email) {
      sendEmail({
        to: student.parent.user.email,
        subject: `Booking confirmed for ${student.firstName} — Expert Guru`,
        react: BookingConfirmation({
          parentName: student.parent.user.firstName,
          studentName: studentFullName,
          teacherName: teacherFullName,
          teacherEmail: teacher.user.email,
          subject: subject.name,
          scheduledSlots: parentFormattedSlots,
          duration: classDuration,
          totalClasses: slotList.length,
          isTrial: false,
          orderRef: result.bookingOrder.orderRef,
          totalAmount: `$${totalAmount.toFixed(2)}`,
          dashboardUrl: `${appUrl}/parent`,
        }),
      }).catch((err) => console.error("[Booking] Parent email failed:", err))
    }

    sendEmail({
      to: teacher.user.email,
      subject: `New classes assigned — ${studentFullName} — Expert Guru`,
      react: TeacherNewClass({
        teacherName: teacher.user.firstName,
        studentName: studentFullName,
        studentGrade: student.grade,
        subject: subject.name,
        scheduledSlots: teacherFormattedSlots,
        duration: classDuration,
        totalClasses: slotList.length,
        isTrial: false,
        dashboardUrl: `${appUrl}/teacher`,
      }),
    }).catch((err) => console.error("[Booking] Teacher email failed:", err))

    const hasCoupon = Number(result.bookingOrder.couponDiscount) > 0
    const hasWallet = Number(result.bookingOrder.walletDeduction) > 0
    const isPaid = result.bookingOrder.status === "PAID"

    return NextResponse.json(
      {
        message: isPaid
          ? `${slotList.length} class${slotList.length > 1 ? "es" : ""} booked — fully paid${hasCoupon ? " via coupon" : hasWallet ? " via wallet" : ""}!`
          : `${slotList.length} class${slotList.length > 1 ? "es" : ""} reserved — awaiting payment confirmation`,
        orderRef: result.bookingOrder.orderRef,
        bookingOrderId: result.bookingOrder.id,
        paymentId: result.payment.id,
        packageId: result.createdPackageId || null,
        classIds: result.classRecords.map((c) => c.id),
        totalClasses: slotList.length,
        totalAmount: `$${totalAmount.toFixed(2)}`,
        walletDeduction: hasWallet ? `$${Number(result.bookingOrder.walletDeduction).toFixed(2)}` : null,
        couponDiscount: hasCoupon ? `$${Number(result.bookingOrder.couponDiscount).toFixed(2)}` : null,
        amountDue: `$${Number(result.payment.amount).toFixed(2)}`,
        pendingPayment: !isPaid,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("POST /api/classes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/classes
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const classId = body.classId || body.id
    const action = body.action

    if (!classId || !action) {
      return NextResponse.json(
        { error: "classId and action are required" },
        { status: 400 }
      )
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, parentId: true,
            parent: {
              select: {
                timezone: true,
                user: { select: { firstName: true, email: true } },
              },
            },
          },
        },
        teacher: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
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

    // Resolve timezones for the recipient of each email/notification
    const parentTZ = classRecord.student.parent?.timezone || "America/New_York"
    const teacherTZ = classRecord.teacher.timezone || "Asia/Kolkata"

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

      const now = new Date()
      const scheduledTime = new Date(classRecord.scheduledAt)
      const bufferMs = 30 * 60 * 1000
      if (scheduledTime.getTime() > now.getTime() + bufferMs) {
        return NextResponse.json(
          {
            error: `Cannot mark a future class as completed. This class is scheduled for ${fmtShortDateTz(scheduledTime, teacherTZ)}. You can mark it complete during or after the scheduled time.`,
          },
          { status: 400 }
        )
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

      // Send class completed email to parent
      if (classRecord.student.parent?.user?.email) {
        const appUrl = process.env.NEXTAUTH_URL || ""

        sendEmail({
          to: classRecord.student.parent.user.email,
          subject: `Class completed — ${classRecord.student.firstName}'s ${classRecord.subject.name} session — Expert Guru`,
          react: ClassCompleted({
            parentName: classRecord.student.parent.user.firstName,
            studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
            teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
            subject: classRecord.subject.name,
            scheduledAt: fmtDateTz(classRecord.scheduledAt, parentTZ),
            duration: classRecord.duration,
            topicCovered: topicCovered || classRecord.topicCovered || undefined,
            sessionNotes: sessionNotes || classRecord.sessionNotes || undefined,
            isTrial: classRecord.isTrial,
            dashboardUrl: `${appUrl}/parent`,
          }),
        }).catch((err) => console.error("[Complete] Parent email failed:", err))
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

      if (classRecord.isTrial) {
        try {
          const studentSubjectLink = await prisma.studentSubject.findFirst({
            where: { studentId: classRecord.student.id, subjectId: classRecord.subjectId },
          })
          if (studentSubjectLink) {
            await prisma.studentSubject.update({
              where: { id: studentSubjectLink.id },
              data: { trialTaken: false },
            })
          }
        } catch (trialErr) {
          console.error("[Cancel] Failed to reset trialTaken:", trialErr)
        }
      }

      // Notify teacher (use teacher's timezone)
      await prisma.notification.create({
        data: {
          userId: classRecord.teacher.user.id,
          type: "CLASS",
          title: "Class Cancelled",
          message: `${classRecord.student.firstName} ${classRecord.student.lastName}'s ${classRecord.subject.name} class on ${fmtShortDateTz(classRecord.scheduledAt, teacherTZ)} has been cancelled by the student.`,
        },
      })

      // Send cancellation email to teacher (use teacher's timezone)
      const appUrl = process.env.NEXTAUTH_URL || ""

      sendEmail({
        to: classRecord.teacher.user.email,
        subject: `Class cancelled — ${classRecord.student.firstName} ${classRecord.student.lastName} — Expert Guru`,
        react: ClassCancelled({
          recipientName: classRecord.teacher.user.firstName,
          studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
          teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
          subject: classRecord.subject.name,
          scheduledAt: fmtDateTz(classRecord.scheduledAt, teacherTZ),
          duration: classRecord.duration,
          cancelledBy: "student",
          cancelReason: reason || undefined,
          dashboardUrl: `${appUrl}/teacher`,
        }),
      }).catch((err) => console.error("[Cancel] Teacher email failed:", err))

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

      if (classRecord.isTrial) {
        try {
          const studentSubjectLink = await prisma.studentSubject.findFirst({
            where: { studentId: classRecord.student.id, subjectId: classRecord.subjectId },
          })
          if (studentSubjectLink) {
            await prisma.studentSubject.update({
              where: { id: studentSubjectLink.id },
              data: { trialTaken: false },
            })
          }
        } catch (trialErr) {
          console.error("[Cancel] Failed to reset trialTaken:", trialErr)
        }
      }

      // Notify parent (use parent's timezone)
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
              message: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName} has cancelled the ${classRecord.subject.name} class on ${fmtShortDateTz(classRecord.scheduledAt, parentTZ)}.`,
            },
          })
        }
      }

      // Send cancellation email to parent (use parent's timezone)
      if (classRecord.student.parent?.user?.email) {
        const appUrl = process.env.NEXTAUTH_URL || ""

        sendEmail({
          to: classRecord.student.parent.user.email,
          subject: `Class cancelled by teacher — ${classRecord.subject.name} — Expert Guru`,
          react: ClassCancelled({
            recipientName: classRecord.student.parent.user.firstName,
            studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
            teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
            subject: classRecord.subject.name,
            scheduledAt: fmtDateTz(classRecord.scheduledAt, parentTZ),
            duration: classRecord.duration,
            cancelledBy: "teacher",
            cancelReason: reason || undefined,
            dashboardUrl: `${appUrl}/parent`,
          }),
        }).catch((err) => console.error("[Cancel] Parent email failed:", err))
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
    // ACTION: update_student_notes
    // ──────────────────────────────────────────────
    if (action === "update_student_notes") {
      if (!["ADMIN", "COORDINATOR", "PARENT"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (userRole === "PARENT") {
        const parent = await prisma.parentProfile.findUnique({
          where: { userId: session.user.id },
          include: { students: { select: { id: true } } },
        })
        if (!parent || !parent.students.some((s) => s.id === classRecord.studentId)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }

      if (!["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED", "COMPLETED"].includes(classRecord.status)) {
        return NextResponse.json({ error: "Cannot update notes for this class" }, { status: 400 })
      }

      const { studentNotes } = body
      if (studentNotes === undefined) {
        return NextResponse.json({ error: "studentNotes is required" }, { status: 400 })
      }

      const updated = await prisma.class.update({
        where: { id: classId },
        data: { studentNotes: studentNotes.trim() || null },
      })

      // Notify the teacher (use teacher's timezone for the date reference)
      if (studentNotes && studentNotes.trim()) {
        await prisma.notification.create({
          data: {
            userId: classRecord.teacher.user.id,
            type: "CLASS",
            title: "Student Notes Added",
            message: `${classRecord.student.firstName} ${classRecord.student.lastName} added notes for the ${classRecord.subject.name} class on ${fmtShortDateTz(classRecord.scheduledAt, teacherTZ)}: "${studentNotes.trim().substring(0, 100)}${studentNotes.trim().length > 100 ? "..." : ""}"`,
          },
        })
      }

      return NextResponse.json({
        message: "Student notes updated",
        classId: updated.id,
        studentNotes: updated.studentNotes,
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

      const newScheduledAt = body.newScheduledAt || body.scheduledAt
      const reason = body.reason || body.rescheduleReason || ""
      if (!newScheduledAt) {
        return NextResponse.json({ error: "newScheduledAt is required" }, { status: 400 })
      }

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

      const initiator = ["PARENT"].includes(userRole) ? "student" : "teacher"
      if (initiator === "student") {
        // Notify teacher (use teacher's timezone)
        await prisma.notification.create({
          data: {
            userId: classRecord.teacher.user.id,
            type: "CLASS",
            title: "Class Rescheduled",
            message: `${classRecord.student.firstName}'s ${classRecord.subject.name} class has been rescheduled to ${fmtShortDateTz(newDate, teacherTZ)}.`,
          },
        })

        // Send reschedule email to teacher (use teacher's timezone)
        const appUrl = process.env.NEXTAUTH_URL || ""
        sendEmail({
          to: classRecord.teacher.user.email,
          subject: `Class rescheduled — ${classRecord.student.firstName} ${classRecord.student.lastName} — Expert Guru`,
          react: ClassRescheduled({
            recipientName: classRecord.teacher.user.firstName,
            studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
            teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
            subject: classRecord.subject.name,
            previousSchedule: fmtDateTz(classRecord.scheduledAt, teacherTZ),
            newSchedule: fmtDateTz(newDate, teacherTZ),
            duration: classRecord.duration,
            rescheduledBy: "student",
            reason: reason || undefined,
            dashboardUrl: `${appUrl}/teacher`,
          }),
        }).catch((err) => console.error("[Reschedule] Teacher email failed:", err))

      } else if (classRecord.student.parentId) {
        // Notify parent (use parent's timezone)
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
              message: `${classRecord.teacher.user.firstName} has rescheduled the ${classRecord.subject.name} class to ${fmtShortDateTz(newDate, parentTZ)}.`,
            },
          })
        }

        // Send reschedule email to parent (use parent's timezone)
        if (classRecord.student.parent?.user?.email) {
          const appUrl = process.env.NEXTAUTH_URL || ""
          sendEmail({
            to: classRecord.student.parent.user.email,
            subject: `Class rescheduled by teacher — ${classRecord.subject.name} — Expert Guru`,
            react: ClassRescheduled({
              recipientName: classRecord.student.parent.user.firstName,
              studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
              teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
              subject: classRecord.subject.name,
              previousSchedule: fmtDateTz(classRecord.scheduledAt, parentTZ),
              newSchedule: fmtDateTz(newDate, parentTZ),
              duration: classRecord.duration,
              rescheduledBy: "teacher",
              reason: reason || undefined,
              dashboardUrl: `${appUrl}/parent`,
            }),
          }).catch((err) => console.error("[Reschedule] Parent email failed:", err))
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

      // Notify parent (use parent's timezone)
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
              message: `A meeting link has been added for ${classRecord.student.firstName}'s ${classRecord.subject.name} class on ${fmtShortDateTz(classRecord.scheduledAt, parentTZ)}. You can join from your dashboard.`,
            },
          })
        }
      }

      // Send meeting link email to parent (use parent's timezone)
      if (classRecord.student.parent?.user?.email) {
        const appUrl = process.env.NEXTAUTH_URL || ""

        sendEmail({
          to: classRecord.student.parent.user.email,
          subject: `Meeting link ready — ${classRecord.student.firstName}'s ${classRecord.subject.name} class — Expert Guru`,
          react: MeetingLinkShared({
            parentName: classRecord.student.parent.user.firstName,
            studentName: `${classRecord.student.firstName} ${classRecord.student.lastName}`,
            teacherName: `${classRecord.teacher.user.firstName} ${classRecord.teacher.user.lastName}`,
            subject: classRecord.subject.name,
            scheduledAt: fmtDateTz(classRecord.scheduledAt, parentTZ),
            duration: classRecord.duration,
            meetingLink: finalLink,
            dashboardUrl: `${appUrl}/parent`,
          }),
        }).catch((err) => console.error("[MeetingLink] Parent email failed:", err))
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
