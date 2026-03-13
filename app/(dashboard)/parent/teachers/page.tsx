import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentTeachersClient } from "./ParentTeachersClient"

const AVATAR_COLORS = [
  "bg-[#0D9488]", "bg-[#1E3A5F]", "bg-purple-700", "bg-emerald-700",
  "bg-indigo-700", "bg-rose-700", "bg-pink-700", "bg-slate-700", "bg-violet-700",
]

const SUBJECT_COLOR_MAP: Record<string, string> = {
  Mathematics: "bg-teal-50 text-teal-700 border-teal-200",
  Physics: "bg-purple-50 text-purple-700 border-purple-200",
  Chemistry: "bg-emerald-50 text-emerald-700 border-emerald-200",
  English: "bg-amber-50 text-amber-700 border-amber-200",
  "SAT Prep": "bg-orange-50 text-orange-700 border-orange-200",
  "ACT Prep": "bg-orange-50 text-orange-700 border-orange-200",
  "Computer Science": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Biology: "bg-green-50 text-green-700 border-green-200",
  Science: "bg-teal-50 text-teal-700 border-teal-200",
}
const DEFAULT_SUBJECT_COLOR = "bg-gray-100 text-gray-600 border-gray-200"

export default async function BrowseTeachersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true } } },
  })
  if (!parent) redirect("/unauthorized")

  const studentIds = parent.students.map((s) => s.id)

  // Get all active teachers
  const teachersRaw = await prisma.teacherProfile.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { firstName: true, lastName: true } },
      subjects: { include: { subject: { select: { name: true } } } },
    },
  })

  // Get existing teacher IDs (teachers who have packages with this parent's children)
  const existingTeacherPkgs = await prisma.package.findMany({
    where: {
      studentId: { in: studentIds },
      status: "ACTIVE",
    },
    select: { teacherId: true },
  })
  const existingTeacherIds = new Set(existingTeacherPkgs.map((p) => p.teacherId))

  // Get class counts and ratings per teacher
  const teacherClasses = await prisma.class.groupBy({
    by: ["teacherId"],
    where: { status: "COMPLETED", parentRating: { not: null } },
    _avg: { parentRating: true },
    _count: { id: true },
  })
  const ratingMap = new Map(
    teacherClasses.map((tc) => [
      tc.teacherId,
      { avg: tc._avg.parentRating ?? 0, count: tc._count.id },
    ])
  )

  const teachers = teachersRaw.map((t, idx) => {
    const name = `${t.user.firstName} ${t.user.lastName}`
    const initials = `${t.user.firstName[0]}${t.user.lastName[0]}`
    const subjects = t.subjects.map((ts) => ts.subject.name)
    const subjectColors = subjects.map(
      (s) => SUBJECT_COLOR_MAP[s] ?? DEFAULT_SUBJECT_COLOR
    )
    const ratingInfo = ratingMap.get(t.id)
    const rating = ratingInfo ? Number(ratingInfo.avg.toFixed(1)) : 0
    const reviews = ratingInfo?.count ?? 0

    return {
      id: t.id,
      initials,
      avatarBg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      name,
      qualification: t.qualification ?? "—",
      subjects,
      subjectColors,
      rating,
      reviews,
      price: `$${Number(t.studentFacingRate)}/hr`,
      experience: `${t.experience} years experience`,
      availability: `Timezone: ${t.timezone}`,
      isExistingTeacher: existingTeacherIds.has(t.id),
      isVerified: true,
    }
  })

  // Build subject options from all teacher subjects
  const allSubjects = [...new Set(teachers.flatMap((t) => t.subjects))]

  return <ParentTeachersClient teachers={teachers} subjectOptions={allSubjects} />
}
