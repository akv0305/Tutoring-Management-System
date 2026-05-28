import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-utils"
import BulkOnboardParentsClient from "./BulkOnboardParentsClient"

export default async function BulkOnboardParentsPage() {
  const session = await getSession()
  if (!session?.user || !["ADMIN", "COORDINATOR"].includes(session.user.role)) {
    redirect("/login")
  }

  const { prisma } = await import("@/lib/prisma")

  const subjects = await prisma.subject.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const coordinators = await prisma.coordinatorProfile.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { firstName: true, lastName: true } } },
  })

  const coordList = coordinators.map((c) => ({
    id: c.id,
    name: `${c.user.firstName} ${c.user.lastName}`,
  }))

  return <BulkOnboardParentsClient subjects={subjects} coordinators={coordList} />
}
