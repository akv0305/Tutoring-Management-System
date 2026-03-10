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

/* ─────────────────────────── Hard-coded data ─────────────────────────── */

const recentPayments = [
  { id: 1, student: "Aryan Mehta",    package: "Premium Monthly",   amount: "$250", status: "paid",    date: "Mar 08, 2026" },
  { id: 2, student: "Priya Sharma",   package: "Standard Monthly",  amount: "$180", status: "paid",    date: "Mar 07, 2026" },
  { id: 3, student: "Rohan Gupta",    package: "Trial Package",     amount: "$50",  status: "pending", date: "Mar 07, 2026" },
  { id: 4, student: "Sneha Patel",    package: "Premium Quarterly", amount: "$680", status: "paid",    date: "Mar 06, 2026" },
  { id: 5, student: "Karthik Nair",   package: "Standard Monthly",  amount: "$180", status: "failed",  date: "Mar 05, 2026" },
]

const teacherPayouts = [
  { id: 1, teacher: "Dr. Anil Verma",   classes: 24, rate: "$15", total: "$360", status: "pending" },
  { id: 2, teacher: "Ms. Divya Iyer",   classes: 18, rate: "$18", total: "$324", status: "paid"    },
  { id: 3, teacher: "Mr. Suresh Babu",  classes: 30, rate: "$12", total: "$360", status: "pending" },
  { id: 4, teacher: "Ms. Lakshmi Rao",  classes: 15, rate: "$20", total: "$300", status: "pending" },
]

const quickActions = [
  { icon: UserPlus,  label: "Add New Student"   },
  { icon: GraduationCap, label: "Add New Teacher" },
  { icon: Package,   label: "Create Package"    },
  { icon: CreditCard,label: "Confirm Payment"   },
  { icon: Wallet,    label: "Process Payout"    },
  { icon: Settings,  label: "Platform Settings" },
]

const systemAlerts = [
  {
    color: "#EF4444",
    bg: "bg-red-50",
    border: "border-red-400",
    Icon: AlertCircle,
    iconColor: "text-red-500",
    message: "5 pending refund requests require immediate attention.",
    time: "2 hours ago",
  },
  {
    color: "#F97316",
    bg: "bg-orange-50",
    border: "border-orange-400",
    Icon: AlertTriangle,
    iconColor: "text-orange-500",
    message: "3 teacher payouts are overdue by more than 7 days.",
    time: "4 hours ago",
  },
  {
    color: "#3B82F6",
    bg: "bg-blue-50",
    border: "border-blue-400",
    Icon: Info,
    iconColor: "text-blue-500",
    message: "System maintenance scheduled for March 12, 2026 at 2:00 AM IST.",
    time: "1 day ago",
  },
  {
    color: "#22C55E",
    bg: "bg-green-50",
    border: "border-green-400",
    Icon: CheckCircle,
    iconColor: "text-green-500",
    message: "Monthly revenue target of $45,000 has been exceeded.",
    time: "2 days ago",
  },
]

const popularSubjects = [
  { name: "Mathematics",      percent: 78, color: "#0D9488", count: "312 students"  },
  { name: "Science",          percent: 62, color: "#0D9488", count: "248 students"  },
  { name: "English",          percent: 45, color: "#F59E0B", count: "180 students"  },
  { name: "SAT Prep",         percent: 38, color: "#F59E0B", count: "152 students"  },
  { name: "Computer Science", percent: 25, color: "#1E3A5F", count: "100 students"  },
  { name: "ACT Prep",         percent: 18, color: "#1E3A5F", count: "72 students"   },
]

/* ──────────────────────────────── Page ──────────────────────────────── */

export default function AdminPage() {
  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KPICard
          title="Total Students"
          value="847"
          subtitle="42 new this month"
          change="+12%"
          changeType="positive"
          icon={Users}
        />
        <KPICard
          title="Total Teachers"
          value="124"
          subtitle="8 new this month"
          change="+6%"
          changeType="positive"
          icon={GraduationCap}
        />
        <KPICard
          title="Total Classes"
          value="3,247"
          subtitle="March 2026"
          change="+18%"
          changeType="positive"
          icon={Calendar}
        />
        <KPICard
          title="Revenue Collected"
          value="$48,350"
          subtitle="March 2026"
          change="+22%"
          changeType="positive"
          icon={DollarSign}
        />
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-6">

          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1E293B]">Recent Payments</h2>
              <span className="text-xs text-[#0D9488] font-medium cursor-pointer hover:underline">
                View All →
              </span>
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
                  {recentPayments.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-[#1E293B]">{row.student}</td>
                      <td className="px-5 py-3 text-gray-500">{row.package}</td>
                      <td className="px-5 py-3 font-semibold text-[#1E293B]">{row.amount}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Payouts Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1E293B]">Teacher Payouts Summary</h2>
              <span className="text-xs text-[#0D9488] font-medium cursor-pointer hover:underline">
                View All →
              </span>
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
                  {teacherPayouts.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-[#1E293B]">{row.teacher}</td>
                      <td className="px-5 py-3 text-gray-500">{row.classes}</td>
                      <td className="px-5 py-3 text-gray-500">{row.rate}</td>
                      <td className="px-5 py-3 font-semibold text-[#1E293B]">{row.total}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-[#1E293B] hover:border-[#0D9488] hover:text-[#0D9488] hover:bg-teal-50 transition-all duration-150 group"
                >
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
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${alert.bg} border-l-4 ${alert.border}`}
                >
                  <alert.Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E293B] leading-snug">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Subjects */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-[#1E293B] mb-4">Popular Subjects</h2>
            <div className="space-y-3">
              {popularSubjects.map((subject) => (
                <div key={subject.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#1E293B]">{subject.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{subject.count}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: subject.color }}
                      >
                        {subject.percent}%
                      </span>
                    </div>
                  </div>
                  {/* Track */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${subject.percent}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
