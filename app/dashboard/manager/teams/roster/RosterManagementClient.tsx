'use client'

import { useState, useMemo } from 'react'
import { Users, Search, Filter, Crown, Shield, UserMinus, Edit, Eye } from 'lucide-react'
import Link from 'next/link'

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

interface Player {
  id: string
  username: string
  in_game_name?: string
  position?: string
  is_igl?: boolean
  is_substitute?: boolean
  nationality?: string
  rank?: string
  champion_pool?: string[]
  avatar_url?: string
  created_at: string
}

interface Team {
  id: string
  name: string
  tag?: string
  game: string
  created_at: string
}

interface RosterManagementProps {
  players: Player[]
  team: Team | null
  user: any
}

export default function RosterManagementClient({ players, team, user }: RosterManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'main' | 'substitute'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'rank' | 'joined'>('name')

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const matchesSearch = !searchTerm || 
        player.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'main' && !player.is_substitute) ||
        (filterType === 'substitute' && player.is_substitute)

      return matchesSearch && matchesFilter
    })

    // Sort players
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.in_game_name || a.username).localeCompare(b.in_game_name || b.username)
        case 'role':
          return (a.position || '').localeCompare(b.position || '')
        case 'rank':
          return (a.rank || '').localeCompare(b.rank || '')
        case 'joined':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })
  }, [players, searchTerm, filterType, sortBy])

  const mainRoster = players.filter(p => !p.is_substitute)
  const substitutes = players.filter(p => p.is_substitute)

  return (
    <div className="space-y-6">
      {/* Roster Controls */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'main' | 'substitute')}
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
          >
            <option value="all">All Players ({players.length})</option>
            <option value="main">Main Players ({mainRoster.length})</option>
            <option value="substitute">Substitutes ({substitutes.length})</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'role' | 'rank' | 'joined')}
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
            <option value="rank">Sort by Rank</option>
            <option value="joined">Sort by Join Date</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {filteredAndSortedPlayers.length} of {players.length} players
          </p>
        </div>
      </div>

      {/* Roster Display */}
      <div className="bg-dark-card border border-gray-800 rounded-lg">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Team Roster</h2>
        </div>

        {filteredAndSortedPlayers.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {filteredAndSortedPlayers.map((player, index) => (
              <div key={player.id} className="p-6 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Player Number */}
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>

                    {/* Player Avatar */}
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white text-lg">
                          {player.in_game_name || player.username}
                        </h3>
                        
                        {/* Status Badges */}
                        <div className="flex gap-2">
                          {player.position && (
                            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                              {player.position}
                            </span>
                          )}
                          {player.is_igl && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg font-medium flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              IGL
                            </span>
                          )}
                          {player.is_substitute && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium">
                              SUB
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>@{player.username}</span>
                        
                        {/* Rank */}
                        {player.rank && (
                          <div className="flex items-center gap-1">
                            {getRankImage(player.rank) && (
                              <img 
                                src={getRankImage(player.rank)!} 
                                alt={player.rank}
                                className="w-4 h-4"
                              />
                            )}
                            <span>{player.rank}</span>
                          </div>
                        )}

                        {/* Nationality */}
                        {player.nationality && (
                          <div className="flex items-center gap-1">
                            <img 
                              src={`https://flagcdn.com/${player.nationality.toLowerCase()}.svg`} 
                              alt={player.nationality}
                              className="w-4 h-3"
                            />
                            <span>{player.nationality}</span>
                          </div>
                        )}

                        {/* Join Date */}
                        <span>Joined {new Date(player.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Agent Pool */}
                      {player.champion_pool && player.champion_pool.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {player.champion_pool.slice(0, 4).map((agent: string) => (
                              <span key={agent} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                {agent}
                              </span>
                            ))}
                            {player.champion_pool.length > 4 && (
                              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                +{player.champion_pool.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/dashboard/manager/players/${player.id}`}>
                      <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href={`/dashboard/manager/players/${player.id}/edit`}>
                      <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                    <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {players.length === 0 ? 'No players in your team' : 'No players match your search'}
            </p>
            <p className="text-gray-500 mb-4">
              {players.length === 0 
                ? `Your roster for ${team?.name || 'your team'} is currently empty`
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        )}
      </div>

      {/* Roster Summary */}
      {players.length > 0 && (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Roster Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{mainRoster.length}</p>
              <p className="text-sm text-gray-400">Main Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{substitutes.length}</p>
              <p className="text-sm text-gray-400">Substitutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {players.filter(p => p.is_igl).length}
              </p>
              <p className="text-sm text-gray-400">IGLs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {new Set(players.map(p => p.position).filter(Boolean)).size}
              </p>
              <p className="text-sm text-gray-400">Roles Covered</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}