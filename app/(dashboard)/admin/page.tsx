import React from "react"
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  UserPlus,
  Package,
  CreditCard,
  Wallet,
  Settings,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react"
import { KPICard } from "@/components/ui/KPICard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { prisma } from "@/lib/prisma"

/* ─────────────────── Static data (no DB equivalent yet) ─────────────── */

const quickActions = [
  { icon: UserPlus,       label: "Add New Student" },
  { icon: GraduationCap,  label: "Add New Teacher" },
  { icon: Package,        label: "Create Package" },
  { icon: CreditCard,     label: "Confirm Payment" },
  { icon: Wallet,         label: "Process Payout" },
  { icon: Settings,       label: "Platform Settings" },
]

const systemAlerts = [
  {
    bg: "bg-red-50",
    border: "border-red-400",
    Icon: AlertCircle,
    iconColor: "text-red-500",
    message: "5 pending refund requests require immediate attention.",
    time: "2 hours ago",
  },
  {
    bg: "bg-orange-50",
    border: "border-orange-400",
    Icon: AlertTriangle,
    iconColor: "text-orange-500",
    message: "3 teacher payouts are overdue by more than 7 days.",
    time: "4 hours ago",
  },
  {
    bg: "bg-blue-50",
    border: "border-blue-400",
    Icon: Info,
    iconColor: "text-blue-500",
    message: "System maintenance scheduled for March 12, 2026 at 2:00 AM IST.",
    time: "1 day ago",
  },
  {
    bg: "bg-green-50",
    border: "border-green-400",
    Icon: CheckCircle,
    iconColor: "text-green-500",
    message: "Monthly revenue target of $45,000 has been exceeded.",
    time: "2 days ago",
  },
]

/* ─────────────────────────── Helper ──────────────────────────────────── */

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

/* ─────────────────────────── Page (Server Component) ─────────────────── */

export default async function AdminPage() {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    revenueResult,
    recentPaymentsRaw,
    payoutsRaw,
    subjectStats,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacherProfile.count({ where: { status: "ACTIVE" } }),
    prisma.class.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED" },
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
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.subject.findMany({
      where: { status: "ACTIVE" },
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    }),
  ])

  const totalRevenue = revenueResult._sum.amount ?? 0

  // Map recent payments
  const recentPayments = recentPaymentsRaw.map((p) => ({
    id: p.id,
    student: `${p.student.firstName} ${p.student.lastName}`,
    package: p.package?.name ?? "—",
    amount: `$${Number(p.amount).toLocaleString()}`,
    status: p.status.toLowerCase(),
    date: formatDate(p.createdAt),
  }))

  // Map teacher payouts
  const teacherPayouts = payoutsRaw.map((po) => ({
    id: po.id,
    teacher: `${po.teacher.user.firstName} ${po.teacher.user.lastName}`,
    classes: po.classesCompleted,
    rate: `$${Number(po.compensationRate)}`,
    total: `$${Number(po.grossAmount).toLocaleString()}`,
    status: po.status.toLowerCase(),
  }))

  // Subject distribution
  const maxStudents = Math.max(
    ...subjectStats.map((s) => s._count.students),
    1
  )
  const popularSubjects = subjectStats
    .sort((a, b) => b._count.students - a._count.students)
    .slice(0, 6)
    .map((s, idx) => ({
      name: s.name,
      count: `${s._count.students} student${s._count.students !== 1 ? "s" : ""}`,
      percent: Math.round((s._count.students / maxStudents) * 100),
      color: idx < 2 ? "#0D9488" : idx < 4 ? "#F59E0B" : "#1E3A5F",
    }))

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard
          title="Total Students"
          value={totalStudents.toString()}
          subtitle="All registered students"
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
          title="Total Classes"
          value={totalClasses.toString()}
          subtitle="All sessions"
          change=""
          changeType="neutral"
          icon={Calendar}
        />
        <KPICard
          title="Revenue Collected"
          value={`$${Number(totalRevenue).toLocaleString()}`}
          subtitle="Confirmed payments"
          change=""
          changeType="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1E293B]">Recent Payments</h2>
              <span className="text-xs text-[#0D9488] font-medium cursor-pointer hover:underline">View All →</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Package</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentPayments.length > 0 ? (
                    recentPayments.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 font-medium text-[#1E293B]">{row.student}</td>
                        <td className="px-5 py-3 text-gray-500">{row.package}</td>
                        <td className="px-5 py-3 font-semibold text-[#1E293B]">{row.amount}</td>
                        <td className="px-5 py-3"><StatusBadge status={row.status} size="sm" /></td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{row.date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No payments recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Payouts Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1E293B]">Teacher Payouts Summary</h2>
              <span className="text-xs text-[#0D9488] font-medium cursor-pointer hover:underline">View All →</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Classes</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Due</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teacherPayouts.length > 0 ? (
                    teacherPayouts.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 font-medium text-[#1E293B]">{row.teacher}</td>
                        <td className="px-5 py-3 text-gray-500">{row.classes}</td>
                        <td className="px-5 py-3 text-gray-500">{row.rate}</td>
                        <td className="px-5 py-3 font-semibold text-[#1E293B]">{row.total}</td>
                        <td className="px-5 py-3"><StatusBadge status={row.status} size="sm" /></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No payouts recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ icon: Icon, label }) => (
                <button key={label} className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-[#1E293B] hover:border-[#0D9488] hover:text-[#0D9488] hover:bg-teal-50 transition-all duration-150 group">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#0D9488] transition-colors flex-shrink-0" />
                  <span className="text-left leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">System Alerts</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${alert.bg} border-l-4 ${alert.border}`}>
                  <alert.Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E293B] leading-snug">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Subject Distribution</h2>
            <div className="space-y-3">
              {popularSubjects.length > 0 ? (
                popularSubjects.map((subject) => (
                  <div key={subject.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#1E293B]">{subject.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{subject.count}</span>
                        <span className="text-xs font-semibold" style={{ color: subject.color }}>{subject.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${subject.percent}%`, backgroundColor: subject.color }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No subjects found</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
