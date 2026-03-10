import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Expert Guru – Expert Tutoring from India's Top Educators",
  description:
    "Personalized 1-on-1 online tutoring for K-12, AP, IB, SAT & ACT. Same tutor every session. Flexible scheduling across time zones. Book your free trial today.",
  keywords: [
    "online tutoring",
    "K-12 tutoring",
    "SAT prep",
    "ACT prep",
    "IB tutoring",
    "AP tutoring",
    "math tutor",
    "science tutor",
    "Expert Guru",
  ],
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
