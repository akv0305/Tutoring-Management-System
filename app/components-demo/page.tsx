"use client"

import React, { useState } from "react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  Package,
  CreditCard,
  Banknote,
  RotateCcw,
  BarChart3,
  Link as LinkIcon,
  Settings,
  TrendingUp,
  TrendingDown,
  BookMarked,
  Star,
} from "lucide-react"

// Component imports
import { StatusBadge } from "@/components/ui/StatusBadge"
import { KPICard } from "@/components/ui/KPICard"
import { RatingStars } from "@/components/ui/RatingStars"
import { DataTable } from "@/components/tables/DataTable"
import { TeacherCard } from "@/components/ui/TeacherCard"
import { ClassCard } from "@/components/ui/ClassCard"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { NotificationDropdown } from "@/components/ui/NotificationDropdown"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"

// ─── SAMPLE DATA ────────────────────────────────────────────────────────────

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/components-demo", badge: 0 },
  { label: "Users", icon: Users, href: "/users", badge: 3 },
  { label: "Students", icon: GraduationCap, href: "/students" },
  { label: "Teachers", icon: UserCog, href: "/teachers" },
  { label: "Subjects", icon: BookOpen, href: "/subjects" },
  { label: "Packages", icon: Package, href: "/packages" },
  { label: "Payments", icon: CreditCard, href: "/payments", badge: 12 },
  { label: "Payouts", icon: Banknote, href: "/payouts" },
  { label: "Refund Requests", icon: RotateCcw, href: "/refunds", badge: 5 },
  { label: "Reports", icon: BarChart3, href: "/reports" },
  { label: "Referrals", icon: LinkIcon, href: "/referrals" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

const SAMPLE_TEACHERS = [
  {
    id: "t1",
    name: "Dr. Priya Sharma",
    subjects: ["Mathematics", "Physics"],
    qualification: "Ph.D Mathematics",
    university: "IIT Bombay",
    experience: 9,
    rating: 4.9,
    reviewCount: 213,
    pricePerClass: 22,
    isVerified: true,
  },
  {
    id: "t2",
    name: "Mr. Rahul Gupta",
    subjects: ["Chemistry", "Biology"],
    qualification: "M.Sc Chemistry",
    university: "Delhi University",
    experience: 6,
    rating: 4.7,
    reviewCount: 148,
    pricePerClass: 17,
    isVerified: true,
  },
  {
    id: "t3",
    name: "Ms. Anjali Mehta",
    subjects: ["English", "Literature"],
    qualification: "M.A. English Literature",
    university: "JNU New Delhi",
    experience: 4,
    rating: 4.5,
    reviewCount: 86,
    pricePerClass: 14,
    isVerified: false,
  },
  {
    id: "t4",
    name: "Prof. Suresh Nair",
    subjects: ["Computer Science", "Maths"],
    qualification: "M.Tech Computer Science",
    university: "NIT Trichy",
    experience: 12,
    rating: 4.8,
    reviewCount: 332,
    pricePerClass: 28,
    isVerified: true,
  },
]

const SAMPLE_CLASSES = [
  {
    id: "c1",
    date: "2024-11-18",
    startTime: "5:00 PM",
    endTime: "6:00 PM",
    teacherName: "Dr. Priya Sharma",
    subject: "Mathematics – Calculus",
    status: "scheduled" as const,
    meetingLink: "https://zoom.us/j/123456",
    studentTimezone: "EST",
    teacherTimezone: "IST",
    teacherTime: "3:30 AM",
  },
  {
    id: "c2",
    date: "2024-11-15",
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    teacherName: "Mr. Rahul Gupta",
    subject: "Chemistry – Organic",
    status: "completed" as const,
    studentTimezone: "PST",
    teacherTimezone: "IST",
    teacherTime: "4:30 AM",
  },
  {
    id: "c3",
    date: "2024-11-14",
    startTime: "6:00 PM",
    endTime: "7:00 PM",
    teacherName: "Ms. Anjali Mehta",
    subject: "English – Essay Writing",
    status: "completed" as const,
    rating: 5,
    studentTimezone: "CST",
    teacherTimezone: "IST",
    teacherTime: "5:30 AM",
  },
  {
    id: "c4",
    date: "2024-11-12",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    teacherName: "Prof. Suresh Nair",
    subject: "Computer Science – Algorithms",
    status: "cancelled" as const,
    studentTimezone: "EST",
    teacherTimezone: "IST",
    teacherTime: "2:30 AM",
  },
  {
    id: "c5",
    date: "2024-11-20",
    startTime: "7:00 PM",
    endTime: "8:00 PM",
    teacherName: "Dr. Priya Sharma",
    subject: "Physics – Mechanics (Trial)",
    status: "trial" as const,
    meetingLink: "https://zoom.us/j/987654",
    studentTimezone: "EST",
    teacherTimezone: "IST",
    teacherTime: "5:30 AM",
  },
]

type StudentRow = {
  id: string
  name: string
  email: string
  grade: string
  status: string
  date: string
}

const SAMPLE_STUDENTS: StudentRow[] = [
  { id: "s1", name: "Arjun Kapoor", email: "arjun.k@gmail.com", grade: "Grade 10", status: "active", date: "2024-08-12" },
  { id: "s2", name: "Meera Patel", email: "meera.p@gmail.com", grade: "Grade 11", status: "active", date: "2024-09-01" },
  { id: "s3", name: "Rohan Singh", email: "rohan.s@outlook.com", grade: "Grade 9", status: "trial", date: "2024-11-10" },
  { id: "s4", name: "Kavya Reddy", email: "kavya.r@gmail.com", grade: "Grade 12", status: "inactive", date: "2024-07-22" },
  { id: "s5", name: "Aditya Joshi", email: "aditya.j@gmail.com", grade: "Grade 8", status: "active", date: "2024-10-05" },
  { id: "s6", name: "Priya Nair", email: "priya.n@yahoo.com", grade: "Grade 11", status: "pending", date: "2024-11-14" },
  { id: "s7", name: "Vikas Sharma", email: "vikas.s@gmail.com", grade: "Grade 10", status: "active", date: "2024-06-30" },
  { id: "s8", name: "Sneha Gupta", email: "sneha.g@gmail.com", grade: "Grade 12", status: "completed", date: "2024-04-18" },
  { id: "s9", name: "Amit Verma", email: "amit.v@hotmail.com", grade: "Grade 9", status: "active", date: "2024-09-25" },
  { id: "s10", name: "Divya Kumar", email: "divya.k@gmail.com", grade: "Grade 10", status: "trial", date: "2024-11-15" },
  { id: "s11", name: "Raj Malhotra", email: "raj.m@gmail.com", grade: "Grade 11", status: "cancelled", date: "2024-08-02" },
  { id: "s12", name: "Anita Desai", email: "anita.d@gmail.com", grade: "Grade 8", status: "active", date: "2024-10-18" },
  { id: "s13", name: "Karan Mehta", email: "karan.m@gmail.com", grade: "Grade 12", status: "expired", date: "2024-03-11" },
  { id: "s14", name: "Siya Rao", email: "siya.r@gmail.com", grade: "Grade 9", status: "active", date: "2024-11-01" },
  { id: "s15", name: "Nikhil Tiwari", email: "nikhil.t@gmail.com", grade: "Grade 10", status: "pending", date: "2024-11-16" },
]

const STUDENT_COLUMNS = [
  { key: "name", label: "Student Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "grade", label: "Grade", sortable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: StudentRow) => <StatusBadge status={row.status} size="sm" />,
  },
  { key: "date", label: "Enrolled On", sortable: true },
]

// ─── SECTION WRAPPER ────────────────────────────────────────────────────────

function DemoSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className="mb-16">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#1E293B]">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        <div className="mt-3 h-px bg-gradient-to-r from-[#1E3A5F]/20 to-transparent" />
      </div>
      <div className={className}>{children}</div>
    </section>
  )
}

