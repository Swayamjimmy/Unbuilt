import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IdeaForge - Discover Your Next Project',
  description: 'AI-powered project idea discovery engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-navy-900 text-white min-h-screen`}>
        {/* Sidebar navigation */}
        <Navigation />
        {/* Main content area offset by nav width */}
        <main className="ml-16 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}