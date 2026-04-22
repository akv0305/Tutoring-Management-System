"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Home,
} from "lucide-react"

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const status = searchParams.get("status")
  const order = searchParams.get("order")
  const amount = searchParams.get("amount")
  const classes = searchParams.get("classes")
  const message = searchParams.get("message")

  // ─── SUCCESS ───
  if (status === "success") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been confirmed and your classes are now scheduled.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-left">
            {order && (
              <div className="flex justify-between py-2 border-b border-green-100">
                <span className="text-sm text-gray-500">Order Reference</span>
                <span className="text-sm font-semibold text-gray-900">
                  {order}
                </span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between py-2 border-b border-green-100">
                <span className="text-sm text-gray-500">Amount Paid</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${amount}
                </span>
              </div>
            )}
            {classes && (
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Classes Scheduled</span>
                <span className="text-sm font-semibold text-green-700">
                  {classes} class{Number(classes) > 1 ? "es" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/parent/classes")}
              className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-semibold transition-colors"
            >
              View My Classes
            </button>
            <button
              onClick={() => router.push("/parent")}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── CANCELLED (User aborted on CCAvenue page) ───
  if (status === "cancelled") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            You cancelled the payment on the payment gateway page. Your booking
            is still reserved — you can retry the payment from your dashboard.
          </p>

          {order && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">
                Order Reference:{" "}
                <span className="font-semibold text-gray-900">{order}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/parent/payments")}
              className="w-full flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Payment
            </button>
            <button
              onClick={() => router.push("/parent")}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── ALREADY CONFIRMED ───
  if (status === "already-confirmed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Already Confirmed
          </h1>
          <p className="text-gray-600 mb-6">
            This payment has already been processed. Your classes are scheduled.
          </p>

          <button
            onClick={() => router.push("/parent")}
            className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ─── FAILED ───
  if (status === "failed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment could not be processed. Your booked classes have been
            cancelled. You can rebook and try again from your dashboard.
          </p>

          {(order || message) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              {order && (
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-500">Order Reference</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {order}
                  </span>
                </div>
              )}
              {message && (
                <div className="py-1">
                  <span className="text-sm text-gray-500">Reason: </span>
                  <span className="text-sm text-red-700">{message}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/parent/teachers")}
              className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Browse Teachers & Rebook
            </button>
            <button
              onClick={() => router.push("/parent")}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── ERROR / DEFAULT ───
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something Went Wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t determine your payment status. Please check your
          dashboard or contact support if you were charged.
        </p>

        {message && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/parent/payments")}
            className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Check My Payments
          </button>
          <button
            onClick={() => router.push("/parent")}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A5F]" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  )
}
