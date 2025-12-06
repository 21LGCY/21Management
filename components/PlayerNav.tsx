'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Users, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function PlayerNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const isActive = (path: string) => pathname === path

  return (
    <div className="border-b border-gray-800 bg-dark-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1">
          <Link
            href="/dashboard/player"
            className={`flex items-center gap-2 px-4 py-4 border-b-2 transition font-medium ${
              isActive('/dashboard/player')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <Home className="w-4 h-4" />
            {t('dashboard')}
          </Link>
          <Link
            href="/dashboard/player/stats"
            className={`flex items-center gap-2 px-4 py-4 border-b-2 transition font-medium ${
              isActive('/dashboard/player/stats')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t('stats')}
          </Link>
          <Link
            href="/dashboard/player/teams"
            className={`flex items-center gap-2 px-4 py-4 border-b-2 transition font-medium ${
              isActive('/dashboard/player/teams')
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('team')}
          </Link>
        </nav>
      </div>
    </div>
  )
}
