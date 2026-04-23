import { prisma } from "@/lib/prisma"
import { CoordinatorsClient } from "./CoordinatorsClient"

export const dynamic = "force-dynamic"

export default async function CoordinatorsPage() {
  const coordinatorsRaw = await prisma.coordinatorProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const coordinators = coordinatorsRaw.map((c) => ({
    id: c.id,
    coordinatorName: `${c.user.firstName} ${c.user.lastName}`,
    email: c.user.email,
    bucketSize: c.bucketSize,
    currentStudents: c._count.students,
    availableSlots: Math.max(0, c.bucketSize - c._count.students),
    status: c.status.toLowerCase(),
    joinedDate: c.createdAt.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
  }))

  return <CoordinatorsClient coordinators={coordinators} />
}
