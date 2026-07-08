'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 h-full w-16 bg-navy-800 flex flex-col items-center py-6 gap-8 border-r border-navy-700">
      {/* Ship wheel logo */}
      <div className="text-gold-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="1" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="23" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
        </svg>
      </div>

      {/* Telescope - Discover */}
      <Link
        href="/discover"
        className={`p-2 rounded-lg transition-colors ${
          pathname === '/discover' ? 'bg-navy-700 text-gold-500' : 'text-gray-400 hover:text-gold-400'
        }`}
        title="Discover"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </Link>

      {/* Anchor - Saved Voyages */}
      <Link
        href="/dashboard"
        className={`p-2 rounded-lg transition-colors ${
          pathname === '/dashboard' ? 'bg-navy-700 text-gold-500' : 'text-gray-400 hover:text-gold-400'
        }`}
        title="Saved Voyages"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="8" x2="12" y2="21" />
          <path d="M5 12h14" />
          <path d="M5 12a7 7 0 0014 0" />
        </svg>
      </Link>

      {/* Compass - Profile */}
      <Link
        href="/profile"
        className={`p-2 rounded-lg transition-colors ${
          pathname === '/profile' ? 'bg-navy-700 text-gold-500' : 'text-gray-400 hover:text-gold-400'
        }`}
        title="Profile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </Link>
    </nav>
  )
}