// app/(dashboard)/parent/progress/page.tsx
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProgressClient } from "./ProgressClient"

export const dynamic = "force-dynamic"

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: {
      students: {
        include: {
          subjects: { include: { subject: true } },
          classes: {
            include: {
              teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
              subject: { select: { name: true } },
            },
            orderBy: { scheduledAt: "desc" },
          },
        },
      },
    },
  })
  if (!parent) redirect("/unauthorized")

  const now = new Date()

  // Build per-student, per-subject progress
  const studentProgress = parent.students.map((student) => {
    const fullName = `${student.firstName} ${student.lastName}`

    // Group classes by subject
    const subjectMap: Record<
      string,
      {
        subjectName: string
        teacherName: string
        teacherInitials: string
        totalClasses: number
        completedClasses: number
        cancelledClasses: number
        noShowClasses: number
        avgRating: number | null
        ratingCount: number
        lastSessionDate: string | null
        lastSessionNotes: string | null
        lastSessionTopic: string | null
        recentFeedback: {
          date: string
          rating: number
          note: string
          teacher: string
          teacherInitials: string
        }[]
      }
    > = {}

    for (const cls of student.classes) {
      const subName = cls.subject.name
      if (!subjectMap[subName]) {
        const tName = `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`
        subjectMap[subName] = {
          subjectName: subName,
          teacherName: tName,
          teacherInitials: `${cls.teacher.user.firstName[0]}${cls.teacher.user.lastName[0]}`,
          totalClasses: 0,
          completedClasses: 0,
          cancelledClasses: 0,
          noShowClasses: 0,
          avgRating: null,
          ratingCount: 0,
          lastSessionDate: null,
          lastSessionNotes: null,
          lastSessionTopic: null,
          recentFeedback: [],
        }
      }
      const entry = subjectMap[subName]
      entry.totalClasses++

      if (cls.status === "COMPLETED") {
        entry.completedClasses++
        if (cls.parentRating) {
          entry.ratingCount++
          entry.avgRating =
            entry.avgRating === null
              ? cls.parentRating
              : (entry.avgRating * (entry.ratingCount - 1) + cls.parentRating) / entry.ratingCount
        }
        // Track latest completed session
        const completedDate = cls.completedAt ?? cls.scheduledAt
        if (!entry.lastSessionDate || completedDate > new Date(entry.lastSessionDate)) {
          entry.lastSessionDate = completedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
          entry.lastSessionNotes = cls.sessionNotes ?? null
          entry.lastSessionTopic = cls.topicCovered ?? null
        }
        // Collect feedback (teacher notes on completed classes)
        if (cls.sessionNotes || cls.parentFeedback) {
          const tName = `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`
          entry.recentFeedback.push({
            date: (cls.completedAt ?? cls.scheduledAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            rating: cls.parentRating ?? 0,
            note: cls.sessionNotes ?? cls.parentFeedback ?? "",
            teacher: tName,
            teacherInitials: `${cls.teacher.user.firstName[0]}${cls.teacher.user.lastName[0]}`,
          })
        }
      } else if (
        cls.status === "CANCELLED_STUDENT" ||
        cls.status === "CANCELLED_TEACHER"
      ) {
        entry.cancelledClasses++
      } else if (
        cls.status === "NO_SHOW_STUDENT" ||
        cls.status === "NO_SHOW_TEACHER"
      ) {
        entry.noShowClasses++
      }
    }

    // Trim feedback to last 5 per subject
    for (const key of Object.keys(subjectMap)) {
      subjectMap[key].recentFeedback = subjectMap[key].recentFeedback.slice(0, 5)
    }

    // Overall stats for this student
    const allClasses = student.classes
    const totalCompleted = allClasses.filter((c) => c.status === "COMPLETED").length
    const totalScheduled = allClasses.filter((c) =>
      ["SCHEDULED", "CONFIRMED", "PENDING_PAYMENT"].includes(c.status)
    ).length
    const totalCancelled = allClasses.filter((c) =>
      ["CANCELLED_STUDENT", "CANCELLED_TEACHER"].includes(c.status)
    ).length
    const totalNoShow = allClasses.filter((c) =>
      ["NO_SHOW_STUDENT", "NO_SHOW_TEACHER"].includes(c.status)
    ).length
    const attendanceRate =
      totalCompleted + totalCancelled + totalNoShow > 0
        ? Math.round(
            (totalCompleted / (totalCompleted + totalCancelled + totalNoShow)) * 100
          )
        : 100
    const ratingsGiven = allClasses.filter((c) => c.parentRating !== null)
    const avgRatingGiven =
      ratingsGiven.length > 0
        ? (ratingsGiven.reduce((sum, c) => sum + (c.parentRating ?? 0), 0) / ratingsGiven.length).toFixed(1)
        : "—"

    // Active subjects count
    const activeSubjects = Object.keys(subjectMap).length

    // Current month classes
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthCompleted = allClasses.filter(
      (c) =>
        c.status === "COMPLETED" &&
        (c.completedAt ?? c.scheduledAt) >= monthStart
    ).length

    return {
      studentId: student.id,
      studentName: fullName,
      grade: student.grade,
      subjects: Object.values(subjectMap),
      stats: {
        totalCompleted,
        totalScheduled,
        totalCancelled,
        totalNoShow,
        attendanceRate,
        avgRatingGiven,
        activeSubjects,
        thisMonthCompleted,
      },
    }
  })

  return <ProgressClient students={studentProgress} />
}
