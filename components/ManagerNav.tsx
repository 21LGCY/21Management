'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Shield, TrendingUp } from 'lucide-react'

const navItems = [
  {
    name: 'Overview',
    href: '/dashboard/manager',
    icon: Home,
  },
  {
    name: 'Player Management',
    href: '/dashboard/manager/players',
    icon: Users,
  },
  {
    name: 'Team/Roster Management',
    href: '/dashboard/manager/teams',
    icon: Shield,
  },
  {
    name: 'Stats Management',
    href: '/dashboard/manager/stats',
    icon: TrendingUp,
  },
]

export default function ManagerNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 border-b border-gray-800">
      <div className="flex space-x-8">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}