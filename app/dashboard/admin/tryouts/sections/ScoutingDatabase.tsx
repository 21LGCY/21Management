'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole, TeamCategory } from '@/lib/types/database'
import { Plus, Edit, Trash2, Search, ExternalLink, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ScoutingDatabase() {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>('all')
  const [teamFilter, setTeamFilter] = useState<TeamCategory | 'all'>('all')
  
  const supabase = createClient()

  useEffect(() => {
    fetchTryouts()
  }, [])

  const fetchTryouts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTryouts(data || [])
    } catch (error) {
      console.error('Error fetching tryouts:', error)
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

  const filteredTryouts = tryouts.filter(tryout => {
    const matchesSearch = 
      tryout.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tryout.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tryout.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || tryout.status === statusFilter
    const matchesRole = roleFilter === 'all' || tryout.position === roleFilter
    const matchesTeam = teamFilter === 'all' || tryout.team_category === teamFilter
    
    return matchesSearch && matchesStatus && matchesRole && matchesTeam
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
      case 'accepted': return 'Player'
      case 'substitute': return 'Substitute'
      case 'rejected': return 'Rejected'
      case 'left': return 'Left'
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
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value as TeamCategory | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
          >
            <option value="all">All Teams</option>
            <option value="21L">21L</option>
            <option value="21GC">21GC</option>
            <option value="21ACA">21 ACA</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TryoutStatus | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
          >
            <option value="all">All Statuses</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="in_tryouts">In Tryouts</option>
            <option value="accepted">Player</option>
            <option value="substitute">Substitute</option>
            <option value="rejected">Rejected</option>
            <option value="left">Left</option>
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
            href="/dashboard/admin/tryouts/scouts/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Scout
          </Link>
        </div>
      </div>

      {/* Player Cards Grid */}
      {filteredTryouts.length === 0 ? (
        <div className="text-center py-12 bg-dark-card border border-gray-800 rounded-lg">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No scouting profiles found</p>
          <p className="text-gray-500 text-sm">Click "Add Scout" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTryouts.map((tryout) => {
            const rankImage = getRankImage(tryout.rank)
            
            return (
              <div key={tryout.id} className="bg-dark-card border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition flex flex-col">
                <div className="flex flex-col items-center text-center">
                  {/* Header with Status Badge */}
                  <div className="w-full flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 text-xs border rounded ${getStatusColor(tryout.status)}`}>
                      {getStatusLabel(tryout.status)}
                    </span>
                    <button
                      onClick={() => deleteTryout(tryout.id)}
                      className="p-1 text-red-400 hover:bg-red-400/10 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Avatar Placeholder */}
                  <div className="mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Username with Nationality Flag */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {tryout.in_game_name || tryout.username}
                    </h3>
                    {tryout.nationality && (
                      <div className="relative group">
                        <Image
                          src={`https://flagcdn.com/${tryout.nationality.toLowerCase()}.svg`}
                          alt={tryout.nationality}
                          width={20}
                          height={15}
                          className="object-contain"
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {tryout.nationality}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2">{tryout.username}</p>

                  {/* Role Badges */}
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
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

                  {/* Rank Image */}
                  {tryout.rank && rankImage && (
                    <div className="relative group mb-3">
                      <Image
                        src={rankImage}
                        alt={tryout.rank}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {tryout.rank}
                      </div>
                    </div>
                  )}

                  {/* Agent Pool */}
                  {tryout.champion_pool && tryout.champion_pool.length > 0 && (
                    <div className="w-full mb-3">
                      <p className="text-xs text-gray-400 mb-1">Main Agents</p>
                      <p className="text-xs text-gray-300">
                        {tryout.champion_pool.slice(0, 2).join(', ')}
                        {tryout.champion_pool.length > 2 && ` +${tryout.champion_pool.length - 2}`}
                      </p>
                    </div>
                  )}

                  {/* Team Badge */}
                  <div className="w-full mb-3">
                    <span className="px-2 py-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded">
                      {tryout.team_category}
                    </span>
                  </div>

                  {/* Links */}
                  {(tryout.valorant_tracker_url || tryout.twitter_url || tryout.links) && (
                    <div className="flex gap-2 mt-auto pt-3 border-t border-gray-800 w-full justify-center">
                      {tryout.valorant_tracker_url && (
                        <a
                          href={tryout.valorant_tracker_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-primary transition"
                          title="Tracker"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {tryout.twitter_url && (
                        <a
                          href={tryout.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-primary transition"
                          title="Twitter"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


