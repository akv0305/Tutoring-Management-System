import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherHistoryClient } from "./TeacherHistoryClient"

export default async function ClassHistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TEACHER") redirect("/unauthorized")

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) redirect("/unauthorized")

  // Fetch all past/completed/cancelled classes
  const classesRaw = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      status: {
        in: [
          "COMPLETED",
          "CANCELLED_STUDENT",
          "CANCELLED_TEACHER",
          "NO_SHOW_STUDENT",
          "NO_SHOW_TEACHER",
        ],
      },
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      subject: { select: { name: true } },
    },
    orderBy: { scheduledAt: "desc" },
  })

  const classes = classesRaw.map((c) => {
    const endTime = new Date(c.scheduledAt.getTime() + (c.duration ?? 60) * 60000)
    return {
      id: c.id,
      date: c.scheduledAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      time:
        c.scheduledAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }) +
        "–" +
        endTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      student: `${c.student.firstName} ${c.student.lastName}`,
      subject: c.subject.name,
      topic: c.topicCovered ?? "—",
      duration: `${c.duration ?? 60} min`,
      status: c.status.toLowerCase(),
      feedbackRating: c.parentRating,
      scheduledAt: c.scheduledAt.toISOString(),
    }
  })

  // Stats
  const completed = classes.filter((c) => c.status === "completed").length
  const cancelled = classes.filter((c) =>
    ["cancelled_student", "cancelled_teacher"].includes(c.status)
  ).length
  const noShow = classes.filter((c) =>
    ["no_show_student", "no_show_teacher"].includes(c.status)
  ).length
  const total = classes.length
  const completionRate =
    total > 0 ? ((completed / total) * 100).toFixed(0) : "—"

  const stats = {
    total,
    completed,
    cancelled,
    noShow,
    completionRate,
  }

  return <TeacherHistoryClient classes={classes} stats={stats} />
}
