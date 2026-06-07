import { prisma } from "@/lib/prisma"
import { TeachersClient } from "./TeachersClient"

export const dynamic = "force-dynamic"

export default async function TeachersPage() {
  const now = new Date()
  const fourWeeksFromNow = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

  const teachersRaw = await prisma.teacherProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      subjects: {
        include: { subject: { select: { id: true, name: true, category: true } } },
      },
      packages: {
        where: { status: "ACTIVE" },
        select: { studentId: true },
      },
      availabilities: {
        where: { isEnabled: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      blockedDates: {
        where: { blockedDate: { gte: now } },
        select: { blockedDate: true },
      },
      classes: {
        where: {
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          scheduledAt: { gte: now, lte: fourWeeksFromNow },
        },
        select: {
          scheduledAt: true,
          duration: true,
          subject: { select: { name: true } },
          student: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const teachers = teachersRaw.map((t) => {
    const uniqueStudentIds = new Set(t.packages.map((p) => p.studentId))

    let weeklyHours = 0
    t.availabilities.forEach((a) => {
      const startH = parseInt(a.startTime.split(":")[0], 10)
      const endH = parseInt(a.endTime.split(":")[0], 10)
      weeklyHours += Math.max(0, endH - startH)
    })

    return {
      id: t.id,
      teacherName: `${t.user.firstName} ${t.user.lastName}`,
      initials: `${t.user.firstName[0] || ""}${t.user.lastName[0] || ""}`.toUpperCase(),
      email: t.user.email,
      phone: t.user.phone || null,
      qualification: t.qualification ?? "—",
      bio: t.bio || null,
      subjects: t.subjects.map((ts) => ts.subject.name),
      subjectIds: t.subjects.map((ts) => ts.subject.id),
      hourlyRate: `$${Number(t.compensationRate)}/hr`,
      studentFacingRate: `$${Number(t.studentFacingRate)}/hr`,
      rating: Number(t.rating),
      totalReviews: t.totalReviews,
      activeStudents: uniqueStudentIds.size,
      experience: t.experience,
      status: t.status.toLowerCase().replace("_", " "),
      timezone: t.timezone,
      availabilitySlots: t.availabilities.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
      blockedDates: t.blockedDates.map((b) => b.blockedDate.toISOString().split("T")[0]),
      upcomingClasses: t.classes.map((c) => ({
        scheduledAt: c.scheduledAt.toISOString(),
        duration: c.duration,
        subject: c.subject.name,
        student: `${c.student.firstName} ${c.student.lastName}`,
      })),
      weeklyHours,
      upcomingClassCount: t.classes.length,
      // Grade-based rate info
      hasGradeRates: gradeRateMap.has(t.id),
      rateRange: (() => {
        const g = gradeRateMap.get(t.id)
        if (!g) return null
        const studentRange = g.minStudent === g.maxStudent
          ? `$${g.minStudent}/hr`
          : `$${g.minStudent}–$${g.maxStudent}/hr`
        const compRange = g.minComp === g.maxComp
          ? `$${g.minComp}/hr`
          : `$${g.minComp}–$${g.maxComp}/hr`
        return `${studentRange} (comp: ${compRange})`
      })(),
      gradeRateCount: gradeRateMap.get(t.id)?.count ?? 0,
    }
  })

  const activeCount = teachers.filter((t) => t.status === "active").length
  const onLeaveCount = teachers.filter((t) => t.status === "on leave").length
  const avgRating =
    teachers.length > 0
      ? (
          teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length
        ).toFixed(1)
      : "0.0"

  const kpis = {
    total: teachers.length,
    active: activeCount,
    onLeave: onLeaveCount,
    avgRating: `${avgRating} ★`,
  }

  // Fetch subjects for modals
  const subjectsRaw = await prisma.subject.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  })

  // ── Grade-based rate ranges per teacher ──
  const gradeRatesRaw = await prisma.teacherSubjectRate.findMany({
    where: { isActive: true },
    select: {
      teacherId: true,
      studentFacingRate: true,
      compensationRate: true,
    },
  })

  const gradeRateMap = new Map<string, { minStudent: number; maxStudent: number; minComp: number; maxComp: number; count: number }>()
  for (const r of gradeRatesRaw) {
    const sr = Number(r.studentFacingRate)
    const cr = Number(r.compensationRate)
    const existing = gradeRateMap.get(r.teacherId)
    if (existing) {
      existing.minStudent = Math.min(existing.minStudent, sr)
      existing.maxStudent = Math.max(existing.maxStudent, sr)
      existing.minComp = Math.min(existing.minComp, cr)
      existing.maxComp = Math.max(existing.maxComp, cr)
      existing.count++
    } else {
      gradeRateMap.set(r.teacherId, { minStudent: sr, maxStudent: sr, minComp: cr, maxComp: cr, count: 1 })
    }
  }

  return (
    <TeachersClient teachers={teachers} kpis={kpis} subjects={subjectsRaw} />
  )
}
