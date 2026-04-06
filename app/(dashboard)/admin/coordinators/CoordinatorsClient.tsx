"use client"

import React, { useState } from "react"
import { UserPlus, Eye, Settings, UserX, UserCheck, X, Loader2, AlertCircle, Info } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { AddCoordinatorModal } from "@/components/modals/AddCoordinatorModal"

type Coordinator = Record<string, unknown> & {
  id: string
  coordinatorName: string
  email: string
  bucketSize: number
  currentStudents: number
  availableSlots: number
  status: string
  joinedDate: string
}

/* ─── Detail Modal ─── */

function CoordinatorDetailModal({
  coordinator,
  onClose,
}: {
  coordinator: Coordinator
  onClose: () => void
}) {
  const utilPct = coordinator.bucketSize > 0
    ? Math.round((coordinator.currentStudents / coordinator.bucketSize) * 100)
    : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-[#1E293B]">Coordinator Details</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {coordinator.coordinatorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1E293B] text-lg">{coordinator.coordinatorName}</p>
              <StatusBadge status={coordinator.status} size="sm" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-[#1E293B]">{coordinator.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-[#1E293B]">{coordinator.joinedDate}</span>
            </div>
          </div>

          {/* Bucket utilization */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bucket Utilization</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current / Max</span>
              <span className="font-bold text-[#1E293B]">{coordinator.currentStudents} / {coordinator.bucketSize}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${utilPct}%`,
                  backgroundColor: utilPct >= 95 ? "#EF4444" : utilPct >= 75 ? "#F59E0B" : "#0D9488",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{utilPct}% utilized</span>
              <span className={`font-semibold ${
                coordinator.availableSlots === 0 ? "text-[#EF4444]"
                : coordinator.availableSlots <= 5 ? "text-[#F97316]"
                : "text-[#22C55E]"
              }`}>
                {coordinator.availableSlots === 0 ? "Full" : `${coordinator.availableSlots} slots available`}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Bucket Config Modal ─── */

function BucketConfigModal({
  coordinator,
  onClose,
  onSuccess,
}: {
  coordinator: Coordinator
  onClose: () => void
  onSuccess: () => void
}) {
  const [bucketSize, setBucketSize] = useState(String(coordinator.bucketSize))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const newSize = Number(bucketSize) || 0

  const handleSave = async () => {
    setError("")
    if (newSize < 1) { setError("Bucket size must be at least 1."); return }
    if (newSize < coordinator.currentStudents) {
      setError(`Cannot set below ${coordinator.currentStudents} — that many students are already assigned.`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/coordinators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coordinator.id, bucketSize: newSize }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); return }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E293B]">Bucket Configuration</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Set the maximum student capacity for <strong>{coordinator.coordinatorName}</strong>.
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Current Students</span>
            <span className="font-semibold text-[#1E293B]">{coordinator.currentStudents}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Current Bucket Size</span>
            <span className="font-semibold text-[#1E293B]">{coordinator.bucketSize}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">New Bucket Size</label>
          <input
            type="number"
            min="1"
            value={bucketSize}
            onChange={(e) => setBucketSize(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
          {newSize > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Available slots after change: <span className="font-semibold">{Math.max(0, newSize - coordinator.currentStudents)}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Toggle Status Modal ─── */

function ToggleStatusModal({
  coordinator,
  onClose,
  onSuccess,
}: {
  coordinator: Coordinator
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isActive = coordinator.status === "active"
  const actionLabel = isActive ? "Deactivate" : "Activate"
  const newStatus = isActive ? "INACTIVE" : "ACTIVE"

  const handleConfirm = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/coordinators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coordinator.id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Action failed"); return }
      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#1E293B] mb-2">{actionLabel} Coordinator</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to {actionLabel.toLowerCase()} <strong>{coordinator.coordinatorName}</strong>?
          {isActive && coordinator.currentStudents > 0 && (
            <span className="block mt-1 text-xs text-amber-600">
              This coordinator has {coordinator.currentStudents} active student{coordinator.currentStudents !== 1 ? "s" : ""}. You may want to reassign them first.
            </span>
          )}
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${isActive ? "bg-[#EF4444] hover:bg-red-600" : "bg-[#22C55E] hover:bg-green-600"}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── MiniKPI ─── */

function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Main Component ─── */

export function CoordinatorsClient({ coordinators }: { coordinators: Coordinator[] }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewCoord, setViewCoord] = useState<Coordinator | null>(null)
  const [bucketCoord, setBucketCoord] = useState<Coordinator | null>(null)
  const [toggleCoord, setToggleCoord] = useState<Coordinator | null>(null)

  const totalSlots = coordinators.reduce((s, c) => s + c.availableSlots, 0)
  const activeCount = coordinators.filter((c) => c.status === "active").length

  const handleCoordinatorAdded = () => { window.location.reload() }
  const handleBucketUpdated = () => { setBucketCoord(null); window.location.reload() }
  const handleStatusToggled = () => { setToggleCoord(null); window.location.reload() }

  const columns = [
    {
      key: "coordinatorName",
      label: "Coordinator Name",
      sortable: true,
      render: (row: Coordinator) => (
        <span className="font-medium text-[#1E293B]">{row.coordinatorName}</span>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row: Coordinator) => (
        <span className="text-sm text-gray-500">{row.email}</span>
      ),
    },
    {
      key: "bucketSize",
      label: "Bucket Size",
      sortable: true,
      render: (row: Coordinator) => (
        <span className="font-semibold text-[#1E293B]">{row.bucketSize}</span>
      ),
    },
    {
      key: "currentStudents",
      label: "Current Students",
      sortable: true,
      render: (row: Coordinator) => (
        <span className="font-semibold text-[#1E293B]">{row.currentStudents}</span>
      ),
    },
    {
      key: "availableSlots",
      label: "Available Slots",
      sortable: true,
      render: (row: Coordinator) => {
        const slots = row.availableSlots
        return (
          <span className={`font-semibold text-sm ${
            slots === 0 ? "text-[#EF4444]" : slots <= 5 ? "text-[#F97316]" : "text-[#22C55E]"
          }`}>
            {slots === 0 ? "Full" : slots}
          </span>
        )
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: Coordinator) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "joinedDate",
      label: "Joined Date",
      sortable: true,
      render: (row: Coordinator) => (
        <span className="text-xs text-gray-400">{row.joinedDate}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Coordinator) => (
        <div className="flex items-center gap-1">
          <button title="View" onClick={() => setViewCoord(row)} className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button title="Bucket Config" onClick={() => setBucketCoord(row)} className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            title={row.status === "active" ? "Deactivate" : "Activate"}
            onClick={() => setToggleCoord(row)}
            className={`p-1.5 rounded-md transition-colors ${row.status === "active" ? "text-[#EF4444] hover:bg-red-50" : "text-[#22C55E] hover:bg-green-50"}`}
          >
            {row.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Coordinator Management</h1>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Add Coordinator
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Coordinators" value={coordinators.length} />
        <MiniKPI label="Active" value={activeCount} valueClass="text-[#22C55E]" />
        <MiniKPI label="Total Available Slots" value={totalSlots} valueClass="text-[#0D9488]" />
        <MiniKPI label="Total Students" value={coordinators.reduce((s, c) => s + c.currentStudents, 0)} valueClass="text-[#1E3A5F]" />
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={coordinators as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search coordinators..."
        pageSize={10}
      />

      <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-0.5">Auto-Assignment Rule</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            New students are automatically assigned to the coordinator with the most available slots.
            If all buckets are full, the least-crowded coordinator receives the assignment.
            Admin can manually reassign at any time.
          </p>
        </div>
      </div>

      {/* Modals */}
      <AddCoordinatorModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleCoordinatorAdded} />
      {viewCoord && <CoordinatorDetailModal coordinator={viewCoord} onClose={() => setViewCoord(null)} />}
      {bucketCoord && <BucketConfigModal coordinator={bucketCoord} onClose={() => setBucketCoord(null)} onSuccess={handleBucketUpdated} />}
      {toggleCoord && <ToggleStatusModal coordinator={toggleCoord} onClose={() => setToggleCoord(null)} onSuccess={handleStatusToggled} />}
    </div>
  )
}
