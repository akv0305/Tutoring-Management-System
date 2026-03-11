import Link from "next/link"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You don&apos;t have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-[#0D9488] text-white rounded-xl text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}
