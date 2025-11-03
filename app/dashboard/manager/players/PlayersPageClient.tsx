'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { Users, Search, Plus, Mail, Phone, MapPin } from 'lucide-react'
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
  email?: string
  phone?: string
  position?: string
  is_igl?: boolean
  nationality?: string
  rank?: string
  champion_pool?: string[]
  valorant_tracker_url?: string
  twitter_url?: string
  avatar_url?: string
  created_at: string
  teams?: { name: string }
}

interface PlayersPageProps {
  players: Player[]
  user: any
  team: any
}

export default function PlayersPageClient({ players, user, team }: PlayersPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [rankFilter, setRankFilter] = useState('')

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = !searchTerm || 
        player.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = !roleFilter || player.position === roleFilter
      const matchesRank = !rankFilter || player.rank === rankFilter

      return matchesSearch && matchesRole && matchesRank
    })
  }, [players, searchTerm, roleFilter, rankFilter])

  const roles = [...new Set(players.map(p => p.position).filter(Boolean))]
  const ranks = [...new Set(players.map(p => p.rank).filter(Boolean))]

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Player Management
          </h1>
          <p className="text-gray-400">Manage players in {team?.name || 'your team'}</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search players in your team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
            >
              <option value="">All Ranks</option>
              {ranks.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white">
              <Users className="w-4 h-4 text-primary" />
              <span>{team?.name || 'Your Team'}</span>
            </div>
            
            <Link href="/dashboard/manager/players/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                <Plus className="w-4 h-4" />
                Add Player
              </button>
            </Link>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            Showing {filteredPlayers.length} of {players.length} players
          </p>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:border-primary/50 transition"
              >
                {/* Player Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{player.in_game_name || player.username}</h3>
                      <p className="text-sm text-gray-400">{player.username}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/manager/players/${player.id}`}>
                    <button className="text-primary hover:text-primary-light text-sm">
                      View
                    </button>
                  </Link>
                </div>

                {/* Player Info */}
                <div className="space-y-3">
                  {/* Role and IGL */}
                  <div className="flex items-center gap-2">
                    {player.position && (
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                        {player.position}
                      </span>
                    )}
                    {player.is_igl && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg font-medium">
                        IGL
                      </span>
                    )}
                  </div>

                  {/* Rank and Nationality */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Rank</p>
                      <div className="flex items-center gap-2">
                        {getRankImage(player.rank) ? (
                          <img 
                            src={getRankImage(player.rank)!} 
                            alt={player.rank}
                            className="w-6 h-6"
                          />
                        ) : null}
                        <p className="text-white font-medium">{player.rank || 'Unranked'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400">Nationality</p>
                      <p className="text-white font-medium">
                        {player.nationality ? (
                          <span className="flex items-center gap-1">
                            <img 
                              src={`https://flagcdn.com/16x12/${player.nationality.toLowerCase()}.png`} 
                              alt={player.nationality}
                              className="w-4 h-3"
                            />
                            {player.nationality}
                          </span>
                        ) : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Agent Pool */}
                  {player.champion_pool && player.champion_pool.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Main Agents</p>
                      <div className="flex flex-wrap gap-1">
                        {player.champion_pool.slice(0, 3).map((agent: string) => (
                          <span key={agent} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {agent}
                          </span>
                        ))}
                        {player.champion_pool.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            +{player.champion_pool.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1 text-sm text-gray-400">
                    {player.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{player.email}</span>
                      </div>
                    )}
                    {player.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{player.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* External Links */}
                  <div className="flex gap-2 pt-2">
                    {player.valorant_tracker_url && (
                      <a 
                        href={player.valorant_tracker_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-light text-xs underline"
                      >
                        Tracker
                      </a>
                    )}
                    {player.twitter_url && (
                      <a 
                        href={player.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-light text-xs underline"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>

                {/* Join Date */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Joined</span>
                    <span>{new Date(player.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                {players.length === 0 ? 'No players in your team' : 'No players match your search'}
              </p>
              <p className="text-gray-500 mb-4">
                {players.length === 0 
                  ? `Start by adding your first player to ${team?.name || 'your team'}`
                  : 'Try adjusting your search criteria'
                }
              </p>
              {players.length === 0 && (
                <Link href="/dashboard/manager/players/new">
                  <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                    Add First Player
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}