// ─── MODAL DEMO ──────────────────────────────────────────────────────────────

function ModalDemoSection() {
  const [openModal, setOpenModal] = useState<"default" | "danger" | "success" | null>(null)

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => setOpenModal("default")}
        className="px-5 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] transition-colors"
      >
        Open Info Modal
      </button>
      <button
        onClick={() => setOpenModal("danger")}
        className="px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
      >
        Open Danger Modal
      </button>
      <button
        onClick={() => setOpenModal("success")}
        className="px-5 py-2.5 rounded-lg bg-[#22C55E] text-white text-sm font-medium hover:bg-green-600 transition-colors"
      >
        Open Success Modal
      </button>

      <ConfirmationModal
        isOpen={openModal === "default"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => alert("Confirmed!")}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action? This will apply changes immediately."
        confirmText="Yes, Proceed"
        cancelText="No, Cancel"
        variant="default"
      />
      <ConfirmationModal
        isOpen={openModal === "danger"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => alert("Deleted!")}
        title="Delete Student Record"
        message="This action cannot be undone. The student's profile, class history, and all related data will be permanently deleted."
        confirmText="Delete Permanently"
        cancelText="Keep Record"
        variant="danger"
      />
      <ConfirmationModal
        isOpen={openModal === "success"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => alert("Approved!")}
        title="Approve Payout"
        message="You are about to approve a payout of $480 to Dr. Priya Sharma. The funds will be transferred within 2–3 business days."
        confirmText="Approve Payout"
        cancelText="Cancel"
        variant="success"
      />
    </div>
  )
}

