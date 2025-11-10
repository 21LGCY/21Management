'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole, TeamCategory } from '@/lib/types/database'
import { Plus, Edit, Trash2, Search, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface ScoutingDatabaseManagerProps {
  teamId: string | null
  team: any | null
}

export default function ScoutingDatabaseManager({ teamId, team }: ScoutingDatabaseManagerProps) {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>('all')
  
  const supabase = createClient()
  const router = useRouter()

  // Get team category from team data with more precise mapping
  const teamCategory = team?.name ? (
    team.name.toLowerCase().includes('legacy gc') || team.name.toLowerCase().includes('21gc') ? '21GC' :
    team.name.toLowerCase().includes('academy') || team.name.toLowerCase().includes('21aca') ? '21ACA' :
    team.name.toLowerCase().includes('21 legacy') || team.name.toLowerCase().includes('21l') || 
    (team.name.toLowerCase().includes('legacy') && !team.name.toLowerCase().includes('gc') && !team.name.toLowerCase().includes('academy')) ? '21L' :
    null
  ) : null

  // Temporary debug to see actual team names
  if (team?.name) {
    console.log('🔍 Team mapping debug:', {
      originalName: team.name,
      lowercased: team.name.toLowerCase(),
      mappedTo: teamCategory,
      checks: {
        hasLegacyGC: team.name.toLowerCase().includes('legacy gc'),
        has21GC: team.name.toLowerCase().includes('21gc'),
        hasAcademy: team.name.toLowerCase().includes('academy'),
        has21ACA: team.name.toLowerCase().includes('21aca'),
        has21Legacy: team.name.toLowerCase().includes('21 legacy'),
        hasLegacyOnly: team.name.toLowerCase().includes('legacy') && !team.name.toLowerCase().includes('gc') && !team.name.toLowerCase().includes('academy')
      }
    })
  }

  useEffect(() => {
    fetchTryouts()
  }, [teamCategory])

  const fetchTryouts = async () => {
    try {
      let query = supabase
        .from('profiles_tryouts')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by team category if available, otherwise show no results
      if (teamCategory) {
        query = query.eq('team_category', teamCategory)
      } else {
        // If no team category, return empty array to prevent showing all tryouts
        setTryouts([])
        setLoading(false)
        return
      }

      const { data, error } = await query

      if (error) throw error

      // Additional filtering to exclude players who already exist in profiles table (already on a team)
      const { data: existingPlayers } = await supabase
        .from('profiles')
        .select('username')
        .eq('role', 'player')

      const existingUsernames = new Set(existingPlayers?.map(p => p.username) || [])
      
      // Filter out tryouts for players who are already on any team
      const filteredData = (data || []).filter(tryout => 
        !existingUsernames.has(tryout.username) || tryout.status === 'player'
      )

      setTryouts(filteredData)
    } catch (error) {
      console.error('Error fetching tryouts:', error)
      setTryouts([])
    } finally {
      setLoading(false)
    }
  }

  const deleteTryout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTryouts(tryouts.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting tryout:', error)
    }
  }

  const promoteToPlayer = async (tryout: ProfileTryout) => {
    if (!teamId) {
      alert('Team information not available')
      return
    }

    if (!confirm(`Are you sure you want to promote ${tryout.in_game_name || tryout.username} to player status?`)) return

    try {
      // First create a user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          username: tryout.username,
          role: 'player',
          full_name: tryout.full_name,
          in_game_name: tryout.in_game_name,
          position: tryout.position,
          is_igl: tryout.is_igl,
          nationality: tryout.nationality,
          champion_pool: tryout.champion_pool,
          rank: tryout.rank,
          valorant_tracker_url: tryout.valorant_tracker_url,
          twitter_url: tryout.twitter_url,
          team_id: teamId
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Update the tryout status
      const { error: tryoutError } = await supabase
        .from('profiles_tryouts')
        .update({ status: 'player' })
        .eq('id', tryout.id)

      if (tryoutError) throw tryoutError

      // Refresh the tryouts list
      fetchTryouts()
      alert('Player successfully added to team!')

    } catch (error) {
      console.error('Error promoting player:', error)
      alert('Failed to promote player. Please try again.')
    }
  }

  const handleCardClick = (tryoutId: string) => {
    // Navigate to the detailed view
    router.push(`/dashboard/manager/teams/tryouts/scouts/view/${tryoutId}`)
  }

  const filteredTryouts = tryouts.filter(tryout => {
    const matchesSearch = 
      tryout.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tryout.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tryout.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || tryout.status === statusFilter
    const matchesRole = roleFilter === 'all' || tryout.position === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

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

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Scout button */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, username, or IGN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TryoutStatus | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
          >
            <option value="all">All Statuses</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="in_tryouts">In Tryouts</option>
            <option value="accepted">Accepted</option>
            <option value="substitute">Substitute</option>
            <option value="rejected">Rejected</option>
            <option value="left">Left</option>
            <option value="player">Player</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as ValorantRole | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
          >
            <option value="all">All Roles</option>
            <option value="Duelist">Duelist</option>
            <option value="Initiator">Initiator</option>
            <option value="Controller">Controller</option>
            <option value="Sentinel">Sentinel</option>
            <option value="Flex">Flex</option>
          </select>

          <Link
            href="/dashboard/manager/teams/tryouts/scouts/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Scout
          </Link>
        </div>
      </div>

      {/* Team Info */}
      {team && (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <p className="text-white">
            Scouting for: <span className="font-semibold text-primary">{team.name}</span>
            {teamCategory && (
              <span className="ml-2 px-2 py-1 bg-primary/20 text-primary text-sm rounded">
                {teamCategory}
              </span>
            )}
            {!teamCategory && (
              <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-300 text-sm rounded">
                Team mapping error - Contact admin
              </span>
            )}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            💡 Click on any player card to view detailed information and manage their status
          </p>
        </div>
      )}

      {/* Show warning if no team category detected */}
      {!teamCategory && team && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300">
            ⚠️ Unable to determine team category for "{team.name}". Please contact an administrator.
          </p>
          <p className="text-yellow-400 text-sm mt-1">
            Expected team names: "21L", "21Legacy", "21GC", or "21ACA"
          </p>
        </div>
      )}

      {/* Player Cards Grid */}
      {filteredTryouts.length === 0 ? (
        <div className="text-center py-12 bg-dark-card border border-gray-800 rounded-lg">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No scouting profiles found for {teamCategory || 'your team'}</p>
          <p className="text-gray-500 text-sm">Click "Add Scout" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTryouts.map((tryout) => {
            const rankImage = getRankImage(tryout.rank)
            
            return (
              <div 
                key={tryout.id} 
                className="bg-dark-card border border-gray-800 rounded-lg hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 relative group cursor-pointer transform hover:scale-[1.02]"
                onClick={() => handleCardClick(tryout.id)}
              >
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Header: Name/IGN (left) + Rank & Status (right) */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Name & IGN */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-lg font-bold text-white truncate">
                            {tryout.in_game_name || tryout.username}
                          </h3>
                          {tryout.nationality && (
                            <Image
                              src={`https://flagcdn.com/${tryout.nationality.toLowerCase()}.svg`}
                              alt={tryout.nationality}
                              width={20}
                              height={15}
                              className="object-contain flex-shrink-0"
                            />
                          )}
                        </div>
                        {tryout.in_game_name && (
                          <p className="text-sm text-gray-400">@{tryout.username}</p>
                        )}
                      </div>

                      {/* Right: Rank & Status */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        {/* Rank Image */}
                        {tryout.rank && rankImage && (
                          <div className="relative group/rank">
                            <Image
                              src={rankImage}
                              alt={tryout.rank}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/rank:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {tryout.rank}
                            </div>
                          </div>
                        )}
                        {/* Status Badge */}
                        <span className={`px-2 py-1 text-xs border rounded whitespace-nowrap ${getStatusColor(tryout.status)}`}>
                          {getStatusLabel(tryout.status)}
                        </span>
                      </div>
                    </div>

                    {/* Role Badges */}
                    <div className="flex flex-wrap gap-1">
                      {tryout.position && (
                        <span className={`px-2 py-0.5 text-xs border rounded ${getRoleColor(tryout.position)}`}>
                          {tryout.position}
                        </span>
                      )}
                      {tryout.is_igl && (
                        <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          IGL
                        </span>
                      )}
                    </div>

                    {/* Agent Pool */}
                    {tryout.champion_pool && tryout.champion_pool.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Main Agents</p>
                        <p className="text-xs text-gray-300">
                          {tryout.champion_pool.slice(0, 2).join(', ')}
                          {tryout.champion_pool.length > 2 && ` +${tryout.champion_pool.length - 2}`}
                        </p>
                      </div>
                    )}

                    {/* Notes/Description */}
                    {tryout.notes && (
                      <div className="pt-2 border-t border-gray-800">
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {tryout.notes}
                        </p>
                      </div>
                    )}

                    {/* Click hint for accepted players */}
                    {tryout.status === 'accepted' && (
                      <div className="pt-2 border-t border-gray-800">
                        <p className="text-xs text-green-400 font-medium">
                          ✓ Ready to add to team - Click to view details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}