import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "COORDINATOR" | "TEACHER" | "PARENT"
      firstName: string
      lastName: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: "ADMIN" | "COORDINATOR" | "TEACHER" | "PARENT"
    firstName: string
    lastName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userRole: string
    userFirstName: string
    userLastName: string
  }
}
