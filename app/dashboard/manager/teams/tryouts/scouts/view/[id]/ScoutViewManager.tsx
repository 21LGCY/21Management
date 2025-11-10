'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import { Edit3, Trash2, UserPlus, Calendar, ExternalLink, Flag, Trophy, Target } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ScoutViewManagerProps {
  scout: ProfileTryout
  teamId: string | null
  team: any | null
  managerId: string
}

export default function ScoutViewManager({ scout, teamId, team, managerId }: ScoutViewManagerProps) {
  const [currentScout, setCurrentScout] = useState(scout)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateTryoutStatus = async (newStatus: TryoutStatus) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .update({ 
          status: newStatus,
          contacted_by: newStatus !== 'not_contacted' ? scout.contacted_by || 'Manager' : null,
          last_contact_date: newStatus !== 'not_contacted' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', scout.id)

      if (error) throw error

      setCurrentScout({ ...currentScout, status: newStatus })
      
      if (newStatus === 'accepted') {
        alert('Player status updated to "Accepted". You can now promote them to your team from the main tryouts page.')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const promoteToPlayer = async () => {
    if (!teamId) {
      alert('Team information not available')
      return
    }

    if (!confirm(`Are you sure you want to promote ${scout.in_game_name || scout.username} to player status and add them to your team?`)) return

    setLoading(true)
    try {
      // Create a user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          username: scout.username,
          role: 'player',
          full_name: scout.full_name,
          in_game_name: scout.in_game_name,
          position: scout.position,
          is_igl: scout.is_igl,
          nationality: scout.nationality,
          champion_pool: scout.champion_pool,
          rank: scout.rank,
          valorant_tracker_url: scout.valorant_tracker_url,
          twitter_url: scout.twitter_url,
          team_id: teamId
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Update the tryout status
      const { error: tryoutError } = await supabase
        .from('profiles_tryouts')
        .update({ status: 'player' })
        .eq('id', scout.id)

      if (tryoutError) throw tryoutError

      setCurrentScout({ ...currentScout, status: 'player' })
      alert('Player successfully added to team!')
      router.push('/dashboard/manager/teams/roster')

    } catch (error) {
      console.error('Error promoting player:', error)
      alert('Failed to promote player. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteTryout = async () => {
    if (!confirm('Are you sure you want to delete this scout profile? This action cannot be undone.')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .delete()
        .eq('id', scout.id)

      if (error) throw error

      alert('Scout profile deleted successfully')
      router.push('/dashboard/manager/teams/tryouts')
    } catch (error) {
      console.error('Error deleting scout:', error)
      alert('Failed to delete scout profile')
    } finally {
      setLoading(false)
    }
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

  const getRankImage = (rank: string | null | undefined): string | null => {
    if (!rank) return null
    const rankMap: Record<string, string> = {
      'Ascendant 1': '/images/asc_1_rank.webp',
      'Ascendant 2': '/images/asc_2_rank.webp',
      'Ascendant 3': '/images/asc_3_rank.webp',
      'Immortal 1': '/images/immo_1_rank.webp',
      'Immortal 2': '/images/immo_2_rank.webp',
      'Immortal 3': '/images/immo_3_rank.webp',
      'Radiant': '/images/rad_rank.webp',
    }
    return rankMap[rank] || null
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

  const rankImage = getRankImage(currentScout.rank)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            {/* Left: Player Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {currentScout.in_game_name || currentScout.username}
                </h1>
                {currentScout.nationality && (
                  <Image
                    src={`https://flagcdn.com/${currentScout.nationality.toLowerCase()}.svg`}
                    alt={currentScout.nationality}
                    width={24}
                    height={18}
                    className="object-contain"
                  />
                )}
              </div>
              {currentScout.in_game_name && (
                <p className="text-gray-400 mb-2">@{currentScout.username}</p>
              )}
              {currentScout.full_name && (
                <p className="text-gray-300 mb-4">{currentScout.full_name}</p>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm border rounded ${getStatusColor(currentScout.status)}`}>
                  {getStatusLabel(currentScout.status)}
                </span>
                <span className="px-3 py-1 text-sm border rounded bg-primary/20 text-primary border-primary/30">
                  {currentScout.team_category}
                </span>
                {currentScout.position && (
                  <span className={`px-3 py-1 text-sm border rounded ${getRoleColor(currentScout.position)}`}>
                    {currentScout.position}
                  </span>
                )}
                {currentScout.is_igl && (
                  <span className="px-3 py-1 text-sm rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    IGL
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Rank Display */}
          {currentScout.rank && rankImage && (
            <div className="text-center">
              <Image
                src={rankImage}
                alt={currentScout.rank}
                width={80}
                height={80}
                className="object-contain mx-auto"
              />
              <p className="text-sm text-gray-400 mt-2">{currentScout.rank}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {currentScout.status === 'accepted' && (
          <button
            onClick={promoteToPlayer}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            Add to Team
          </button>
        )}

        <select
          value={currentScout.status}
          onChange={(e) => updateTryoutStatus(e.target.value as TryoutStatus)}
          disabled={loading}
          className="px-4 py-2 bg-dark-card border border-gray-800 text-white rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
        >
          <option value="not_contacted">Not Contacted</option>
          <option value="contacted">Contacted</option>
          <option value="in_tryouts">In Tryouts</option>
          <option value="accepted">Accepted</option>
          <option value="substitute">Substitute</option>
          <option value="rejected">Rejected</option>
          <option value="left">Left</option>
          <option value="player">Player</option>
        </select>

        <button
          onClick={deleteTryout}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete Profile
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Information */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Game Information
          </h2>
          
          <div className="space-y-4">
            {currentScout.position && (
              <div>
                <p className="text-gray-400 text-sm">Position</p>
                <p className="text-white font-medium">{currentScout.position}</p>
              </div>
            )}
            
            {currentScout.rank && (
              <div>
                <p className="text-gray-400 text-sm">Rank</p>
                <p className="text-white font-medium">{currentScout.rank}</p>
              </div>
            )}
            
            {currentScout.champion_pool && currentScout.champion_pool.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm">Agent Pool</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentScout.champion_pool.map((agent) => (
                    <span
                      key={agent}
                      className="px-2 py-1 bg-gray-800 text-gray-300 text-sm rounded"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Links & Contact */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Links & Contact
          </h2>
          
          <div className="space-y-4">
            {currentScout.valorant_tracker_url && (
              <div>
                <p className="text-gray-400 text-sm">Tracker Profile</p>
                <Link
                  href={currentScout.valorant_tracker_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light underline break-all"
                >
                  View on Tracker.gg
                </Link>
              </div>
            )}
            
            {currentScout.twitter_url && (
              <div>
                <p className="text-gray-400 text-sm">Twitter</p>
                <Link
                  href={currentScout.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light underline break-all"
                >
                  View Profile
                </Link>
              </div>
            )}
            
            {currentScout.links && (
              <div>
                <p className="text-gray-400 text-sm">Other Links</p>
                <p className="text-white break-all">{currentScout.links}</p>
              </div>
            )}
          </div>
        </div>

        {/* Management Information */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Management Info
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Team Category</p>
              <p className="text-white font-medium">{currentScout.team_category}</p>
            </div>
            
            {currentScout.managed_by && (
              <div>
                <p className="text-gray-400 text-sm">Managed By</p>
                <p className="text-white font-medium">{currentScout.managed_by}</p>
              </div>
            )}
            
            {currentScout.contacted_by && (
              <div>
                <p className="text-gray-400 text-sm">Contacted By</p>
                <p className="text-white font-medium">{currentScout.contacted_by}</p>
              </div>
            )}
            
            {currentScout.last_contact_date && (
              <div>
                <p className="text-gray-400 text-sm">Last Contact</p>
                <p className="text-white font-medium">
                  {new Date(currentScout.last_contact_date).toLocaleDateString()}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white font-medium">
                {new Date(currentScout.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {currentScout.notes && (
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Notes</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{currentScout.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}