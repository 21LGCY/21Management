'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types/database'
import { ArrowLeft, Edit, Trash2, User as UserIcon, Shield, Crown, Users, Mail, Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

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
    if (!confirm(`Are you sure you want to delete ${user?.username}? This action cannot be undone.`)) return

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
      alert('Failed to delete user')
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
        <p className="text-gray-400 mb-4">User not found</p>
        <Link href="/dashboard/admin/users" className="text-primary hover:underline">
          Back to Users
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
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.in_game_name || user.username}
            </h1>
            <p className="text-gray-400">
              {user.username} • {teamName || 'No Team'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/admin/users/${userId}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </Link>
            <button
              onClick={deleteUser}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Overview</h2>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Username</p>
                    <p className="text-white font-medium">{user.username}</p>
                  </div>
                  {user.in_game_name && (
                    <div>
                      <p className="text-gray-400 text-sm">In-Game Name</p>
                      <p className="text-white font-medium">{user.in_game_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Type */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Account Type</p>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-medium ${
                user.role === 'admin' 
                  ? 'bg-red-500/20 text-red-400' 
                  : user.role === 'manager' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-green-500/20 text-green-400'
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Position</p>
                    <p className="text-white font-medium">{user.position || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <div className="flex gap-2">
                      {user.is_igl && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg font-medium">
                          IGL
                        </span>
                      )}
                      {user.is_substitute && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium">
                          SUB
                        </span>
                      )}
                      {!user.is_igl && !user.is_substitute && (
                        <span className="text-white font-medium">Regular Player</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rank and Nationality */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Rank</p>
                    <div className="flex items-center gap-2">
                      {getRankImage(user.rank) && (
                        <Image
                          src={getRankImage(user.rank)!}
                          alt={user.rank || ''}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      )}
                      <p className="text-white font-medium">{user.rank || 'Unranked'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Nationality</p>
                    <p className="text-white font-medium">{user.nationality || 'Not set'}</p>
                  </div>
                </div>

                {/* Agent Pool */}
                {user.champion_pool && user.champion_pool.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Agent Pool</p>
                    <div className="flex flex-wrap gap-2">
                      {user.champion_pool.map((agent: string) => (
                        <span key={agent} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-lg">
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
                  <div>
                    <p className="text-gray-400 text-sm">Staff Role</p>
                    <p className="text-white font-medium">{user.staff_role}</p>
                  </div>
                )}
                {user.nationality && (
                  <div>
                    <p className="text-gray-400 text-sm">Nationality</p>
                    <p className="text-white font-medium">{user.nationality}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* External Links */}
          {(user.valorant_tracker_url || user.twitter_url) && (
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">External Links</h2>
              <div className="space-y-3">
                {user.valorant_tracker_url && (
                  <a
                    href={user.valorant_tracker_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary-light transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Valorant Tracker
                  </a>
                )}
                {user.twitter_url && (
                  <a
                    href={user.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary-light transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Team</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">{teamName || 'No Team'}</p>
                <p className="text-gray-400 text-sm">
                  {user.role === 'player' ? 'Player' : user.role === 'manager' ? 'Staff' : 'Administrator'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Created</p>
                <p className="text-white font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400">User ID</p>
                <p className="text-white font-mono text-xs truncate">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
