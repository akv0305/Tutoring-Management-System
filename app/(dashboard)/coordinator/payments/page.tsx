import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorPaymentsClient } from "./CoordinatorPaymentsClient"

export const dynamic = "force-dynamic"

export default async function CoordinatorPaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "COORDINATOR") redirect("/unauthorized")

  const coordinator = await prisma.coordinatorProfile.findFirst({
    where: { user: { email: session.user.email! } },
  })
  if (!coordinator) redirect("/unauthorized")

  // Check platform setting
  const settings = await prisma.platformSettings.findFirst({ where: { id: "default" } })
  const canConfirmPayments = settings?.coordinatorCanConfirmPayments ?? false

  const paymentsRaw = await prisma.payment.findMany({
    where: {
      student: { coordinatorId: coordinator.id },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          parent: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
      },
      package: { select: { name: true } },
      confirmedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const payments = paymentsRaw.map((p) => ({
    id: p.id,
    paymentId: `PAY-${p.id.slice(-4).toUpperCase()}`,
    student: `${p.student.firstName} ${p.student.lastName}`,
    parentEmail: p.student.parent?.user.email ?? "—",
    package: p.package?.name ?? "Direct Payment",
    amount: `$${Number(p.amount)}`,
    method: p.method.replace("_", " "),
    proof: null as string | null,
    date: p.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: p.status.toLowerCase() as "pending" | "confirmed" | "rejected" | "refunded" | "failed",
    confirmedBy: p.confirmedBy
      ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
      : null,
  }))

  const counts = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    confirmed: payments.filter((p) => p.status === "confirmed").length,
    rejected: payments.filter((p) => p.status === "failed").length,
  }

  return (
    <CoordinatorPaymentsClient
      payments={payments}
      counts={counts}
      canConfirmPayments={canConfirmPayments}
    />
  )
}
