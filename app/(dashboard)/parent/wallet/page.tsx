import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import WalletPageClient from "./WalletPageClient"

export const dynamic = "force-dynamic"

export default async function WalletPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PARENT") redirect("/login")

  return <WalletPageClient />
}
