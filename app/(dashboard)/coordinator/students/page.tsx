import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorStudentsClient } from "./CoordinatorStudentsClient"

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
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      subjects: { include: { subject: { select: { name: true } } } },
      packages: {
        where: { status: "ACTIVE" },
        select: {
          classesIncluded: true,
          classesUsed: true,
          status: true,
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
        take: 1,
        include: {
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
      payments: {
        where: { status: "PENDING" },
        select: { id: true },
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

    return {
      id: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      parentName: s.parent
        ? `${s.parent.user.firstName} ${s.parent.user.lastName}`
        : "—",
      grade: `Grade ${s.grade}`,
      subjects: s.subjects.map((ss) => ss.subject.name),
      packageStatus,
      classesRemaining: String(remaining),
      nextClass: nextClass
        ? nextClass.scheduledAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }) +
          ", " +
          nextClass.scheduledAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "—",
      teacher: mainTeacher
        ? `${mainTeacher.firstName} ${mainTeacher.lastName}`
        : "—",
      actionType,
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
