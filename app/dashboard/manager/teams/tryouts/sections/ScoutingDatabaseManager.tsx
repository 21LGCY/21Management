'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole, TeamCategory } from '@/lib/types/database'
import { Plus, Edit, Trash2, Search, User as UserIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getNationalityDisplay } from '@/lib/utils/nationality'
import CustomSelect from '@/components/CustomSelect'

interface ScoutingDatabaseManagerProps {
  teamId: string | null
  team: any | null
  teamCategory: TeamCategory | null
}

export default function ScoutingDatabaseManager({ teamId, team, teamCategory }: ScoutingDatabaseManagerProps) {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>('all')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchTryouts()
  }, [teamCategory])

  const fetchTryouts = async () => {
    try {
      // Filter by team_category column directly from the database
      if (!teamCategory) {
        setTryouts([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('team_category', teamCategory)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTryouts(data || [])
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
        .update({ status: 'accepted' })
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
      case 'substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'left': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'accepted': return 'bg-primary/20 text-primary border-primary/30'
    }
  }

  const getRoleColor = (role?: ValorantRole) => {
    switch (role) {
      case 'Duelist': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Initiator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'Controller': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Sentinel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Flex': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'Staff': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
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
      case 'contacted': return 'Contacted / Pending'
      case 'in_tryouts': return 'In Tryouts'
      case 'substitute': return 'Substitute'
      case 'rejected': return 'Rejected'
      case 'left': return 'Left'
      case 'accepted': return 'Player'
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
          <CustomSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as TryoutStatus | 'all')}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'not_contacted', label: 'Not Contacted' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'in_tryouts', label: 'In Tryouts' },
              { value: 'substitute', label: 'Substitute' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'left', label: 'Left' },
              { value: 'accepted', label: 'Player' }
            ]}
            className="min-w-[160px]"
          />

          <CustomSelect
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as ValorantRole | 'all')}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'Duelist', label: 'Duelist' },
              { value: 'Initiator', label: 'Initiator' },
              { value: 'Controller', label: 'Controller' },
              { value: 'Sentinel', label: 'Sentinel' },
              { value: 'Flex', label: 'Flex' },
              { value: 'Staff', label: 'Staff' }
            ]}
            className="min-w-[140px]"
          />

          <Link
            href="/dashboard/manager/teams/tryouts/scouts/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20 whitespace-nowrap font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Scout</span>
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
                No team category assigned - Contact admin
              </span>
            )}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            💡 Click on any player card to view detailed information and manage their status
          </p>
        </div>
      )}

      {/* Show warning if no team category detected */}
      {!teamCategory && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300">
            ⚠️ No team category assigned. Unable to load scouting database.
          </p>
          <p className="text-yellow-400 text-sm mt-1">
            Please contact an administrator to assign a team category (21L, 21GC, or 21ACA) to your team.
          </p>
        </div>
      )}

      {/* Player Cards Grid */}
      {filteredTryouts.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl shadow-xl">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold mb-2">No scouting profiles found for {teamCategory || 'your team'}</p>
          <p className="text-gray-500 text-sm">Click "Add Scout" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTryouts.map((tryout) => {
            const rankImage = getRankImage(tryout.rank)
            const nationality = getNationalityDisplay(tryout.nationality)
            
            return (
              <div 
                key={tryout.id} 
                className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 relative group cursor-pointer flex flex-col"
                onClick={() => handleCardClick(tryout.id)}
              >
                <div className="flex flex-col flex-1 p-6">
                  <div className="flex-1 flex flex-col">
                    {/* Player Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar Placeholder */}
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                          <UserIcon className="w-7 h-7 text-primary" />
                        </div>
                        
                        {/* Name & IGN */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg group-hover:text-primary transition truncate mb-1">
                            {tryout.in_game_name || tryout.username}
                          </h3>
                          {tryout.in_game_name && (
                            <p className="text-sm text-gray-400">@{tryout.username}</p>
                          )}
                        </div>
                      </div>

                      {/* Team|Status Badge - Top Right */}
                      <div className="flex-shrink-0">
                        <span className={`px-3 py-1.5 text-xs border rounded-lg whitespace-nowrap font-semibold ${getStatusColor(tryout.status)}`}>
                          {teamCategory} | {getStatusLabel(tryout.status)}
                        </span>
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="space-y-4">

                      {/* Role Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {tryout.position && (
                          <span className={`px-3 py-1.5 text-xs font-semibold border rounded-lg ${getRoleColor(tryout.position)}`}>
                            {tryout.position}
                          </span>
                        )}
                        {tryout.is_igl && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 text-xs rounded-lg font-semibold border border-yellow-500/30">
                            IGL
                          </span>
                        )}
                      </div>

                      {/* Rank and Nationality Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-dark/50 rounded-lg border border-gray-800 flex items-center justify-center group/rank relative">
                          {rankImage ? (
                            <>
                              <Image
                                src={rankImage}
                                alt={tryout.rank || 'Unranked'}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/rank:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {tryout.rank}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </div>
                        <div className="p-3 bg-dark/50 rounded-lg border border-gray-800 flex items-center justify-center group/nation relative">
                          {nationality ? (
                            <>
                              <Image
                                src={nationality.flagUrl}
                                alt={nationality.code}
                                width={32}
                                height={24}
                                className="rounded object-cover"
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/nation:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {nationality.name}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Consolidated Info Section */}
                      {(tryout.notes || (tryout.champion_pool && tryout.champion_pool.length > 0) || true) && (
                        <div className="p-3 bg-dark/50 rounded-lg border border-gray-800">
                          {/* Notes */}
                          {tryout.notes && (
                            <div>
                              <p className="text-gray-400 text-xs mb-1.5 font-medium">Notes</p>
                              <p className="text-xs text-gray-300 line-clamp-2">
                                {tryout.notes}
                              </p>
                            </div>
                          )}

                          {/* Divider */}
                          {tryout.notes && (tryout.champion_pool && tryout.champion_pool.length > 0) && (
                            <div className="my-3 border-t border-gray-700/50"></div>
                          )}

                          {/* Agent Pool */}
                          {tryout.champion_pool && tryout.champion_pool.length > 0 && (
                            <div>
                              <p className="text-gray-400 text-xs mb-2 font-medium">Main Agents</p>
                              <div className="flex flex-wrap gap-1.5">
                                {tryout.champion_pool.slice(0, 3).map((agent: string) => (
                                  <span key={agent} className="px-2.5 py-1 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 text-xs rounded-md font-medium border border-gray-700">
                                    {agent}
                                  </span>
                                ))}
                                {tryout.champion_pool.length > 3 && (
                                  <span className="px-2.5 py-1 bg-primary/20 text-primary text-xs rounded-md font-medium border border-primary/30">
                                    +{tryout.champion_pool.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Divider */}
                          {(tryout.notes || (tryout.champion_pool && tryout.champion_pool.length > 0)) && (
                            <div className="my-3 border-t border-gray-700/50"></div>
                          )}

                          {/* Management Info */}
                          <div>
                            <p className="text-gray-400 text-xs mb-2 font-medium">Management Info</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Added By:</span>
                                <span className="text-xs text-gray-200 font-medium">
                                  {tryout.managed_by || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Contacted By:</span>
                                <span className="text-xs text-gray-200 font-medium">
                                  {tryout.contacted_by || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Last Contact:</span>
                                <span className="text-xs text-gray-200 font-medium">
                                  {tryout.last_contact_date 
                                    ? new Date(tryout.last_contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Not yet contacted'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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