import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | Expert Guru",
    default: "Account | Expert Guru",
  },
  description:
    "Access your Expert Guru tutoring account. Log in, register, or reset your password.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
