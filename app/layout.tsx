import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Expert Guru – Expert Tutoring from India\'s Top Educators',
  description: 'Personalized 1-on-1 online tutoring for K-12, AP, IB, SAT & ACT. Same tutor every session. Book your free trial today.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