// ─── INTERACTIVE STARS DEMO ──────────────────────────────────────────────────

function InteractiveStarsDemo() {
  const [myRating, setMyRating] = useState(0)
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Interactive (click to rate)</p>
        <RatingStars rating={myRating} size="lg" interactive onRate={setMyRating} />
        {myRating > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            You rated: <span className="font-semibold text-[#F59E0B]">{myRating}/5</span>
          </p>
        )}
      </div>
    </div>
  )
}

// ─── SIDEBAR DEMO WRAPPER ────────────────────────────────────────────────────

function SidebarDemoWrapper() {
  return (
    <div className="relative h-[520px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <Sidebar
        role="admin"
        navItems={ADMIN_NAV_ITEMS}
        userName="Sarah Mitchell"
        userEmail="sarah.m@expertguru.com"
      />
      {/* Content area placeholder */}
      <div
        className="absolute inset-0 bg-[#F8FAFC]"
        style={{ left: 260 }}
      >
        <div className="p-6">
          <p className="text-sm text-gray-400 italic">← Dashboard content area</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-white border border-gray-100 shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TOPBAR DEMO WRAPPER ─────────────────────────────────────────────────────

function TopBarDemoWrapper() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <TopBar
        title="Students Management"
        subtitle="Manage student profiles, packages, and progress"
        userName="Sarah Mitchell"
      />
    </div>
  )
}

