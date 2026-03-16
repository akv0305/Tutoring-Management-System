"use client"

import React, { useState } from "react"
import { Plus, Pencil, Copy, ToggleRight, ToggleLeft, AlertCircle, Star, Eye, Loader2, X } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { CreatePackageTemplateModal } from "@/components/modals/CreatePackageTemplateModal"

/* ─── Types ─── */

type Template = Record<string, unknown> & {
  id: string
  name: string
  subject: string
  classesIncluded: number
  validityDays: number
  suggestedPrice: string
  isPopular: boolean
  status: string
  timesPurchased: number
}

type Purchased = Record<string, unknown> & {
  id: string
  packageName: string
  templateName: string
  student: string
  teacher: string
  subject: string
  classesIncluded: number
  classesUsed: number
  pricePerClass: string
  totalPrice: string
  validity: string
  expiryDate: string
  status: string
}

type KPIs = {
  totalTemplates: number
  activeTemplates: number
  totalPurchased: number
  activePurchased: number
  totalRevenue: number
}

type SubjectOption = { id: string; name: string }

type EditModal = { template: Template } | null

/* ─── MiniKPI ─── */

function MiniKPI({ label, value, valueClass = "text-[#1E293B]" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Edit Template Modal ─── */

function EditTemplateModal({
  template,
  subjects,
  onClose,
  onSuccess,
}: {
  template: Template
  subjects: SubjectOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(template.name)
  const [classesIncluded, setClassesIncluded] = useState(String(template.classesIncluded))
  const [validityDays, setValidityDays] = useState(String(template.validityDays))
  const [suggestedPrice, setSuggestedPrice] = useState(template.suggestedPrice.replace("$", ""))
  const [isPopular, setIsPopular] = useState(template.isPopular)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setError("")
    if (!name.trim()) { setError("Name is required."); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/package-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          name: name.trim(),
          classesIncluded: parseInt(classesIncluded),
          validityDays: parseInt(validityDays),
          suggestedPrice: parseFloat(suggestedPrice),
          isPopular,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); return }
      onSuccess()
      onClose()
    } catch { setError("Network error.") }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1E293B]">Edit Template</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Template Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Classes</label>
            <input type="number" min="1" value={classesIncluded} onChange={(e) => setClassesIncluded(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Validity (days)</label>
            <input type="number" min="1" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
            <input type="number" step="0.01" min="0" value={suggestedPrice} onChange={(e) => setSuggestedPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-10 h-5 rounded-full flex items-center transition-colors ${isPopular ? "bg-[#F59E0B]" : "bg-gray-200"}`} onClick={() => setIsPopular(!isPopular)}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isPopular ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-gray-700">Popular</span>
        </label>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={submitting} className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

export function PackagesClient({
  templates: initialTemplates,
  purchased,
  kpis,
  subjects,
}: {
  templates: Template[]
  purchased: Purchased[]
  kpis: KPIs
  subjects: SubjectOption[]
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [activeTab, setActiveTab] = useState<"templates" | "purchased">("templates")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<EditModal>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleTemplateCreated = () => { window.location.reload() }

  const handleToggle = async (template: Template) => {
    setActionLoading(template.id)
    try {
      const res = await fetch("/api/package-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: template.id, action: "toggle" }),
      })
      const data = await res.json()
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) => t.id === template.id ? { ...t, status: data.template.status.toLowerCase() } : t)
        )
      }
    } catch { /* silent */ }
    finally { setActionLoading(null) }
  }

  const handleDuplicate = async (template: Template) => {
    setActionLoading(template.id)
    try {
      const res = await fetch("/api/package-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: template.id, action: "duplicate" }),
      })
      if (res.ok) { window.location.reload() }
    } catch { /* silent */ }
    finally { setActionLoading(null) }
  }

  const templateColumns = [
    {
      key: "name",
      label: "Template Name",
      sortable: true,
      render: (row: Template) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#1E293B]">{row.name}</span>
          {row.isPopular && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> POPULAR
            </span>
          )}
        </div>
      ),
    },
    {
      key: "subject", label: "Subject", sortable: true,
      render: (row: Template) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">{row.subject}</span>
      ),
    },
    {
      key: "classesIncluded", label: "Classes", sortable: true,
      render: (row: Template) => <span className="font-semibold text-[#1E293B]">{row.classesIncluded}</span>,
    },
    {
      key: "validityDays", label: "Validity", sortable: true,
      render: (row: Template) => <span className="text-sm text-gray-500">{row.validityDays} days</span>,
    },
    {
      key: "suggestedPrice", label: "Suggested Price", sortable: true,
      render: (row: Template) => <span className="font-bold text-[#1E3A5F]">{row.suggestedPrice}</span>,
    },
    {
      key: "timesPurchased", label: "Purchased", sortable: true,
      render: (row: Template) => <span className="font-semibold text-[#0D9488]">{row.timesPurchased}×</span>,
    },
    {
      key: "status", label: "Status",
      render: (row: Template) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "actions", label: "Actions",
      render: (row: Template) => {
        const isLoading = actionLoading === row.id
        return (
          <div className="flex items-center gap-1">
            <button
              title="Edit"
              onClick={() => setEditModal({ template: row })}
              disabled={isLoading}
              className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              title="Duplicate"
              onClick={() => handleDuplicate(row)}
              disabled={isLoading}
              className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              title={row.status === "active" ? "Disable" : "Enable"}
              onClick={() => handleToggle(row)}
              disabled={isLoading}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                row.status === "active"
                  ? "text-[#0D9488] hover:bg-teal-50"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {row.status === "active"
                ? <ToggleRight className="w-3.5 h-3.5" />
                : <ToggleLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        )
      },
    },
  ]

  const purchasedColumns = [
    {
      key: "packageName", label: "Package", sortable: true,
      render: (row: Purchased) => (
        <div>
          <p className="font-medium text-[#1E293B]">{row.packageName}</p>
          <p className="text-[10px] text-gray-400">from: {row.templateName}</p>
        </div>
      ),
    },
    { key: "student", label: "Student", sortable: true, render: (row: Purchased) => <span className="text-sm text-gray-600">{row.student}</span> },
    { key: "teacher", label: "Teacher", sortable: true, render: (row: Purchased) => <span className="text-sm text-gray-600">{row.teacher}</span> },
    {
      key: "subject", label: "Subject",
      render: (row: Purchased) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">{row.subject}</span>
      ),
    },
    { key: "classesIncluded", label: "Usage", sortable: true, render: (row: Purchased) => <span className="font-semibold text-[#1E293B]">{row.classesUsed}/{row.classesIncluded}</span> },
    { key: "totalPrice", label: "Total", sortable: true, render: (row: Purchased) => <span className="font-bold text-[#1E3A5F]">{row.totalPrice}</span> },
    { key: "expiryDate", label: "Expires", sortable: true, render: (row: Purchased) => <span className="text-xs text-gray-400">{row.expiryDate}</span> },
    { key: "status", label: "Status", sortable: true, render: (row: Purchased) => <StatusBadge status={row.status} size="sm" /> },
    {
      key: "actions", label: "Actions",
      render: (_row: Purchased) => (
        <div className="flex items-center gap-1">
          <button title="View" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
          <button title="Edit" className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Package Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "templates" ? "Create Template" : "Create Package"}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <MiniKPI label="Templates" value={kpis.totalTemplates} />
        <MiniKPI label="Active Templates" value={kpis.activeTemplates} valueClass="text-[#22C55E]" />
        <MiniKPI label="Purchased" value={kpis.totalPurchased} valueClass="text-[#1E3A5F]" />
        <MiniKPI label="Active Purchases" value={kpis.activePurchased} valueClass="text-[#0D9488]" />
        <MiniKPI label="Total Revenue" value={`$${kpis.totalRevenue.toLocaleString()}`} valueClass="text-[#1E3A5F]" />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-l-4 border-[#F59E0B] rounded-lg">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">How it works:</span> Create package templates (catalog). When a parent purchases, a package instance is created linking the template to a specific student + teacher.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab("templates")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "templates" ? "bg-white text-[#1E3A5F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Templates ({templates.length})
        </button>
        <button onClick={() => setActiveTab("purchased")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "purchased" ? "bg-white text-[#1E3A5F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Purchased ({purchased.length})
        </button>
      </div>

      {/* Table */}
      {activeTab === "templates" ? (
        <DataTable
          columns={templateColumns as Parameters<typeof DataTable>[0]["columns"]}
          data={templates as unknown as Record<string, unknown>[]}
          searchable searchPlaceholder="Search templates..." pageSize={10}
        />
      ) : (
        <DataTable
          columns={purchasedColumns as Parameters<typeof DataTable>[0]["columns"]}
          data={purchased as unknown as Record<string, unknown>[]}
          searchable searchPlaceholder="Search purchased packages..." pageSize={10}
        />
      )}

      {/* Modals */}
      <CreatePackageTemplateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleTemplateCreated} subjects={subjects} />
      {editModal && <EditTemplateModal template={editModal.template} subjects={subjects} onClose={() => setEditModal(null)} onSuccess={() => window.location.reload()} />}
    </div>
  )
}
