import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorStudentsClient } from "./CoordinatorStudentsClient"
import { getTzAbbr } from "@/lib/timezone"

export const dynamic = "force-dynamic"

export default async function CoordinatorStudentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/unauthorized")

  const studentsRaw = await prisma.student.findMany({
    where: { coordinatorId: coordinator.id },
    include: {
      parent: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      subjects: { include: { subject: { select: { name: true } } } },
      gradeRef: { include: { gradeBand: { select: { displayName: true } } } },
      packages: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          classesIncluded: true,
          classesUsed: true,
          status: true,
          expiryDate: true,
          subject: { select: { name: true } },
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
      classes: {
        where: {
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        take: 3,
        include: {
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          subject: { select: { name: true } },
        },
      },
      payments: {
        where: { status: "PENDING" },
        select: { id: true, amount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const students = studentsRaw.map((s) => {
    const totalIncluded = s.packages.reduce((sum, p) => sum + p.classesIncluded, 0)
    const totalUsed = s.packages.reduce((sum, p) => sum + p.classesUsed, 0)
    const remaining = totalIncluded - totalUsed

    const nextClass = s.classes[0]
    const mainTeacher =
      s.packages[0]?.teacher?.user ??
      nextClass?.teacher?.user ??
      null

    let packageStatus = "inactive"
    if (s.packages.length > 0) packageStatus = "active"
    else if (s.onboardingStage === "TRIAL_SCHEDULED") packageStatus = "trial"
    else if (s.onboardingStage === "TRIAL_COMPLETED") packageStatus = "trial_completed"
    else if (s.payments.length > 0) packageStatus = "pending_payment"

    let actionType = "alert"
    if (nextClass) actionType = "calendar"
    else if (packageStatus === "pending_payment") actionType = "payment"
    else if (packageStatus === "trial_completed") actionType = "package"

    // Timezone for next class display
    const nextClassTZ = nextClass?.timezone || "America/New_York"
    const nextClassTzAbbr = nextClass ? getTzAbbr(nextClassTZ, nextClass.scheduledAt) : ""

    return {
      id: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      parentName: s.parent
        ? `${s.parent.user.firstName} ${s.parent.user.lastName}`
        : "—",
      parentEmail: s.parent?.user.email ?? "—",
      parentPhone: s.parent?.user.phone ?? "—",
      grade: (s as any).gradeRef?.gradeBand
        ? `${s.grade} (${(s as any).gradeRef.gradeBand.displayName})`
        : s.grade || "—",
      school: s.school ?? "—",
      timezone: s.timezone ?? "—",
      scheduleNotes: s.scheduleNotes ?? "",
      onboardingStage: s.onboardingStage,
      subjects: s.subjects.map((ss) => ss.subject.name),
      packageStatus,
      classesRemaining: String(remaining),
      nextClass: nextClass
        ? nextClass.scheduledAt.toLocaleDateString("en-US", {
            timeZone: nextClassTZ,
            month: "short",
            day: "numeric",
          }) +
          ", " +
          nextClass.scheduledAt.toLocaleTimeString("en-US", {
            timeZone: nextClassTZ,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }) +
          " " + nextClassTzAbbr
        : "—",
      teacher: mainTeacher
        ? `${mainTeacher.firstName} ${mainTeacher.lastName}`
        : "—",
      actionType,
      // Detailed data for the modal
      activePackages: s.packages.map((p) => ({
        name: p.name,
        subject: p.subject.name,
        teacher: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
        classesUsed: p.classesUsed,
        classesIncluded: p.classesIncluded,
        expiryDate: p.expiryDate.toLocaleDateString("en-US", {
          timeZone: "America/New_York",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
      upcomingClasses: s.classes.map((c) => {
        const classTZ = c.timezone || "America/New_York"
        const tzAbbr = getTzAbbr(classTZ, c.scheduledAt)
        return {
          subject: c.subject.name,
          teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
          scheduledAt: c.scheduledAt.toLocaleDateString("en-US", {
            timeZone: classTZ,
            weekday: "short",
            month: "short",
            day: "numeric",
          }) +
            " at " +
            c.scheduledAt.toLocaleTimeString("en-US", {
              timeZone: classTZ,
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }) +
            " " + tzAbbr,
          status: c.status,
          isTrial: c.isTrial,
        }
      }),
      pendingPaymentCount: s.payments.length,
      pendingPaymentTotal: s.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      registeredAt: s.createdAt.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }
  })

  const kpis = {
    total: students.length,
    active: students.filter((s) => s.packageStatus === "active").length,
    trial: students.filter((s) =>
      ["trial", "trial_completed"].includes(s.packageStatus)
    ).length,
    inactive: students.filter((s) =>
      ["inactive", "pending_payment"].includes(s.packageStatus)
    ).length,
  }

  return <CoordinatorStudentsClient students={students} kpis={kpis} />
}
