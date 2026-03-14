"use client"

import React, { useState } from "react"
import { Plus, Pencil, Copy, ToggleRight, AlertCircle, Star, Eye } from "lucide-react"
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

/* ─── Template columns ─── */

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
    key: "subject",
    label: "Subject",
    sortable: true,
    render: (row: Template) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
        {row.subject}
      </span>
    ),
  },
  {
    key: "classesIncluded",
    label: "Classes",
    sortable: true,
    render: (row: Template) => (
      <span className="font-semibold text-[#1E293B]">{row.classesIncluded}</span>
    ),
  },
  {
    key: "validityDays",
    label: "Validity",
    sortable: true,
    render: (row: Template) => (
      <span className="text-sm text-gray-500">{row.validityDays} days</span>
    ),
  },
  {
    key: "suggestedPrice",
    label: "Suggested Price",
    sortable: true,
    render: (row: Template) => (
      <span className="font-bold text-[#1E3A5F]">{row.suggestedPrice}</span>
    ),
  },
  {
    key: "timesPurchased",
    label: "Purchased",
    sortable: true,
    render: (row: Template) => (
      <span className="font-semibold text-[#0D9488]">{row.timesPurchased}×</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row: Template) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Template) => (
      <div className="flex items-center gap-1">
        <button title="Edit" className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button title="Duplicate" className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
        <button title="Toggle" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><ToggleRight className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

/* ─── Purchased columns ─── */

const purchasedColumns = [
  {
    key: "packageName",
    label: "Package",
    sortable: true,
    render: (row: Purchased) => (
      <div>
        <p className="font-medium text-[#1E293B]">{row.packageName}</p>
        <p className="text-[10px] text-gray-400">from: {row.templateName}</p>
      </div>
    ),
  },
  {
    key: "student",
    label: "Student",
    sortable: true,
    render: (row: Purchased) => (
      <span className="text-sm text-gray-600">{row.student}</span>
    ),
  },
  {
    key: "teacher",
    label: "Teacher",
    sortable: true,
    render: (row: Purchased) => (
      <span className="text-sm text-gray-600">{row.teacher}</span>
    ),
  },
  {
    key: "subject",
    label: "Subject",
    render: (row: Purchased) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
        {row.subject}
      </span>
    ),
  },
  {
    key: "classesIncluded",
    label: "Usage",
    sortable: true,
    render: (row: Purchased) => (
      <span className="font-semibold text-[#1E293B]">{row.classesUsed}/{row.classesIncluded}</span>
    ),
  },
  {
    key: "totalPrice",
    label: "Total",
    sortable: true,
    render: (row: Purchased) => (
      <span className="font-bold text-[#1E3A5F]">{row.totalPrice}</span>
    ),
  },
  {
    key: "expiryDate",
    label: "Expires",
    sortable: true,
    render: (row: Purchased) => (
      <span className="text-xs text-gray-400">{row.expiryDate}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row: Purchased) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    key: "actions",
    label: "Actions",
    render: (_row: Purchased) => (
      <div className="flex items-center gap-1">
        <button title="View" className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
        <button title="Edit" className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
      </div>
    ),
  },
]

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

export function PackagesClient({
  templates,
  purchased,
  kpis,
  subjects,
}: {
  templates: Template[]
  purchased: Purchased[]
  kpis: KPIs
  subjects: SubjectOption[]
}) {
  const [activeTab, setActiveTab] = useState<"templates" | "purchased">("templates")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleTemplateCreated = () => {
    window.location.reload()
  }

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
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "templates"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("purchased")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "purchased"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Purchased ({purchased.length})
        </button>
      </div>

      {/* Table */}
      {activeTab === "templates" ? (
        <DataTable
          columns={templateColumns as Parameters<typeof DataTable>[0]["columns"]}
          data={templates as unknown as Record<string, unknown>[]}
          searchable
          searchPlaceholder="Search templates..."
          pageSize={10}
        />
      ) : (
        <DataTable
          columns={purchasedColumns as Parameters<typeof DataTable>[0]["columns"]}
          data={purchased as unknown as Record<string, unknown>[]}
          searchable
          searchPlaceholder="Search purchased packages..."
          pageSize={10}
        />
      )}

      {/* Create Template Modal */}
      <CreatePackageTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTemplateCreated}
        subjects={subjects}
      />
    </div>
  )
}
