import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import BulkOnboardClient from "./BulkOnboardClient"

export default async function BulkOnboardTeachersPage() {
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  // Fetch subjects for the dropdown
  const { prisma } = await import("@/lib/prisma")
  const subjects = await prisma.subject.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  })

  return <BulkOnboardClient subjects={subjects} />
}
