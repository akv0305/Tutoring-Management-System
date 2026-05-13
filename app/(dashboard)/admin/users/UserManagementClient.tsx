"use client"

import React, { useState, useMemo } from "react"
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  Ban,
  Unlock,
  Mail,
  KeyRound,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Users,
  GraduationCap,
  UserCog,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"

// ─── Types ───

type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  phone: string | null
  lastLoginAt: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  createdAt: string
  isLocked: boolean
}

type ActionType =
  | "activate"
  | "deactivate"
  | "suspend"
  | "unlock"
  | "send_reset_email"
  | "set_password"

// ─── Constants ───

const ROLE_FILTERS = [
  { value: "", label: "All Roles" },
  { value: "TEACHER", label: "Teachers" },
  { value: "PARENT", label: "Parents" },
  { value: "COORDINATOR", label: "Coordinators" },
]

const STATUS_FILTERS = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
]

const ROLE_ICONS: Record<string, React.ReactNode> = {
  TEACHER: <GraduationCap className="w-3.5 h-3.5" />,
  PARENT: <Users className="w-3.5 h-3.5" />,
  COORDINATOR: <UserCog className="w-3.5 h-3.5" />,
}

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-purple-100 text-purple-700 border-purple-200",
  PARENT: "bg-blue-100 text-blue-700 border-blue-200",
  COORDINATOR: "bg-teal-100 text-teal-700 border-teal-200",
}

const PAGE_SIZE = 15

// ─── Helper ───

