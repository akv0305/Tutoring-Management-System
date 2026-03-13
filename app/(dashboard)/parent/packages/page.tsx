import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentPackagesClient } from "./ParentPackagesClient"

export default async function PackagesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/unauthorized")

  const parent = await prisma.parentProfile.findFirst({
    where: { user: { email: session.user.email! } },
    include: { students: { select: { id: true, firstName: true } } },
  })
  if (!parent) redirect("/unauthorized")

  const studentIds = parent.students.map((s) => s.id)
  const childName = parent.students[0]?.firstName ?? "your child"

  const packagesRaw = await prisma.package.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      subject: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()

  const activePackages = packagesRaw
    .filter((p) => p.status === "ACTIVE")
    .map((p) => {
      const remaining = p.classesIncluded - p.classesUsed
      const teacherName = `${p.teacher.user.firstName} ${p.teacher.user.lastName}`
      const initials = `${p.teacher.user.firstName[0]}${p.teacher.user.lastName[0]}`
      const expiresInDays = Math.max(0, Math.ceil((p.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      const pct = p.classesIncluded > 0 ? Math.round((p.classesUsed / p.classesIncluded) * 100) : 0

      return {
        id: p.id,
        name: p.name,
        subject: p.subject.name,
        teacher: teacherName,
        teacherInitials: initials,
        total: p.classesIncluded,
        used: p.classesUsed,
        remaining,
        expiry: p.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        expiresInDays,
        pct,
        barColor: expiresInDays <= 20 ? "bg-[#F59E0B]" : "bg-[#0D9488]",
        status: "active",
      }
    })

  const pastPackages = packagesRaw
    .filter((p) => ["EXHAUSTED", "EXPIRED", "CANCELLED"].includes(p.status))
    .map((p) => ({
      id: p.id,
      name: p.name,
      purchaseDate: p.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      classCount: p.classesIncluded,
      totalPaid: `$${Number(p.totalPrice)}`,
      status: p.status === "EXHAUSTED" ? "completed" : p.status.toLowerCase(),
    }))

  const totalPurchased = packagesRaw.reduce((sum, p) => sum + p.classesIncluded, 0)
  const totalUsed = packagesRaw.reduce((sum, p) => sum + p.classesUsed, 0)
  const totalRemaining = activePackages.reduce((sum, p) => sum + p.remaining, 0)

  const kpis = {
    activeCount: activePackages.length,
    totalPurchased,
    totalUsed,
    totalRemaining,
  }

  return (
    <ParentPackagesClient
      childName={childName}
      activePackages={activePackages}
      pastPackages={pastPackages}
      kpis={kpis}
    />
  )
}
