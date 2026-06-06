import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingClient } from "./OnboardingClient"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
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
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
      subjects: { include: { subject: { select: { name: true } } } },
      gradeRef: { include: { gradeBand: { select: { displayName: true } } } },
      classes: {
        orderBy: { scheduledAt: "desc" },
        include: {
          subject: { select: { name: true } },
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
      packages: {
        where: { status: "ACTIVE" },
        include: {
          subject: { select: { name: true } },
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
      bookingOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const students = studentsRaw.map((s) => {
    let status = "new_lead"
    if (s.onboardingStage === "NEW_LEAD") status = "new_lead"
    else if (s.onboardingStage === "TRIAL_SCHEDULED") status = "trial_scheduled"
    else if (s.onboardingStage === "TRIAL_COMPLETED") status = "trial_completed"
    else if (s.onboardingStage === "CONVERTED") status = "converted"
    else if (s.onboardingStage === "DROPPED") status = "dropped"

    const trialClass = s.classes.find((c) => c.isTrial)

    return {
      id: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      parentName: s.parent
        ? `${s.parent.user.firstName} ${s.parent.user.lastName}`
        : "—",
      email: s.parent?.user.email ?? "—",
      phone: s.parent?.user.phone ?? "—",
      grade: (s as any).gradeRef?.gradeBand
        ? `${s.grade} (${(s as any).gradeRef.gradeBand.displayName})`
        : s.grade || "—",
      school: s.school ?? null,
      gender: s.gender ?? null,
      subjects: s.subjects.map((ss) => ss.subject.name),
      timezone: s.timezone ?? "EST",
      parentTimezone: s.parent?.timezone ?? null,
      scheduleNotes: s.scheduleNotes ?? null,
      status,
      registered: s.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      updatedAt: s.updatedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      trialDate: trialClass
        ? trialClass.scheduledAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : null,
      trialStatus: trialClass
        ? trialClass.status.toLowerCase().replace(/_/g, " ")
        : null,
      trialRating: trialClass?.parentRating ?? null,
      trialFeedback: trialClass?.parentFeedback ?? null,
      classes: s.classes.map((c) => ({
        id: c.id,
        date: c.scheduledAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: c.scheduledAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        subject: c.subject.name,
        teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
        status: c.status.toLowerCase().replace(/_/g, " "),
        isTrial: c.isTrial,
        topic: c.topicCovered ?? null,
        rating: c.parentRating ?? null,
        feedback: c.parentFeedback ?? null,
      })),
      packages: s.packages.map((p) => ({
        id: p.id,
        name: p.name,
        subject: p.subject.name,
        teacher: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
        classesIncluded: p.classesIncluded,
        classesUsed: p.classesUsed,
        remaining: p.classesIncluded - p.classesUsed,
        status: p.status.toLowerCase(),
        expiryDate: p.expiryDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
      bookingOrders: s.bookingOrders.map((o) => ({
        id: o.id,
        orderRef: o.orderRef,
        status: o.status.toLowerCase().replace(/_/g, " "),
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
    }
  })

  const counts = {
    total: students.length,
    newLead: students.filter((s) => s.status === "new_lead").length,
    trialScheduled: students.filter((s) => s.status === "trial_scheduled").length,
    trialCompleted: students.filter((s) => s.status === "trial_completed").length,
    converted: students.filter((s) => s.status === "converted").length,
  }

  return <OnboardingClient students={students} counts={counts} />
}
