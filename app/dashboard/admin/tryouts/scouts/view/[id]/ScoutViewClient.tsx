'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole, TeamCategory } from '@/lib/types/database'
import { ArrowLeft, Edit, Trash2, User as UserIcon, ExternalLink, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface ScoutViewClientProps {
  scoutId: string
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

const getStatusColor = (status: TryoutStatus) => {
  switch (status) {
    case 'not_contacted': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    case 'contacted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'in_tryouts': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30'
    case 'substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'left': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'player': return 'bg-primary/20 text-primary border-primary/30'
  }
}

const getStatusLabel = (status: TryoutStatus) => {
  switch (status) {
    case 'not_contacted': return 'Not Contacted'
    case 'contacted': return 'Contacted'
    case 'in_tryouts': return 'In Tryouts'
    case 'accepted': return 'Accepted'
    case 'substitute': return 'Substitute'
    case 'rejected': return 'Rejected'
    case 'left': return 'Left'
    case 'player': return 'Player'
  }
}

const getRoleColor = (role?: ValorantRole) => {
  switch (role) {
    case 'Duelist': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'Initiator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'Controller': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'Sentinel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'Flex': return 'bg-green-500/20 text-green-300 border-green-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

export default function ScoutViewClient({ scoutId }: ScoutViewClientProps) {
  const [scout, setScout] = useState<ProfileTryout | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchScout()
  }, [scoutId])

  const fetchScout = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('id', scoutId)
        .single()

      if (error) throw error
      setScout(data)
    } catch (error) {
      console.error('Error fetching scout:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteScout = async () => {
    if (!confirm(`Are you sure you want to delete ${scout?.username}? This action cannot be undone.`)) return

    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .delete()
        .eq('id', scoutId)

      if (error) throw error
      
      router.push('/dashboard/admin/tryouts')
      router.refresh()
    } catch (error) {
      console.error('Error deleting scout:', error)
      alert('Failed to delete scout')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!scout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Scout profile not found</p>
        <Link href="/dashboard/admin/tryouts" className="text-primary hover:underline">
          Back to Tryouts
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/dashboard/admin/tryouts"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {scout.in_game_name || scout.username}
            </h1>
            <p className="text-gray-400">
              {scout.username} • {scout.team_category}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/admin/tryouts/scouts/edit/${scoutId}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </Link>
            <button
              onClick={deleteScout}
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
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Username</p>
                    <p className="text-white font-medium">{scout.username}</p>
                  </div>
                  {scout.in_game_name && (
                    <div>
                      <p className="text-gray-400 text-sm">In-Game Name</p>
                      <p className="text-white font-medium">{scout.in_game_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Type */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Account Type</p>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg font-medium bg-green-500/20 text-green-400">
                <UserIcon className="w-4 h-4" />
                PLAYER
              </span>
            </div>

            {/* Position and IGL */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Position</p>
                {scout.position ? (
                  <span className={`inline-block px-2 py-1 text-xs border rounded ${getRoleColor(scout.position)}`}>
                    {scout.position}
                  </span>
                ) : (
                  <p className="text-white font-medium">Not set</p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className={`inline-block px-2 py-1 text-xs border rounded ${getStatusColor(scout.status)}`}>
                  {getStatusLabel(scout.status)}
                </span>
                {scout.is_igl && (
                  <span className="inline-block ml-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg font-medium">
                    IGL
                  </span>
                )}
              </div>
            </div>

            {/* Rank and Nationality */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Rank</p>
                <div className="flex items-center gap-2">
                  {getRankImage(scout.rank) && (
                    <Image
                      src={getRankImage(scout.rank)!}
                      alt={scout.rank || ''}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  )}
                  <p className="text-white font-medium">{scout.rank || 'Unranked'}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Nationality</p>
                <div className="flex items-center gap-2">
                  {scout.nationality && (
                    <Image
                      src={`https://flagcdn.com/${scout.nationality.toLowerCase()}.svg`}
                      alt={scout.nationality}
                      width={20}
                      height={15}
                      className="object-contain"
                    />
                  )}
                  <p className="text-white font-medium">{scout.nationality || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Agent Pool */}
            {scout.champion_pool && scout.champion_pool.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Agent Pool</p>
                <div className="flex flex-wrap gap-2">
                  {scout.champion_pool.map((agent: string) => (
                    <span key={agent} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-lg">
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Management Info */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Management</h2>
            <div className="grid grid-cols-2 gap-4">
              {scout.managed_by && (
                <div>
                  <p className="text-gray-400 text-sm">Managed By</p>
                  <p className="text-white font-medium">{scout.managed_by}</p>
                </div>
              )}
              {scout.contacted_by && (
                <div>
                  <p className="text-gray-400 text-sm">Contacted By</p>
                  <p className="text-white font-medium">{scout.contacted_by}</p>
                </div>
              )}
              {scout.last_contact_date && (
                <div>
                  <p className="text-gray-400 text-sm">Last Contact Date</p>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Calendar className="w-4 h-4" />
                    {new Date(scout.last_contact_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
            {scout.notes && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Notes</p>
                <p className="text-white text-sm bg-dark border border-gray-800 rounded-lg p-3">
                  {scout.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Team</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-medium">{scout.team_category}</p>
                <p className="text-gray-400 text-sm">Tryout Candidate</p>
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
                  {new Date(scout.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Scout ID</p>
                <p className="text-white font-mono text-xs truncate">{scout.id}</p>
              </div>
            </div>
          </div>

          {/* External Links */}
          {(scout.valorant_tracker_url || scout.twitter_url || scout.links) && (
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">External Links</h3>
              <div className="space-y-3">
                {scout.valorant_tracker_url && (
                  <a
                    href={scout.valorant_tracker_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary-light transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Valorant Tracker
                  </a>
                )}
                {scout.twitter_url && (
                  <a
                    href={scout.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary-light transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Twitter
                  </a>
                )}
                {scout.links && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Other Links</p>
                    <p className="text-white text-sm">{scout.links}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
