import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://")

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }
      
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })
      
        if (!user) {
          throw new Error("No account found with this email")
        }
      
        // ── NEW: Check if account is locked ──
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 60000
          )
          throw new Error(
            `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`
          )
        }
      
        // ── NEW: If lock expired, reset ──
        if (user.lockedUntil && user.lockedUntil <= new Date()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          })
        }
      
        if (user.status === "SUSPENDED") {
          throw new Error("Your account has been suspended. Contact support.")
        }
      
        if (user.status === "INACTIVE" && !user.emailVerified) {
          throw new Error(
            "Please verify your email before signing in. Check your inbox for the verification link."
          )
        }
      
        if (user.status === "INACTIVE" && user.emailVerified) {
          throw new Error("Your account is currently inactive. Contact support.")
        }
      
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
      
        if (!isValid) {
          // ── NEW: Increment failed attempts ──
          const settings = await prisma.platformSettings.findFirst({
            where: { id: "default" },
          })
          const maxAttempts = settings?.maxLoginAttempts ?? 5
          const lockoutMinutes = settings?.lockoutDuration ?? 30
          const newAttempts = (user.failedLoginAttempts ?? 0) + 1
      
          if (newAttempts >= maxAttempts) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newAttempts,
                lockedUntil: new Date(Date.now() + lockoutMinutes * 60 * 1000),
              },
            })
            throw new Error(
              `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`
            )
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: newAttempts },
            })
          }
      
          throw new Error("Invalid password")
        }
      
        // ── NEW: Reset failed attempts on successful login ──
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        })
      
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.userRole = (user as any).role
        token.userFirstName = (user as any).firstName
        token.userLastName = (user as any).lastName
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.userRole as any
        session.user.firstName = token.userFirstName as string
        session.user.lastName = token.userLastName as string
      }
      return session
    },
  },

  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: undefined,
      },
    },
    callbackUrl: {
      name: useSecureCookies
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: undefined,
      },
    },
    csrfToken: {
      name: useSecureCookies
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
}
