import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingClient } from "./OnboardingClient"

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/unauthorized")

  // Fetch students that are NOT fully converted/active yet, plus converted ones for the tab
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
      classes: {
        where: { isTrial: true },
        orderBy: { scheduledAt: "desc" },
        take: 1,
        select: { status: true, parentRating: true, scheduledAt: true },
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

    const trial = s.classes[0]

    return {
      id: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      parentName: s.parent
        ? `${s.parent.user.firstName} ${s.parent.user.lastName}`
        : "—",
      email: s.parent?.user.email ?? "—",
      phone: s.parent?.user.phone ?? "—",
      grade: `Grade ${s.grade}`,
      subjects: s.subjects.map((ss) => ss.subject.name),
      timezone: s.timezone ?? "EST",
      status,
      registered: s.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      trialDate: trial
        ? trial.scheduledAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : null,
      trialRating: trial?.parentRating ?? null,
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
