import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (!token) return NextResponse.next()

    const role = token.userRole as string

    // Strict role-based access — each role can ONLY access their own dashboard
    const roleAccess: Record<string, string> = {
      ADMIN: "/admin",
      COORDINATOR: "/coordinator",
      TEACHER: "/teacher",
      PARENT: "/parent",
    }

    const allowedPrefix = roleAccess[role]

    if (!allowedPrefix) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    // Check if user is accessing a dashboard that isn't theirs
    const dashboardPrefixes = ["/admin", "/coordinator", "/teacher", "/parent"]
    for (const prefix of dashboardPrefixes) {
      if (pathname.startsWith(prefix) && prefix !== allowedPrefix) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/coordinator/:path*",
    "/teacher/:path*",
    "/parent/:path*",
  ],
}
