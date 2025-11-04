'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth/client'
import { LogOut, Menu, X, Users, Shield, Search, Home, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRole } from '@/lib/types/database'

interface NavbarProps {
  role: UserRole
  username: string
}

export default function Navbar({ role, username }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-dark-card border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={`/dashboard/${role}`}>
              <div className="flex items-center cursor-pointer">
                <Image 
                  src="/images/21.svg" 
                  alt="21 Legacy" 
                  width={40} 
                  height={40}
                  className="w-10 h-10"
                />
              </div>
            </Link>
            
            {/* Admin Navigation Links */}
            {role === 'admin' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard/admin/users"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Users className="w-4 h-4" />
                  Users
                </Link>
                <Link 
                  href="/dashboard/admin/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Shield className="w-4 h-4" />
                  Teams
                </Link>
                <Link 
                  href="/dashboard/admin/tryouts"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Search className="w-4 h-4" />
                  Tryouts
                </Link>
              </div>
            )}

            {/* Manager Navigation Links */}
            {role === 'manager' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard/manager"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Home className="w-4 h-4" />
                  Overview
                </Link>
                <Link 
                  href="/dashboard/manager/players"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Users className="w-4 h-4" />
                  Player Management
                </Link>
                <Link 
                  href="/dashboard/manager/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <Shield className="w-4 h-4" />
                  Team/Roster Management
                </Link>
                <Link 
                  href="/dashboard/manager/stats"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <TrendingUp className="w-4 h-4" />
                  Stats Management
                </Link>
              </div>
            )}

            <div className="flex items-center">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium capitalize">
                {role}
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-300">{username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800">
          <div className="px-4 py-3 space-y-3">
            {/* Admin Links in Mobile */}
            {role === 'admin' && (
              <div className="space-y-2 pb-3 border-b border-gray-800">
                <Link 
                  href="/dashboard/admin/users"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4" />
                  Users
                </Link>
                <Link 
                  href="/dashboard/admin/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Teams
                </Link>
                <Link 
                  href="/dashboard/admin/tryouts"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="w-4 h-4" />
                  Tryouts
                </Link>
              </div>
            )}

            {/* Manager Links in Mobile */}
            {role === 'manager' && (
              <div className="space-y-2 pb-3 border-b border-gray-800">
                <Link 
                  href="/dashboard/manager"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  Overview
                </Link>
                <Link 
                  href="/dashboard/manager/players"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4" />
                  Player Management
                </Link>
                <Link 
                  href="/dashboard/manager/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Team/Roster Management
                </Link>
                <Link 
                  href="/dashboard/manager/stats"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TrendingUp className="w-4 h-4" />
                  Stats Management
                </Link>
              </div>
            )}
            <div className="text-gray-300">{username}</div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
