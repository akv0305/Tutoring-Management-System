// app/(dashboard)/parent/page.tsx
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentDashboardClient } from "./ParentDashboardClient"
import { getTzAbbr } from "@/lib/timezone"

export const dynamic = "force-dynamic"

export default async function ParentPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: {
      user: { select: { firstName: true, lastName: true } },
      students: {
        include: {
          coordinator: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            },
          },
          classes: {
            where: {
              status: { in: ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED", "COMPLETED"] },
            },
            include: {
              teacher: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
              subject: { select: { name: true } },
            },
            orderBy: { scheduledAt: "asc" },
          },
          packages: {
            where: { status: "ACTIVE" },
            include: {
              teacher: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      },
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  })

  if (!parent) redirect("/unauthorized")

  // ── Timezone setup ──
  const parentTZ = (parent as any).timezone || "America/New_York"
  const tzAbbr = getTzAbbr(parentTZ)

  const now = new Date()
  const parentFirstName = parent.user.firstName
  const childrenNames = parent.students.map((s) => s.firstName)

  // All classes across children
  const allClasses = parent.students.flatMap((s) => s.classes)

  // Upcoming classes
  const upcomingClasses = allClasses
    .filter(
      (c) =>
        c.scheduledAt >= now &&
        ["PENDING_PAYMENT", "SCHEDULED", "CONFIRMED"].includes(c.status)
    )
    .slice(0, 5)
    .map((c) => {
      const dt = c.scheduledAt
      const endTime = new Date(dt.getTime() + (c.duration ?? 60) * 60000)
      const canJoin =
        dt.getTime() - now.getTime() < 15 * 60000 &&
        dt.getTime() > now.getTime() - 60 * 60000

      const student = parent.students.find((s) =>
        s.classes.some((cl) => cl.id === c.id)
      )

      return {
        id: c.id,
        studentName: student ? `${student.firstName} ${student.lastName}` : "—",
        day: dt.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          timeZone: parentTZ,
        }),
        time:
          dt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: parentTZ,
          }) +
          " – " +
          endTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: parentTZ,
          }) +
          " " + tzAbbr,
        teacherName: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
        initials: `${c.teacher.user.firstName[0]}${c.teacher.user.lastName[0]}`,
        subject: c.subject.name,
        status: c.status.toLowerCase(),
        canJoin,
        meetingLink: c.meetingLink ?? null,
      }
    })

  // Completed count
  const completedCount = allClasses.filter((c) => c.status === "COMPLETED").length

  // Total remaining
  const allPackages = parent.students.flatMap((s) => s.packages)
  const totalRemaining = allPackages.reduce(
    (sum, pkg) => sum + (pkg.classesIncluded - pkg.classesUsed),
    0
  )

  // Avg rating
  const rated = allClasses.filter((c) => c.parentRating !== null)
  const avgRating =
    rated.length > 0
      ? (
          rated.reduce((sum, c) => sum + (c.parentRating ?? 0), 0) / rated.length
        ).toFixed(1)
      : "—"

  // Active packages
  const activePackages = allPackages.map((pkg) => {
    const remaining = pkg.classesIncluded - pkg.classesUsed
    const isLow = remaining <= 2 && remaining > 0
    return {
      id: pkg.id,
      name: pkg.name,
      teacher: `${pkg.teacher.user.firstName} ${pkg.teacher.user.lastName}`,
      total: pkg.classesIncluded,
      used: pkg.classesUsed,
      remaining,
      expires: pkg.expiryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: parentTZ,
      }),
      status: pkg.status.toLowerCase(),
      barColor: isLow ? "bg-[#F59E0B]" : "bg-[#0D9488]",
      isLow,
    }
  })

  // Coordinator
  const coordStudent = parent.students.find((s) => s.coordinator)
  const coordinator = coordStudent?.coordinator
    ? {
        name: `${coordStudent.coordinator.user.firstName} ${coordStudent.coordinator.user.lastName}`,
        initials: `${coordStudent.coordinator.user.firstName[0]}${coordStudent.coordinator.user.lastName[0]}`,
        email: coordStudent.coordinator.user.email,
        phone: coordStudent.coordinator.user.phone ?? "",
      }
    : null

  // Feedback given (last 3 rated classes)
  const feedback = allClasses
    .filter((c) => c.parentRating !== null && c.parentFeedback)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
    )
    .slice(0, 3)
    .map((c) => ({
      date: (c.completedAt ?? c.scheduledAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: parentTZ,
      }),
      rating: c.parentRating ?? 0,
      text: c.parentFeedback ?? "",
    }))

  // Wallet balance
  const walletBalance = parent.wallet ? Number(parent.wallet.balance) : 0
  const recentWalletTransactions = (parent.wallet?.transactions ?? []).map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    description: t.description,
    date: t.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: parentTZ,
    }),
  }))

  const data = {
    parentFirstName,
    childrenNames,
    upcomingClasses,
    completedCount,
    totalRemaining,
    avgRating,
    activePackages,
    coordinator,
    feedback,
    walletBalance,
    recentWalletTransactions,
  }

  return <ParentDashboardClient data={data} />
}
