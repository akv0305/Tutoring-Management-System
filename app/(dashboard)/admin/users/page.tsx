import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import UserManagementClient from "./UserManagementClient"

export const dynamic = "force-dynamic"

export default async function UserManagementPage() {
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      lastLoginAt: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const serialized = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
    lockedUntil: u.lockedUntil?.toISOString() || null,
    createdAt: u.createdAt.toISOString(),
    isLocked: !!(u.lockedUntil && new Date(u.lockedUntil) > new Date()),
  }))

  return <UserManagementClient users={serialized} />
}
