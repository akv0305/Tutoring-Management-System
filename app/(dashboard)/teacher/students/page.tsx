import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherStudentsClient } from "./TeacherStudentsClient"

export const dynamic = "force-dynamic"

export default async function TeacherStudentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "TEACHER") redirect("/unauthorized")

  const teacher = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!teacher) redirect("/unauthorized")

  // Get all packages for this teacher (to find assigned students)
  const packages = await prisma.package.findMany({
    where: { teacherId: teacher.id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, grade: true, status: true } },
      subject: { select: { name: true } },
    },
  })

  // Also get trial classes (students without packages)
  const trialClasses = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      isTrial: true,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, grade: true, status: true } },
      subject: { select: { name: true } },
    },
  })

  // Build unique student map
  const studentMap = new Map<string, {
    id: string
    studentName: string
    grade: string
    subject: string
    package: string
    classesRemaining: number
    status: string
  }>()

  for (const pkg of packages) {
    const s = pkg.student
    const remaining = pkg.classesIncluded - pkg.classesUsed
    const existing = studentMap.get(s.id)
    if (!existing || remaining > (existing.classesRemaining ?? 0)) {
      studentMap.set(s.id, {
        id: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        grade: `Grade ${s.grade}`,
        subject: pkg.subject.name,
        package: `${pkg.classesIncluded} Classes`,
        classesRemaining: remaining,
        status: pkg.status === "ACTIVE" ? "active" : "inactive",
      })
    }
  }

  // Add trial students not already in map
  for (const tc of trialClasses) {
    const s = tc.student
    if (!studentMap.has(s.id)) {
      studentMap.set(s.id, {
        id: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        grade: `Grade ${s.grade}`,
        subject: tc.subject.name,
        package: "Trial",
        classesRemaining: 1,
        status: "trial",
      })
    }
  }

  // Get next class and rating for each student
  const studentIds = [...studentMap.keys()]

  const nextClasses = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      studentId: { in: studentIds },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    select: { studentId: true, scheduledAt: true },
  })

  const ratings = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      studentId: { in: studentIds },
      parentRating: { not: null },
    },
    select: { studentId: true, parentRating: true },
  })

  // Build next class map (first upcoming per student)
  const nextClassMap = new Map<string, string>()
  for (const nc of nextClasses) {
    if (!nextClassMap.has(nc.studentId)) {
      nextClassMap.set(
        nc.studentId,
        nc.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
          ", " +
          nc.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      )
    }
  }

  // Build avg rating map per student
  const ratingMap = new Map<string, number>()
  const ratingCounts = new Map<string, number[]>()
  for (const r of ratings) {
    if (!ratingCounts.has(r.studentId)) ratingCounts.set(r.studentId, [])
    ratingCounts.get(r.studentId)!.push(r.parentRating as number)
  }
  for (const [sid, arr] of ratingCounts) {
    ratingMap.set(sid, arr.reduce((a, b) => a + b, 0) / arr.length)
  }

  // Completed classes this month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const classesThisMonth = await prisma.class.count({
    where: {
      teacherId: teacher.id,
      status: "COMPLETED",
      completedAt: { gte: monthStart },
    },
  })

  const students = [...studentMap.values()].map((s) => ({
    ...s,
    nextClass: nextClassMap.get(s.id) ?? "—",
    ratingGiven: ratingMap.get(s.id) ?? null,
  }))

  const kpis = {
    active: students.filter((s) => s.status === "active").length,
    trial: students.filter((s) => s.status === "trial").length,
    classesThisMonth,
  }

  return <TeacherStudentsClient students={students} kpis={kpis} />
}
