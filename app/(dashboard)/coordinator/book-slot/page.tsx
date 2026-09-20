import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BookSlotClient } from "@/app/(dashboard)/admin/book-slot/BookSlotClient"

export const dynamic = "force-dynamic"

export default async function CoordinatorBookSlotPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/login")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/login")

  const now = new Date()

  // ── 1. Students assigned to this coordinator ──
  const studentsRaw = await prisma.student.findMany({
    where: {
      coordinatorId: coordinator.id,
      parent: { user: { status: "ACTIVE" } },
    },
    include: {
      parent: {
        select: {
          id: true,
          timezone: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          wallet: { select: { balance: true } },
        },
      },
      gradeRef: {
        include: { gradeBand: { select: { id: true, displayName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const students = studentsRaw.map((s: typeof studentsRaw[number]) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    grade: s.grade ?? "",
    gradeBandId: s.gradeRef?.gradeBandId ?? null,
    gradeBandName: s.gradeRef?.gradeBand?.displayName ?? null,
    parentId: s.parentId,
    parentName: s.parent
      ? `${s.parent.user.firstName} ${s.parent.user.lastName}`
      : "—",
    parentEmail: s.parent?.user.email ?? "",
    parentTimezone: s.parent?.timezone ?? "America/New_York",
    walletBalance: s.parent?.wallet?.balance
      ? Number(s.parent.wallet.balance)
      : 0,
  }))

  // ── 2. Active teachers ──
  const teachersRaw = await prisma.teacherProfile.findMany({
    where: { user: { status: "ACTIVE" } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      subjects: {
        include: { subject: { select: { id: true, name: true } } },
      },
      availabilities: {
        where: { isEnabled: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      blockedDates: {
        where: { blockedDate: { gte: now } },
        select: { blockedDate: true },
      },
    },
    orderBy: { user: { firstName: "asc" } },
  })

  const futureClasses = await prisma.class.findMany({
    where: {
      scheduledAt: { gte: now },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    select: { teacherId: true, scheduledAt: true, duration: true },
  })

  const teacherBookedMap: Record<string, { start: string; duration: number }[]> = {}
  for (const fc of futureClasses) {
    const tid = fc.teacherId
    if (!teacherBookedMap[tid]) teacherBookedMap[tid] = []
    teacherBookedMap[tid].push({
      start: fc.scheduledAt.toISOString(),
      duration: fc.duration ?? 60,
    })
  }

  const teachers = teachersRaw.map((t: typeof teachersRaw[number]) => ({
    id: t.id,
    name: `${t.user.firstName} ${t.user.lastName}`,
    timezone: t.timezone ?? "Asia/Kolkata",
    subjects: t.subjects.map((ts: typeof t.subjects[number]) => ({
      id: ts.subject.id,
      name: ts.subject.name,
    })),
    availability: t.availabilities.map((a: typeof t.availabilities[number]) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
    blockedDates: t.blockedDates.map(
      (b: typeof t.blockedDates[number]) => b.blockedDate.toISOString()
    ),
    bookedSlots: teacherBookedMap[t.id] ?? [],
    defaultRate: Number(t.studentFacingRate ?? t.compensationRate ?? 0),
  }))

  // ── 3. Teacher-subject rates ──
  const ratesRaw = await prisma.teacherSubjectRate.findMany({
    where: { isActive: true },
  })

  const teacherRates = ratesRaw.map((r: typeof ratesRaw[number]) => ({
    teacherId: r.teacherId,
    subjectId: r.subjectId,
    gradeBandId: r.gradeBandId,
    studentFacingRate: Number(r.studentFacingRate),
    compensationRate: Number(r.compensationRate),
  }))

  // ── 4. Active package templates ──
  const templatesRaw = await prisma.packageTemplate.findMany({
    where: { status: "ACTIVE" },
    include: { subject: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  })

  const packageTemplates = templatesRaw.map((t: typeof templatesRaw[number]) => ({
    id: t.id,
    name: t.name,
    subjectId: t.subjectId,
    subjectName: t.subject.name,
    classesIncluded: t.classesIncluded,
    validityDays: t.validityDays,
    suggestedPrice: Number(t.suggestedPrice),
    description: t.description ?? "",
    isPopular: t.isPopular,
  }))

  // ── 5. All active grades for grade selection ──
  const allGradesRaw = await prisma.grade.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, shortName: true, sortOrder: true,
      gradeBandId: true,
      gradeBand: { select: { id: true, displayName: true } },
    },
    orderBy: { sortOrder: "asc" },
  })

  const allGrades = allGradesRaw.map((g: typeof allGradesRaw[number]) => ({
    id: g.id,
    name: g.name,
    shortName: g.shortName,
    sortOrder: g.sortOrder,
    gradeBandId: g.gradeBandId,
    gradeBandName: g.gradeBand.displayName,
  }))

  return (
    <BookSlotClient
      students={students}
      teachers={teachers}
      teacherRates={teacherRates}
      packageTemplates={packageTemplates}
      allGrades={allGrades}
      role="ADMIN"  // or "COORDINATOR"
    />
  )
}