function formatDate(iso: string | null): string {
  if (!iso) return "Never"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Action Modal ───

function ActionModal({
  user,
  action,
  onClose,
  onSuccess,
}: {
  user: User
  action: ActionType
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const fullName = `${user.firstName} ${user.lastName}`

  const config: Record<
    ActionType,
    {
      title: string
      description: string
      confirmLabel: string
      confirmClass: string
      icon: React.ReactNode
    }
  > = {
    activate: {
      title: "Activate User",
      description: `Activate ${fullName}'s account? They will be able to log in and access their dashboard.`,
      confirmLabel: "Activate",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700",
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
    },
    deactivate: {
      title: "Deactivate User",
      description: `Deactivate ${fullName}'s account? They will not be able to log in. This can be reversed.`,
      confirmLabel: "Deactivate",
      confirmClass: "bg-gray-600 hover:bg-gray-700",
      icon: <UserX className="w-5 h-5 text-gray-600" />,
    },
    suspend: {
      title: "Suspend User",
      description: `Suspend ${fullName}'s account? They will be blocked from logging in until manually reactivated.`,
      confirmLabel: "Suspend",
      confirmClass: "bg-red-600 hover:bg-red-700",
      icon: <Ban className="w-5 h-5 text-red-600" />,
    },
    unlock: {
      title: "Unlock Account",
      description: `Unlock ${fullName}'s account? This will clear ${user.failedLoginAttempts} failed login attempt(s) and remove the lockout.`,
      confirmLabel: "Unlock Account",
      confirmClass: "bg-amber-600 hover:bg-amber-700",
      icon: <Unlock className="w-5 h-5 text-amber-600" />,
    },
    send_reset_email: {
      title: "Send Password Reset Email",
      description: `Send a password reset link to ${user.email}? The link will expire in 24 hours.`,
      confirmLabel: "Send Reset Email",
      confirmClass: "bg-[#0D9488] hover:bg-teal-700",
      icon: <Mail className="w-5 h-5 text-[#0D9488]" />,
    },
    set_password: {
      title: "Set Temporary Password",
      description: `Set a new temporary password for ${fullName}. Share it securely — they should change it after first login.`,
      confirmLabel: "Set Password",
      confirmClass: "bg-[#1E3A5F] hover:bg-[#162d4a]",
      icon: <KeyRound className="w-5 h-5 text-[#1E3A5F]" />,
    },
  }

  const c = config[action]

  const handleConfirm = async () => {
    if (action === "set_password" && newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action,
          ...(action === "set_password" && { newPassword }),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Action failed.")
        return
      }

      onSuccess(data.message)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {c.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">{c.title}</h3>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-5">{c.description}</p>

        {/* Password field for set_password action */}
        {action === "set_password" && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${c.confirmClass}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───

export default function UserManagementClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Action modal state
  const [actionUser, setActionUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<ActionType | null>(null)

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = users

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (statusFilter) {
      result = result.filter((u) => u.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      )
    }

    return result
  }, [users, search, roleFilter, statusFilter])

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // ── Summary ──
  const summary = useMemo(() => {
    return {
      total: users.length,
      teachers: users.filter((u) => u.role === "TEACHER").length,
      parents: users.filter((u) => u.role === "PARENT").length,
      coordinators: users.filter((u) => u.role === "COORDINATOR").length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      locked: users.filter((u) => u.isLocked).length,
    }
  }, [users])

  // ── Action handlers ──
  const openAction = (user: User, action: ActionType) => {
    setActionUser(user)
    setActionType(action)
  }

  const handleActionSuccess = (message: string) => {
    setActionUser(null)
    setActionType(null)
    setToast({ type: "success", message })

    // Refresh user list
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          const refreshed = data.users.map((u: any) => ({
            ...u,
            lastLoginAt: u.lastLoginAt || null,
            lockedUntil: u.lockedUntil || null,
            isLocked: !!(u.lockedUntil && new Date(u.lockedUntil) > new Date()),
          }))
          setUsers(refreshed)
        }
      })
      .catch(() => {})

    // Auto-dismiss toast
    setTimeout(() => setToast(null), 5000)
  }

  // Reset page when filters change
  const handleSearchChange = (v: string) => {
    setSearch(v)
    setCurrentPage(1)
  }
  const handleRoleChange = (v: string) => {
    setRoleFilter(v)
    setCurrentPage(1)
  }
  const handleStatusChange = (v: string) => {
    setStatusFilter(v)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#1E3A5F]" />
          User Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all user accounts — reset passwords, activate/deactivate, unlock
          locked accounts.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-0.5 hover:bg-black/5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total Users" value={summary.total} />
        <KPICard
          label="Teachers"
          value={summary.teachers}
          icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
        />
        <KPICard
          label="Parents"
          value={summary.parents}
          icon={<Users className="w-4 h-4 text-blue-500" />}
        />
        <KPICard
          label="Coordinators"
          value={summary.coordinators}
          icon={<UserCog className="w-4 h-4 text-teal-500" />}
        />
        <KPICard
          label="Active"
          value={summary.active}
          valueClass="text-emerald-600"
        />
        <KPICard
          label="Locked"
          value={summary.locked}
          valueClass={summary.locked > 0 ? "text-red-600" : "text-gray-400"}
          icon={summary.locked > 0 ? <Lock className="w-4 h-4 text-red-500" /> : undefined}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            {ROLE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Result count */}
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Last Login
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Created
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1E293B] truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-gray-400">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
                          ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {ROLE_ICONS[user.role]}
                        {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge
                          status={user.status.toLowerCase()}
                          size="sm"
                        />
                        {user.isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-medium">
                            <Lock className="w-3 h-3" />
                            Locked ({user.failedLoginAttempts} attempts)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(user.lastLoginAt)}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Activate / Deactivate */}
                        {user.status === "ACTIVE" ? (
                          <button
                            title="Deactivate"
                            onClick={() => openAction(user, "deactivate")}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            title="Activate"
                            onClick={() => openAction(user, "activate")}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Suspend (only if not already suspended) */}
                        {user.status !== "SUSPENDED" && (
                          <button
                            title="Suspend"
                            onClick={() => openAction(user, "suspend")}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {/* Unlock (only if locked) */}
                        {user.isLocked && (
                          <button
                            title="Unlock Account"
                            onClick={() => openAction(user, "unlock")}
                            className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}

                        {/* Send reset email */}
                        <button
                          title="Send Password Reset Email"
                          onClick={() => openAction(user, "send_reset_email")}
                          className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {/* Set password manually */}
                        <button
                          title="Set Temporary Password"
                          onClick={() => openAction(user, "set_password")}
                          className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                      currentPage === page
                        ? "bg-[#1E3A5F] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionUser && actionType && (
        <ActionModal
          user={actionUser}
          action={actionType}
          onClose={() => {
            setActionUser(null)
            setActionType(null)
          }}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  )
}

// ─── KPI Card sub-component ───

function KPICard({
  label,
  value,
  valueClass = "text-[#1E293B]",
  icon,
}: {
  label: string
  value: number
  valueClass?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">
          {label}
        </p>
        {icon}
      </div>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
