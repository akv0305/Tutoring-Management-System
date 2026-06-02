// app/(dashboard)/admin/page.tsx
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  ArrowRight,
  BookOpen,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

const quickActions = [
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
  { label: "Classes", href: "/admin/classes", icon: Calendar },
  { label: "Packages", href: "/admin/packages", icon: BookOpen },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Payouts", href: "/admin/payouts", icon: DollarSign },
]

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function AdminPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    revenueResult,
    recentPayments,
    recentPayouts,
    subjects,
    pendingRefundsCount,
    overduePayoutsCount,
    pendingPaymentsCount,
    // New: class stats
    completedClassesThisMonth,
    scheduledClassesCount,
    cancelledClassesThisMonth,
    recentCredits,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacherProfile.count({ where: { status: "ACTIVE" } }),
    prisma.class.count(),
    prisma.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } },
      },
    }),
    prisma.payout.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.subject.findMany({
      where: { status: "ACTIVE" },
      include: { _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.refundRequest.count({ where: { status: "PENDING" } }),
    prisma.payout.count({
      where: { status: "PENDING", periodEndDate: { lt: now } },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    // New queries
    prisma.class.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.class.count({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        scheduledAt: { gte: now },
      },
    }),
    prisma.class.count({
      where: {
        status: { in: ["CANCELLED_STUDENT", "CANCELLED_TEACHER"] },
        cancelledAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Recent wallet credits (admin adjustments — i.e., class credits)
    prisma.walletTransaction.findMany({
      where: {
        type: "ADMIN_ADJUSTMENT",
        amount: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        wallet: {
          include: {
            parentProfile: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    }),
  ])

  const revenue = Number(revenueResult._sum?.amount ?? 0)

  // System alerts
  const alerts: { message: string; color: string }[] = []
  if (pendingRefundsCount > 0)
    alerts.push({ message: `${pendingRefundsCount} refund request(s) awaiting review`, color: "text-red-600" })
  if (overduePayoutsCount > 0)
    alerts.push({ message: `${overduePayoutsCount} payout(s) overdue for processing`, color: "text-orange-600" })
  if (pendingPaymentsCount > 0)
    alerts.push({ message: `${pendingPaymentsCount} payment(s) pending confirmation`, color: "text-blue-600" })
  if (cancelledClassesThisMonth > 3)
    alerts.push({ message: `${cancelledClassesThisMonth} class cancellations this month`, color: "text-amber-600" })
  if (alerts.length === 0)
    alerts.push({ message: "All systems running smoothly", color: "text-green-600" })

  // Subject stats
  const subjectStats = subjects
    .map((s) => ({ name: s.name, count: s._count.students }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const maxSubCount = Math.max(...subjectStats.map((s) => s.count), 1)
  const subjectColors = ["#0D9488", "#1E3A5F", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444"]

  // Format credits
  const creditsList = recentCredits.map((t) => ({
    parentName: `${t.wallet.parentProfile.user.firstName} ${t.wallet.parentProfile.user.lastName}`,
    amount: Number(t.amount),
    description: t.description,
    date: formatDate(t.createdAt),
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards — now 6 cards in 3x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <KPICard
          title="Total Students"
          value={totalStudents.toString()}
          subtitle="Registered"
          change=""
          changeType="neutral"
          icon={Users}
        />
        <KPICard
          title="Active Teachers"
          value={totalTeachers.toString()}
          subtitle="Currently active"
          change=""
          changeType="neutral"
          icon={GraduationCap}
        />
        <KPICard
          title="Revenue Collected"
          value={`$${revenue.toLocaleString()}`}
          subtitle="Confirmed payments"
          change=""
          changeType="neutral"
          icon={DollarSign}
        />
        <KPICard
          title="Completed (This Month)"
          value={completedClassesThisMonth.toString()}
          subtitle={`${cancelledClassesThisMonth} cancelled`}
          change=""
          changeType="neutral"
          icon={CheckCircle}
        />
        <KPICard
          title="Upcoming Classes"
          value={scheduledClassesCount.toString()}
          subtitle="Scheduled & confirmed"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Total Classes"
          value={totalClasses.toString()}
          subtitle="All time"
          change=""
          changeType="neutral"
          icon={BookOpen}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Recent Payments</h2>
            <Link href="/admin/payments" className="text-sm text-[#0D9488] font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Package</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {p.student.firstName} {p.student.lastName}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{p.package?.name ?? "—"}</td>
                    <td className="px-3 py-2 font-medium text-[#1E293B]">
                      ${Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status.toLowerCase()} size="sm" />
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher Payouts Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Teacher Payouts</h2>
            <Link href="/admin/payouts" className="text-sm text-[#0D9488] font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Teacher</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Classes</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Net</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {p.teacher.user.firstName} {p.teacher.user.lastName}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{p.classesCompleted}</td>
                    <td className="px-3 py-2 font-medium text-[#1E293B]">
                      ${Number(p.netAmount).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status.toLowerCase()} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row: Quick Actions + System Alerts + Recent Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#0D9488] hover:bg-[#0D9488]/5 transition-all text-center"
              >
                <Icon className="w-5 h-5 text-[#0D9488]" />
                <span className="text-xs font-medium text-[#1E293B]">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#1E293B] mb-4">System Alerts</h2>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.color}`} />
                <p className={`text-sm ${a.color}`}>{a.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Class Credits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Recent Credits</h2>
            <Link href="/admin/classes" className="text-sm text-[#0D9488] font-medium hover:underline flex items-center gap-1">
              Classes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {creditsList.length > 0 ? (
            <div className="space-y-3">
              {creditsList.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                  <CreditCard className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B]">
                      ${c.amount.toFixed(2)}{" "}
                      <span className="font-normal text-gray-500">to {c.parentName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No class credits issued yet.</p>
          )}
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-[#1E293B] mb-4">Subject Distribution</h2>
        <div className="space-y-3">
          {subjectStats.map((s, i) => {
            const pct = Math.round((s.count / maxSubCount) * 100)
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40 flex-shrink-0 truncate">{s.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: subjectColors[i % subjectColors.length],
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-[#1E293B] w-10 text-right">{s.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
