"use client"

import React, { useState, useMemo } from "react"
import {
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  X,
  MessageSquareText, FileDown,
} from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Payment = {
  id: string
  paymentId: string
  student: string
  packageName: string
  amount: string
  amountNum: number
  method: string
  status: string
  date: string
  confirmedBy: string | null
  bankReference: string
  adminNotes: string
  refundedAmount: number
}

type KPIs = {
  totalCollected: number
  pending: number
  pendingCount: number
  refunded: number
  total: number
}

type ActionModal = {
  paymentId: string
  action: "confirm" | "reject"
  student: string
  amount: string
} | null

function MiniKPI({
  label,
  value,
  valueClass = "text-[#1E293B]",
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function downloadInvoice(payment: Payment) {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice ${payment.paymentId}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; }

  .invoice-container { max-width: 760px; margin: 0 auto; padding: 40px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #4F46E5; }
  .company-block { display: flex; align-items: flex-start; gap: 16px; }
  .company-logo { width: 60px; height: 60px; object-fit: contain; }
  .company-name { font-size: 22px; font-weight: 700; color: #4F46E5; margin-bottom: 2px; }
  .company-details { font-size: 11.5px; color: #555; line-height: 1.6; }
  .invoice-title-block { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 800; color: #4F46E5; letter-spacing: 1px; }
  .invoice-meta { margin-top: 6px; font-size: 12px; color: #666; }
  .invoice-meta span { display: block; }

  /* Status badge */
  .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-confirmed { background: #DEF7EC; color: #03543F; }
  .status-pending { background: #FEF3C7; color: #92400E; }
  .status-rejected, .status-failed { background: #FDE8E8; color: #9B1C1C; }
  .status-refunded { background: #E0E7FF; color: #3730A3; }

  /* Bill-to */
  .bill-to { margin-bottom: 28px; padding: 16px 20px; background: #F8FAFC; border-radius: 8px; border-left: 4px solid #4F46E5; }
  .bill-to-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4F46E5; margin-bottom: 4px; }
  .bill-to-name { font-size: 15px; font-weight: 600; color: #1a1a1a; }
  .bill-to-detail { font-size: 12px; color: #555; }

  /* Table */
  .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .inv-table thead th { background: #4F46E5; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .inv-table thead th:first-child { border-radius: 6px 0 0 0; }
  .inv-table thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
  .inv-table tbody td { padding: 12px 14px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
  .inv-table tbody td:last-child { text-align: right; font-weight: 600; }
  .inv-table tbody tr:last-child td { border-bottom: none; }

  /* Totals */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .total-row.grand { border-top: 2px solid #4F46E5; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #4F46E5; }

  /* Footer */
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
  .footer-grid { display: flex; justify-content: space-between; gap: 24px; }
  .footer-col h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4F46E5; margin-bottom: 6px; }
  .footer-col p { font-size: 11.5px; color: #555; line-height: 1.6; }
  .footer-note { text-align: center; margin-top: 24px; font-size: 11px; color: #999; }

  /* Print */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="invoice-container">

  <!-- Header -->
  <div class="header">
    <div class="company-block">
      <img src="/images/eglogo.png" class="company-logo" alt="DG Tutor"/>
      <div>
        <div class="company-name">DG Tutor</div>
        <div class="company-details">
          H.No-3, Phase 2, Kowkoor, Secunderabad<br/>
          Hyderabad, Telangana, 500010<br/>
          Ph: 7993924180 &nbsp;|&nbsp; info@dgtutor.net<br/>
          <strong>GSTIN:</strong> 36BGRPM0936M1ZS
        </div>
      </div>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-meta">
        <span><strong>Invoice No:</strong> ${payment.paymentId}</span>
        <span><strong>Date:</strong> ${payment.date}</span>
        <span style="margin-top:4px"><strong>Status:</strong> <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span></span>
      </div>
    </div>
  </div>

  <!-- Bill To -->
  <div class="bill-to">
    <div class="bill-to-label">Billed To</div>
    <div class="bill-to-name">${payment.student}</div>
    <div class="bill-to-detail">Package: ${payment.packageName || "N/A"}</div>
  </div>

  <!-- Items Table -->
  <table class="inv-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Method</th>
        <th>Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>${payment.packageName || "Tutoring Package"}</strong><br/>
          <span style="color:#666;font-size:12px">Student: ${payment.student}</span>
        </td>
        <td>${payment.method || "—"}</td>
        <td>₹${payment.amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${payment.amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      </div>
      ${payment.refundedAmount > 0 ? `
      <div class="total-row" style="color:#DC2626;">
        <span>Refunded</span>
        <span>-₹${payment.refundedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      </div>` : ""}
      <div class="total-row grand">
        <span>Total</span>
        <span>₹${(payment.amountNum - (payment.refundedAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>

  ${payment.bankReference ? `
  <div style="margin-bottom:24px;padding:12px 16px;background:#F0FDF4;border-radius:6px;border-left:4px solid #16A34A;">
    <strong style="font-size:11px;color:#16A34A;text-transform:uppercase;letter-spacing:0.5px;">Bank Reference</strong><br/>
    <span style="font-size:13px;color:#1a1a1a;">${payment.bankReference}</span>
  </div>` : ""}

  ${payment.adminNotes ? `
  <div style="margin-bottom:24px;padding:12px 16px;background:#FEF3C7;border-radius:6px;border-left:4px solid #F59E0B;">
    <strong style="font-size:11px;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">Notes</strong><br/>
    <span style="font-size:13px;color:#1a1a1a;">${payment.adminNotes}</span>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-grid">
      <div class="footer-col">
        <h4>Payment Information</h4>
        <p>All payments are processed in Indian Rupees (INR).<br/>
        For queries, contact info@dgtutor.net</p>
      </div>
      <div class="footer-col">
        <h4>DG Tutor</h4>
        <p>H.No-3, Phase 2, Kowkoor, Secunderabad<br/>
        Hyderabad, Telangana, 500010<br/>
        GSTIN: 36BGRPM0936M1ZS</p>
      </div>
    </div>
    <div class="footer-note">
      This is a computer-generated invoice and does not require a physical signature.
    </div>
  </div>

</div>

<!-- Print trigger -->
<script>
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}


export function PaymentsClient({
  payments: initialPayments,
  kpis: initialKpis,
}: {
  payments: Payment[]
  kpis: KPIs
}) {
  const [payments, setPayments] = useState(initialPayments)
  const [kpis, setKpis] = useState(initialKpis)
  const [filter, setFilter] = useState<"all" | "pending">("all")
  const [processing, setProcessing] = useState(false)

  // ── Modal state ──
  const [actionModal, setActionModal] = useState<ActionModal>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [notesError, setNotesError] = useState(false)

  const filtered = useMemo(() => {
    if (filter === "pending")
      return payments.filter((p) => p.status === "pending")
    return payments
  }, [filter, payments])

  function openModal(
    paymentId: string,
    action: "confirm" | "reject",
    student: string,
    amount: string
  ) {
    setActionModal({ paymentId, action, student, amount })
    setAdminNotes("")
    setNotesError(false)
  }

  function closeModal() {
    setActionModal(null)
    setAdminNotes("")
    setNotesError(false)
  }

  async function handleSubmit() {
    if (!actionModal) return
    if (!adminNotes.trim()) {
      setNotesError(true)
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionModal.paymentId,
          action: actionModal.action,
          adminNotes: adminNotes.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const payment = payments.find((p) => p.id === actionModal.paymentId)
        setPayments((prev) =>
          prev.map((p) =>
            p.id === actionModal.paymentId
              ? {
                  ...p,
                  status:
                    actionModal.action === "confirm" ? "confirmed" : "failed",
                  adminNotes: adminNotes.trim(),
                }
              : p
          )
        )
        setKpis((prev) => ({
          ...prev,
          pendingCount: prev.pendingCount - 1,
          pending: prev.pending - (payment?.amountNum ?? 0),
          ...(actionModal.action === "confirm"
            ? {
                totalCollected:
                  prev.totalCollected + (payment?.amountNum ?? 0),
              }
            : {}),
        }))
        closeModal()
      } else {
        alert(data.error || "Failed to process payment")
      }
    } catch {
      alert("Network error")
    } finally {
      setProcessing(false)
    }
  }

  const columns = [
    {
      key: "paymentId",
      label: "Payment ID",
      render: (r: Payment) => (
        <span className="font-mono text-xs font-semibold text-[#1E3A5F]">
          {r.paymentId}
        </span>
      ),
    },
    {
      key: "student",
      label: "Student",
      sortable: true,
      render: (r: Payment) => (
        <span className="font-medium text-[#1E293B]">{r.student}</span>
      ),
    },
    {
      key: "packageName",
      label: "Package",
      render: (r: Payment) => (
        <span className="text-sm text-gray-600">{r.packageName}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (r: Payment) => (
        <span className="font-bold text-[#1E293B]">{r.amount}</span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (r: Payment) => (
        <span className="text-sm text-gray-600">{r.method}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r: Payment) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={r.status} size="sm" />
          {r.status === "refunded" &&
            r.refundedAmount > 0 &&
            r.refundedAmount < r.amountNum && (
              <span className="text-[10px] text-gray-400">
                Partial: ${r.refundedAmount.toFixed(2)} of {r.amount}
              </span>
            )}
        </div>
      ),
    },
    {
      key: "adminNotes",
      label: "Notes",
      render: (r: Payment) =>
        r.adminNotes ? (
          <span
            className="text-xs text-gray-600 max-w-[180px] truncate block cursor-help"
            title={r.adminNotes}
          >
            {r.adminNotes}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (r: Payment) => (
        <span className="text-xs text-gray-500">{r.date}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: Payment) => (
        <div className="flex items-center gap-1">
          <button
            title="View"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => downloadInvoice(r)}
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
            title="Download Invoice"
          >
            <FileDown className="w-4 h-4" />
          </button>
          {r.status === "pending" && (
            <>
              <button
                title="Approve"
                onClick={() =>
                  openModal(r.id, "confirm", r.student, r.amount)
                }
                className="p-1.5 rounded-md text-[#22C55E] hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
              <button
                title="Reject"
                onClick={() =>
                  openModal(r.id, "reject", r.student, r.amount)
                }
                className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },

  ]

  const isConfirm = actionModal?.action === "confirm"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Payment Management
        </h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filter === "all"
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            filter === "pending"
              ? "bg-[#1E3A5F] text-white border-[#1E3A5F]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Pending
          {kpis.pendingCount > 0 && (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                filter === "pending"
                  ? "bg-white text-[#1E3A5F]"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {kpis.pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI
          label="Total Collected"
          value={`$${kpis.totalCollected.toLocaleString()}`}
          valueClass="text-[#22C55E]"
        />
        <MiniKPI label="Total Payments" value={kpis.total} />
        <MiniKPI
          label="Pending Confirmation"
          value={`$${kpis.pending.toLocaleString()}`}
          valueClass="text-[#F59E0B]"
        />
        <MiniKPI
          label="Refunded"
          value={`$${kpis.refunded.toLocaleString()}`}
          valueClass="text-[#EF4444]"
        />
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchPlaceholder="Search payments..."
        pageSize={10}
      />

      {/* ── Approve / Reject Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between ${
                isConfirm ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {isConfirm ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h2
                  className={`text-lg font-bold ${
                    isConfirm ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isConfirm ? "Approve Payment" : "Reject Payment"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-md hover:bg-white/60 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Student</span>
                <span className="font-semibold text-[#1E293B]">
                  {actionModal.student}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-[#1E293B]">
                  {actionModal.amount}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MessageSquareText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  Notes / Remarks{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => {
                    setAdminNotes(e.target.value)
                    if (e.target.value.trim()) setNotesError(false)
                  }}
                  placeholder={
                    isConfirm
                      ? 'e.g., "Bank ref: TXN-98765" or "Opening balance — pre-paid before go-live"'
                      : 'e.g., "Payment not received" or "Duplicate booking"'
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    notesError
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-200 focus:ring-blue-300"
                  }`}
                />
                {notesError && (
                  <p className="text-xs text-red-500 mt-1">
                    Notes are required before {isConfirm ? "approving" : "rejecting"}.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2 ${
                  isConfirm
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {isConfirm ? "Approve Payment" : "Reject Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
