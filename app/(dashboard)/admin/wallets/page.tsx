import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import AdminWalletsClient from "./AdminWalletsClient"

export const dynamic = "force-dynamic"

export default async function AdminWalletsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  return <AdminWalletsClient />
}
