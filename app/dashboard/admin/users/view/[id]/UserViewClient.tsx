'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types/database'
import { ArrowLeft, Edit, Trash2, User as UserIcon, Shield, Crown, Users, Mail, Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getNationalityDisplay } from '@/lib/utils/nationality'
import { useTranslations } from 'next-intl'

interface UserViewClientProps {
  userId: string
}

// Utility function to get rank image
const getRankImage = (rank: string | undefined | null): string | null => {
  if (!rank) return null
  
  const rankMap: { [key: string]: string } = {
    'Ascendant 1': '/images/asc_1_rank.webp',
    'Ascendant 2': '/images/asc_2_rank.webp',
    'Ascendant 3': '/images/asc_3_rank.webp',
    'Immortal 1': '/images/immo_1_rank.webp',
    'Immortal 2': '/images/immo_2_rank.webp',
    'Immortal 3': '/images/immo_3_rank.webp',
    'Radiant': '/images/rad_rank.webp'
  }
  
  return rankMap[rank] || null
}

export default function UserViewClient({ userId }: UserViewClientProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('users')
  const tCommon = useTranslations('common')

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teams(name)')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async () => {
    if (!confirm(t('confirmDeleteUser', { username: user?.username || '' }))) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      
      router.push('/dashboard/admin/users')
      router.refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(t('failedDeleteUser'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{t('userNotFound')}</p>
        <Link href="/dashboard/admin/users" className="text-primary hover:underline">
          {t('backToUsers')}
        </Link>
      </div>
    )
  }

  const teamName = (user as any).teams?.name

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/dashboard/admin/users"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{t('backToUsers')}</span>
          </Link>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              {user.in_game_name || user.username}
            </h1>
            <p className="text-gray-400">
              {user.username} • {teamName || t('noTeam')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/admin/users/${userId}`}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20">
                <Edit className="w-4 h-4" />
                <span>{tCommon('edit')}</span>
              </button>
            </Link>
            <button
              onClick={deleteUser}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-800/30 hover:to-red-700/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-800/50 hover:border-red-700/50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              Profile Overview
            </h2>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-primary/30 shadow-lg">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Username</p>
                    <p className="text-white font-semibold text-lg">{user.username}</p>
                  </div>
                  {user.in_game_name && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">In-Game Name</p>
                      <p className="text-white font-semibold text-lg">{user.in_game_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Type */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3">Account Type</p>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border ${
                user.role === 'admin' 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                  : user.role === 'manager' 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                  : 'bg-green-500/20 text-green-400 border-green-500/50'
              }`}>
                {user.role === 'admin' && <Shield className="w-4 h-4" />}
                {user.role === 'manager' && <Crown className="w-4 h-4" />}
                {user.role === 'player' && <Users className="w-4 h-4" />}
                {user.role.toUpperCase()}
              </span>
            </div>

            {/* Player-specific details */}
            {user.role === 'player' && (
              <>
                {/* Role and Status */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-2">Position</p>
                    <p className="text-white font-semibold">{user.position || 'Not set'}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {user.is_igl && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg font-semibold border border-yellow-500/30">
                          IGL
                        </span>
                      )}
                      {user.is_substitute && (
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-semibold border border-orange-500/30">
                          SUB
                        </span>
                      )}
                      {!user.is_igl && !user.is_substitute && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg font-semibold border border-green-500/30">
                          PLAYER
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rank and Nationality */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-2">Rank</p>
                    <div className="flex items-center gap-3">
                      {getRankImage(user.rank) && (
                        <Image
                          src={getRankImage(user.rank)!}
                          alt={user.rank || ''}
                          width={28}
                          height={28}
                          className="object-contain"
                        />
                      )}
                      <p className="text-white font-semibold">{user.rank || 'Unranked'}</p>
                    </div>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-2">Nationality</p>
                    {(() => {
                      const nationality = getNationalityDisplay(user.nationality)
                      return nationality ? (
                        <div className="flex items-center gap-3">
                          <Image
                            src={nationality.flagUrl}
                            alt={nationality.code}
                            width={28}
                            height={21}
                            className="object-contain rounded-sm"
                          />
                          <p className="text-white font-semibold">{nationality.name}</p>
                        </div>
                      ) : (
                        <p className="text-white font-semibold">Not set</p>
                      )
                    })()}
                  </div>
                </div>

                {/* Agent Pool */}
                {user.champion_pool && user.champion_pool.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-3">Agent Pool</p>
                    <div className="flex flex-wrap gap-2">
                      {user.champion_pool.map((agent: string) => (
                        <span key={agent} className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary text-sm rounded-lg font-medium border border-primary/30">
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Manager-specific details */}
            {user.role === 'manager' && (
              <div className="grid grid-cols-2 gap-4">
                {user.staff_role && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-2">Staff Role</p>
                    <p className="text-white font-semibold">{user.staff_role}</p>
                  </div>
                )}
                {user.nationality && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-2">Nationality</p>
                    {(() => {
                      const nationality = getNationalityDisplay(user.nationality)
                      return nationality ? (
                        <div className="flex items-center gap-3">
                          <Image
                            src={nationality.flagUrl}
                            alt={nationality.code}
                            width={28}
                            height={21}
                            className="object-contain rounded-sm"
                          />
                          <p className="text-white font-semibold">{nationality.name}</p>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* External Links */}
          {(user.valorant_tracker_url || user.twitter_url) && (
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                External Links
              </h2>
              <div className="space-y-3">
                {user.valorant_tracker_url && (
                  <a
                    href={user.valorant_tracker_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-primary/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Valorant Tracker</span>
                  </a>
                )}
                {user.twitter_url && (
                  <a
                    href={user.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-primary/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              Team
            </h3>
            <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-lg flex items-center justify-center border border-primary/30">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold">{teamName || 'No Team'}</p>
                <p className="text-gray-400 text-sm">
                  {user.role === 'player' ? 'Player' : user.role === 'manager' ? 'Staff' : 'Administrator'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              Account Info
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-1">Created</p>
                <p className="text-white font-semibold">
                  {new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-1">User ID</p>
                <p className="text-white font-mono text-xs break-all">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
