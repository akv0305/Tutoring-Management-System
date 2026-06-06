// app/(dashboard)/admin/pricing/page.tsx
import { prisma } from "@/lib/prisma"
import { PricingClient } from "./PricingClient"

export const dynamic = "force-dynamic"

export default async function PricingPage() {
  // Fetch grade bands with grades
  const gradeBandsRaw = await prisma.gradeBand.findMany({
    include: {
      grades: { orderBy: { sortOrder: "asc" } },
      _count: {
        select: {
          teacherSubjectRates: { where: { isActive: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  const gradeBands = gradeBandsRaw.map((gb) => ({
    id: gb.id,
    name: gb.name,
    displayName: gb.displayName,
    sortOrder: gb.sortOrder,
    isActive: gb.isActive,
    rateCount: gb._count.teacherSubjectRates,
    grades: gb.grades.map((g) => ({
      id: g.id,
      name: g.name,
      displayName: g.name,
      shortName: g.shortName,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
      gradeBandId: g.gradeBandId,
    })),
  }))

  // Fetch all rates
  const ratesRaw = await prisma.teacherSubjectRate.findMany({
    include: {
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      subject: { select: { id: true, name: true, category: true } },
      gradeBand: { select: { id: true, name: true, displayName: true } },
    },
    orderBy: [
      { teacher: { user: { firstName: "asc" } } },
      { subject: { name: "asc" } },
      { gradeBand: { sortOrder: "asc" } },
    ],
  })

  const rates = ratesRaw.map((r) => ({
    id: r.id,
    teacherId: r.teacherId,
    teacherName: `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
    teacherEmail: r.teacher.user.email,
    subjectId: r.subjectId,
    subjectName: r.subject.name,
    subjectCategory: r.subject.category,
    gradeBandId: r.gradeBandId,
    gradeBandName: r.gradeBand.name,
    gradeBandDisplayName: r.gradeBand.displayName,
    compensationRate: Number(r.compensationRate),
    studentFacingRate: Number(r.studentFacingRate),
    isActive: r.isActive,
  }))

  // Fetch active teachers with their assigned subjects
  const teachersRaw = await prisma.teacherProfile.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      subjects: {
        include: { subject: { select: { id: true, name: true } } },
      },
    },
    orderBy: { user: { firstName: "asc" } },
  })

  const teachers = teachersRaw.map((t) => ({
    id: t.id,
    name: `${t.user.firstName} ${t.user.lastName}`,
    email: t.user.email,
    defaultCompRate: Number(t.compensationRate),
    defaultStudentRate: Number(t.studentFacingRate),
    subjects: t.subjects.map((ts) => ({
      id: ts.subject.id,
      name: ts.subject.name,
    })),
  }))

  // Fetch all active subjects
  const subjectsRaw = await prisma.subject.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  })

  const subjects = subjectsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
  }))

  // KPIs
  const activeRates = rates.filter((r) => r.isActive)
  const uniqueTeachersWithRates = new Set(activeRates.map((r) => r.teacherId)).size
  const uniqueSubjectsWithRates = new Set(activeRates.map((r) => r.subjectId)).size
  const avgMargin =
    activeRates.length > 0
      ? (
          activeRates.reduce((sum, r) => sum + (r.studentFacingRate - r.compensationRate), 0) /
          activeRates.length
        ).toFixed(2)
      : "0.00"

  const kpis = {
    totalRates: rates.length,
    activeRates: activeRates.length,
    teachersConfigured: uniqueTeachersWithRates,
    totalTeachers: teachers.length,
    subjectsCovered: uniqueSubjectsWithRates,
    totalSubjects: subjects.length,
    avgMargin: Number(avgMargin),
  }

  return (
    <PricingClient
      gradeBands={gradeBands}
      rates={rates}
      teachers={teachers}
      subjects={subjects}
      kpis={kpis}
    />
  )
}
