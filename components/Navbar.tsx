'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth/client'
import { LogOut, Menu, X, Users, Shield, Search, Home, TrendingUp, Settings, User, Lock, Image as ImageIcon, ChevronDown, BarChart3, Calendar } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { UserRole } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { optimizeAvatar } from '@/lib/cloudinary/optimize'

interface NavbarProps {
  role: UserRole
  username: string
  userId?: string
  avatarUrl?: string | null
}

export default function Navbar({ role, username, userId, avatarUrl: initialAvatarUrl }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Only fetch avatar if not provided and we have a userId - avoid unnecessary API calls
  useEffect(() => {
    if (initialAvatarUrl || !userId) return
    
    let cancelled = false
    const fetchAvatar = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single()
      
      if (!cancelled && data?.avatar_url) {
        setAvatarUrl(data.avatar_url)
      }
    }
    fetchAvatar()
    
    return () => { cancelled = true }
  }, [userId, initialAvatarUrl])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-dark-card/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link href={`/dashboard/${role}`}>
              <div className="flex items-center cursor-pointer group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-dark rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                  <Image 
                    src="/images/21.svg" 
                    alt="21 Legacy" 
                    width={44} 
                    height={44}
                    className="w-11 h-11 relative"
                  />
                </div>
              </div>
            </Link>
            
            {/* Admin Navigation Links */}
            {role === 'admin' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard/admin/users"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Users
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/admin/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Teams
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/admin/statistics"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <TrendingUp className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Statistics
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/admin/tryouts"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Tryouts
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </div>
            )}

            {/* Manager Navigation Links */}
            {role === 'manager' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard/manager/players"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Players
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/manager/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Team Hub
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/manager/stats"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <TrendingUp className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Statistics
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </div>
            )}

            {/* Player Navigation Links */}
            {role === 'player' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/dashboard/player/stats"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <BarChart3 className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Stats
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/player/teams"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Team
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
                <Link 
                  href="/dashboard/player/availability"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-200 group relative"
                >
                  <Calendar className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="relative">
                    Availability
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30">
                      <Image 
                        src={optimizeAvatar(avatarUrl)} 
                        alt={username} 
                        width={32} 
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center border-2 border-primary/30">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 font-medium group-hover:text-white transition">{username}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary text-xs font-semibold capitalize border border-primary/30 shadow-lg shadow-primary/10">
                  {role}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-dark-card border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30">
                          <Image 
                            src={optimizeAvatar(avatarUrl)} 
                            alt={username} 
                            width={32} 
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center border-2 border-primary/30">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{username}</p>
                        <p className="text-xs text-gray-400 capitalize">{role} Account</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link 
                      href="/profile/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all group"
                    >
                      <Settings className="w-4 h-4 group-hover:text-primary transition-colors" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium">Account Settings</p>
                        <p className="text-xs text-gray-500">Manage your account</p>
                      </div>
                    </Link>
                  </div>

                  <div className="p-2 border-t border-gray-800">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all group"
                    >
                      <LogOut className="w-4 h-4" />
                      <p className="text-sm font-medium">Logout</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-dark-card/95 backdrop-blur-sm">
          <div className="px-4 py-4 space-y-3">
            {/* Admin Links in Mobile */}
            {role === 'admin' && (
              <div className="space-y-2 pb-4 border-b border-gray-800">
                <Link 
                  href="/dashboard/admin/users"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Users
                </Link>
                <Link 
                  href="/dashboard/admin/teams"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Teams
                </Link>
                <Link 
                  href="/dashboard/admin/tryouts"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Tryouts
                </Link>
              </div>
            )}

            {/* Manager Links in Mobile */}
            {role === 'manager' && (
              <div className="space-y-2 pb-4 border-b border-gray-800">
                <Link 
                  href="/dashboard/manager/players"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Players
                </Link>
                <Link 
                  href="/dashboard/manager/teams"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Team Hub
                </Link>
                <Link 
                  href="/dashboard/manager/stats"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TrendingUp className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Statistics
                </Link>
              </div>
            )}

            {/* Player Links in Mobile */}
            {role === 'player' && (
              <div className="space-y-2 pb-4 border-b border-gray-800">
                <Link 
                  href="/dashboard/player/stats"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart3 className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Stats
                </Link>
                <Link 
                  href="/dashboard/player/teams"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
                  Team
                </Link>
              </div>
            )}

            {/* Profile Section */}
            <div className="space-y-2 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3 px-3 py-3 bg-gray-800/50 rounded-lg border border-gray-700">
                {avatarUrl ? (
                  <Image
                    src={optimizeAvatar(avatarUrl)}
                    alt={username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{username}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{role}</span>
                </div>
              </div>
              
              <Link 
                href="/profile/settings"
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-all py-2.5 px-3 rounded-lg hover:bg-gray-800 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-4 h-4 group-hover:text-primary transition-colors" />
                Account Settings
              </Link>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-800/30 hover:to-red-700/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-800/50 hover:border-red-700/50"
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
