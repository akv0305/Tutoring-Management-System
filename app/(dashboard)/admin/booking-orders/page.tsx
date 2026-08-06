import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import BookingOrdersClient from "@/components/booking-orders/BookingOrdersClient"

export const dynamic = "force-dynamic"

export default async function AdminBookingOrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")
  return <BookingOrdersClient role="ADMIN" />
}
