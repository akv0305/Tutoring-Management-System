import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeacherProfileClient } from "./TeacherProfileClient"

export default async function TeacherProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true, firstName: true, lastName: true } } },
  })
  if (!parent) redirect("/unauthorized")

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { firstName: true, lastName: true } },
      subjects: { include: { subject: { select: { id: true, name: true } } } },
      availabilities: { where: { isEnabled: true }, orderBy: { dayOfWeek: "asc" } },
      blockedDates: { where: { blockedDate: { gte: new Date() } }, select: { blockedDate: true } },
    },
  })
  if (!teacher) redirect("/parent/teachers")

  // Get existing classes for this teacher in the next 4 weeks (to grey out booked slots)
  const now = new Date()
  const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)
  const bookedClasses = await prisma.class.findMany({
    where: {
      teacherId: teacher.id,
      status: { in: ["PENDING_PAYMENT","SCHEDULED", "CONFIRMED"] },
      scheduledAt: { gte: now, lte: fourWeeksLater },
    },
    select: { scheduledAt: true, duration: true },
  })

  // Active packages for this parent's students with this teacher
  const studentIds = parent.students.map((s) => s.id)
  const packages = await prisma.package.findMany({
    where: {
      studentId: { in: studentIds },
      teacherId: teacher.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      classesIncluded: true,
      classesUsed: true,
      subjectId: true,
      studentId: true,
      student: { select: { firstName: true, lastName: true } },
      subject: { select: { id: true, name: true } },
    },
  })

  // Fetch trial eligibility for parent's students
  // Only for subjects this teacher offers
  const teacherSubjectIds = teacher.subjects.map((ts) => ts.subject.id)
  const studentSubjects = await prisma.studentSubject.findMany({
    where: {
      studentId: { in: studentIds },
      subjectId: { in: teacherSubjectIds },
    },
    select: {
      studentId: true,
      subjectId: true,
      trialTaken: true,
    },
  })

  // Class stats
  const completedClasses = await prisma.class.count({
    where: { teacherId: teacher.id, status: "COMPLETED" },
  })
  const ratingAgg = await prisma.class.aggregate({
    where: { teacherId: teacher.id, parentRating: { not: null } },
    _avg: { parentRating: true },
    _count: { parentRating: true },
  })

  const teacherData = {
    id: teacher.id,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    initials: `${teacher.user.firstName[0]}${teacher.user.lastName[0]}`,
    qualification: teacher.qualification ?? "—",
    bio: teacher.bio ?? "",
    experience: teacher.experience,
    rate: `$${Number(teacher.studentFacingRate)}`,
    rating: ratingAgg._avg.parentRating ? Number(ratingAgg._avg.parentRating.toFixed(1)) : 0,
    reviews: ratingAgg._count.parentRating,
    totalClasses: completedClasses,
    timezone: teacher.timezone,
    subjects: teacher.subjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name })),
    availability: teacher.availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
    blockedDates: teacher.blockedDates.map((b) => b.blockedDate.toISOString().split("T")[0]),
    bookedSlots: bookedClasses.map((c) => ({
      start: c.scheduledAt.toISOString(),
      duration: c.duration,
    })),
  }

  const studentsData = parent.students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
  }))

  const packagesData = packages
    .filter((p) => p.classesUsed < p.classesIncluded)
    .map((p) => ({
      id: p.id,
      label: `${p.name} — ${p.student.firstName} ${p.student.lastName}`,
      remaining: p.classesIncluded - p.classesUsed,
      subjectId: p.subjectId,
      subjectName: p.subject.name,
      studentId: p.studentId,
    }))

  const trialEligibility = studentSubjects.map((ss) => ({
    studentId: ss.studentId,
    subjectId: ss.subjectId,
    trialTaken: ss.trialTaken,
  }))  

    return (
      <TeacherProfileClient
        teacher={teacherData}
        students={studentsData}
        packages={packagesData}
        trialEligibility={trialEligibility}
      />
    )
  
}