// ─── PAGE NAVIGATION ─────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "status-badge", label: "StatusBadge" },
  { id: "kpi-cards", label: "KPICard" },
  { id: "rating-stars", label: "RatingStars" },
  { id: "data-table", label: "DataTable" },
  { id: "teacher-cards", label: "TeacherCard" },
  { id: "class-cards", label: "ClassCard" },
  { id: "sidebar", label: "Sidebar" },
  { id: "topbar", label: "TopBar" },
  { id: "notification-dropdown", label: "NotificationDropdown" },
  { id: "confirmation-modal", label: "ConfirmationModal" },
]

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function ComponentsDemoPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page header */}
      <div className="bg-[#0F172A] text-white px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <span className="font-black text-sm">EG</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Expert Guru</span>
          </div>
          <h1 className="text-3xl font-extrabold mt-4 mb-1">UI Component Library</h1>
          <p className="text-gray-400 text-base">
            10 reusable React components for the Expert Guru tutoring management platform.
            Built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, and Lucide React.
          </p>

          {/* Quick nav pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Component sections */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── 1. StatusBadge ── */}
        <DemoSection
          id="status-badge"
          title="1. StatusBadge"
          description="Displays colored status labels using semantic color mapping. Supports sm and md sizes."
        >
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="space-y-5">
              {/* Green statuses */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Success / Active (Green)
                </p>
                <div className="flex flex-wrap gap-2">
                  {["active", "completed", "confirmed", "paid"].map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
              </div>
              {/* Amber statuses */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Warning / Pending (Amber)
                </p>
                <div className="flex flex-wrap gap-2">
                  {["pending", "scheduled"].map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
              </div>
              {/* Red statuses */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Error / Inactive (Red)
                </p>
                <div className="flex flex-wrap gap-2">
                  {["inactive", "cancelled", "failed"].map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
              </div>
              {/* Blue statuses */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Info / Trial (Blue)
                </p>
                <div className="flex flex-wrap gap-2">
                  {["trial", "approved", "under_review"].map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
              </div>
              {/* Gray statuses */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Neutral / Expired (Gray)
                </p>
                <div className="flex flex-wrap gap-2">
                  {["dropped", "expired", "exhausted"].map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
              </div>
              {/* Size comparison */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                  Size Comparison
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">sm:</span>
                    <StatusBadge status="active" size="sm" />
                    <StatusBadge status="pending" size="sm" />
                    <StatusBadge status="cancelled" size="sm" />
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">md:</span>
                    <StatusBadge status="active" size="md" />
                    <StatusBadge status="pending" size="md" />
                    <StatusBadge status="cancelled" size="md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DemoSection>

        {/* ── 2. KPICard ── */}
        <DemoSection
          id="kpi-cards"
          title="2. KPICard"
          description="Dashboard metric cards with icon, value, trend badge, and subtitle."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Students"
              value="847"
              subtitle="Active: 623 | Trial: 89 | Inactive: 135"
              change="+12%"
              changeType="positive"
              icon={GraduationCap}
            />
            <KPICard
              title="Active Teachers"
              value="64"
              subtitle="Verified: 51 | Pending Review: 13"
              change="+3"
              changeType="positive"
              icon={UserCog}
            />
            <KPICard
              title="Monthly Revenue"
              value="$28,460"
              subtitle="Paid: $24,200 | Pending: $4,260"
              change="-4.2%"
              changeType="negative"
              icon={CreditCard}
            />
            <KPICard
              title="Classes This Month"
              value="1,284"
              subtitle="Completed: 1,109 | Cancelled: 175"
              change="0%"
              changeType="neutral"
              icon={BookMarked}
            />
          </div>
        </DemoSection>

        {/* ── 3. RatingStars ── */}
        <DemoSection
          id="rating-stars"
          title="3. RatingStars"
          description="Star rating display with optional review count, three sizes, and interactive mode."
        >
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            {/* Static ratings */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Static Ratings — Various Values
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <RatingStars rating={5} count={421} size="lg" />
                </div>
                <div className="flex items-center gap-4">
                  <RatingStars rating={4.8} count={213} size="md" />
                </div>
                <div className="flex items-center gap-4">
                  <RatingStars rating={3.5} count={67} size="sm" />
                </div>
                <div className="flex items-center gap-4">
                  <RatingStars rating={2.0} size="md" />
                </div>
              </div>
            </div>

            {/* Interactive */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Interactive Mode
              </p>
              <InteractiveStarsDemo />
            </div>
          </div>
        </DemoSection>

        {/* ── 4. DataTable ── */}
        <DemoSection
          id="data-table"
          title="4. DataTable"
          description="Sortable, searchable, paginated data table with optional row selection. Powered by shadcn/ui Table."
        >
          <DataTable
            columns={STUDENT_COLUMNS}
            data={SAMPLE_STUDENTS}
            searchable
            searchPlaceholder="Search students by name, email, grade..."
            pageSize={8}
            selectable
            onSelectionChange={(ids) => console.log("Selected:", ids)}
          />
        </DemoSection>

        {/* ── 5. TeacherCard ── */}
        <DemoSection
          id="teacher-cards"
          title="5. TeacherCard"
          description="Browse-friendly teacher profile card with subjects, rating, experience, and CTA buttons."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_TEACHERS.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </DemoSection>

        {/* ── 6. ClassCard ── */}
        <DemoSection
          id="class-cards"
          title="6. ClassCard"
          description="Scheduled and historical class session cards with status-aware left border and action buttons."
        >
          <div className="flex flex-col gap-3">
            {SAMPLE_CLASSES.map((cls) => (
              <ClassCard key={cls.id} classSession={cls} onRate={(id) => alert(`Rate class ${id}`)} />
            ))}
          </div>
        </DemoSection>

        {/* ── 7. Sidebar ── */}
        <DemoSection
          id="sidebar"
          title="7. Sidebar"
          description="Fixed navigation sidebar with role badge, nav items (with badge counts), active state, and user profile section."
        >
          <SidebarDemoWrapper />
        </DemoSection>

        {/* ── 8. TopBar ── */}
        <DemoSection
          id="topbar"
          title="8. TopBar"
          description="Sticky top header bar with page title, search input, notification bell, and user avatar."
        >
          <TopBarDemoWrapper />
        </DemoSection>

        {/* ── 9. NotificationDropdown ── */}
        <DemoSection
          id="notification-dropdown"
          title="9. NotificationDropdown"
          description="Bell icon with unread count badge. Opens a dropdown panel with categorized notifications and mark-all-read."
        >
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-4">
              Click the bell icon below to open the notification dropdown:
            </p>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                {/* <NotificationDropdown count={4} /> */}
                <span className="text-[10px] text-gray-400">4 unread</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                {/* <NotificationDropdown count={0} /> */}
                <span className="text-[10px] text-gray-400">0 unread</span>
              </div>
            </div>
          </div>
        </DemoSection>

        {/* ── 10. ConfirmationModal ── */}
        <DemoSection
          id="confirmation-modal"
          title="10. ConfirmationModal"
          description="Reusable confirmation dialog with three variants: default (info), danger, and success."
        >
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-5">
              Click a button below to preview each modal variant:
            </p>
            <ModalDemoSection />
          </div>
        </DemoSection>

      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white py-6 px-8 text-center">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-[#1E3A5F]">Expert Guru</span> — UI Component Library •
          Built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui & Lucide React
        </p>
      </div>
    </div>
  )
}
