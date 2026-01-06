'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { Users, Search, Plus, Mail, Phone, MapPin, Trophy, Target, Award, Activity, Star } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'
import { GameType, getGameConfig, getFaceitLevelImage } from '@/lib/types/games'

// Utility function to get rank image for both Valorant and CS2
const getRankImage = (rank: string | undefined | null, game: GameType = 'valorant'): string | null => {
  if (!rank) return null
  
  if (game === 'valorant') {
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
  
  // CS2 ranks don't have images, we use Faceit level images
  return null
}

interface Player {
  id: string
  username: string
  in_game_name?: string
  email?: string
  phone?: string
  position?: string
  is_igl?: boolean
  is_substitute?: boolean
  nationality?: string
  rank?: string
  champion_pool?: string[]
  valorant_tracker_url?: string
  twitter_url?: string
  avatar_url?: string
  created_at: string
  // CS2-specific fields
  faceit_level?: number
  steam_url?: string
  faceit_url?: string
  tracker_url?: string
  teams?: { name: string; game?: string }
}

interface PlayersPageProps {
  players: Player[]
  user: any
  team: any
  gameType: GameType
}

export default function PlayersPageClient({ players, user, team, gameType }: PlayersPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [rankFilter, setRankFilter] = useState('')
  const t = useTranslations('players')
  const tCommon = useTranslations('common')
  const gameConfig = getGameConfig(gameType)

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
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-400">{t('manageAndTrackRoster', { teamName: team?.name || 'team' })}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-blue-300/70 mb-1">{t('totalPlayers')}</p>
            <p className="text-3xl font-bold text-blue-400">{players.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-300/70 mb-1">{t('activeRoster')}</p>
            <p className="text-3xl font-bold text-green-400">{players.filter(p => !p.is_substitute).length}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-dark border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-purple-300/70 mb-1">{t('igl')}</p>
            <p className="text-3xl font-bold text-purple-400">{players.filter(p => p.is_igl).length}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-dark border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <p className="text-sm text-orange-300/70 mb-1">{t('substitutes')}</p>
            <p className="text-3xl font-bold text-orange-400">{players.filter(p => p.is_substitute).length}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6 mb-6 hover:border-gray-700 transition-all">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('searchPlayersInTeam')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            
            <CustomSelect
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              options={[
                { value: '', label: t('allRoles') },
                ...roles.filter(role => role).map(role => ({ value: role as string, label: role as string }))
              ]}
              className="min-w-[150px]"
            />

            <CustomSelect
              value={rankFilter}
              onChange={(value) => setRankFilter(value)}
              options={[
                { value: '', label: t('allRanks') },
                ...ranks.filter(rank => rank).map(rank => ({ value: rank as string, label: rank as string }))
              ]}
              className="min-w-[150px]"
            />

            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/20 to-primary-dark/20 border border-primary/40 rounded-lg text-white font-medium">
              <Users className="w-5 h-5 text-primary" />
              <span>{team?.name || 'Your Team'}</span>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm font-medium">
            {t('showingOfPlayers', { filtered: filteredPlayers.length, total: players.length }).split(String(filteredPlayers.length))[0]}
            <span className="text-primary">{filteredPlayers.length}</span>
            {t('showingOfPlayers', { filtered: filteredPlayers.length, total: players.length }).split(String(filteredPlayers.length))[1]?.split(String(players.length))[0]}
            <span className="text-white">{players.length}</span>
            {t('showingOfPlayers', { filtered: filteredPlayers.length, total: players.length }).split(String(players.length))[1]}
          </p>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6 hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 group"
              >
                {/* Player Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-primary transition">{player.in_game_name || player.username}</h3>
                      <p className="text-sm text-gray-400">@{player.username}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/manager/players/${player.id}`}>
                    <button className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/20">
                      {tCommon('view')}
                    </button>
                  </Link>
                </div>

                {/* Player Info */}
                <div className="space-y-4">
                  {/* Role and IGL */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {player.position && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary text-xs rounded-lg font-semibold border border-primary/30">
                        {player.position}
                      </span>
                    )}
                    {player.is_igl && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 text-xs rounded-lg font-semibold border border-yellow-500/30">
                        IGL
                      </span>
                    )}
                    {player.is_substitute && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 text-xs rounded-lg font-semibold border border-orange-500/30">
                        SUB
                      </span>
                    )}
                  </div>

                  {/* Rank/Faceit Level and Nationality */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-dark/50 rounded-lg border border-gray-800">
                      <p className="text-gray-400 text-xs mb-1.5">
                        {gameType === 'cs2' ? t('faceitLevel') || 'Faceit Level' : t('rankLabel')}
                      </p>
                      <div className="flex items-center gap-2">
                        {gameType === 'cs2' ? (
                          // CS2: Show Faceit Level
                          player.faceit_level ? (
                            <>
                              <img 
                                src={getFaceitLevelImage(player.faceit_level)} 
                                alt={`Level ${player.faceit_level}`}
                                className="w-6 h-6"
                              />
                              <p className="text-white font-semibold text-sm">Level {player.faceit_level}</p>
                            </>
                          ) : (
                            <p className="text-gray-400 font-semibold text-sm">{player.rank || t('unranked')}</p>
                          )
                        ) : (
                          // Valorant: Show Rank
                          <>
                            {getRankImage(player.rank, gameType) ? (
                              <img 
                                src={getRankImage(player.rank, gameType)!} 
                                alt={player.rank}
                                className="w-6 h-6"
                              />
                            ) : null}
                            <p className="text-white font-semibold text-sm">{player.rank || t('unranked')}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-dark/50 rounded-lg border border-gray-800">
                      <p className="text-gray-400 text-xs mb-1.5">{t('nation')}</p>
                      <p className="text-white font-semibold text-sm">
                        {player.nationality ? (
                          <span className="flex items-center gap-1.5">
                            <img 
                              src={`https://flagcdn.com/${player.nationality.toLowerCase()}.svg`} 
                              alt={player.nationality}
                              className="w-5 h-4 rounded"
                            />
                            {player.nationality}
                          </span>
                        ) : t('unknown')}
                      </p>
                    </div>
                  </div>

                  {/* Agent Pool - Only for Valorant */}
                  {gameType === 'valorant' && player.champion_pool && player.champion_pool.length > 0 && (
                    <div className="p-3 bg-dark/50 rounded-lg border border-gray-800">
                      <p className="text-gray-400 text-xs mb-2 font-medium">{t('mainAgents')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {player.champion_pool.slice(0, 3).map((agent: string) => (
                          <span key={agent} className="px-2.5 py-1 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 text-xs rounded-md font-medium border border-gray-700">
                            {agent}
                          </span>
                        ))}
                        {player.champion_pool.length > 3 && (
                          <span className="px-2.5 py-1 bg-primary/20 text-primary text-xs rounded-md font-medium border border-primary/30">
                            +{player.champion_pool.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {player.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate text-gray-300">{player.email}</span>
                      </div>
                    )}
                    {player.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-300">{player.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* External Links */}
                  {(player.valorant_tracker_url || player.tracker_url || player.steam_url || player.faceit_url || player.twitter_url) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* Valorant Tracker */}
                      {gameType === 'valorant' && (player.valorant_tracker_url || player.tracker_url) && (
                        <a 
                          href={player.tracker_url || player.valorant_tracker_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg font-medium transition-all border border-red-500/30"
                        >
                          {t('tracker')}
                        </a>
                      )}
                      {/* CS2 Links */}
                      {gameType === 'cs2' && player.steam_url && (
                        <a 
                          href={player.steam_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded-lg font-medium transition-all border border-blue-500/30"
                        >
                          Steam
                        </a>
                      )}
                      {gameType === 'cs2' && player.faceit_url && (
                        <a 
                          href={player.faceit_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium transition-all border border-orange-500/30"
                        >
                          Faceit
                        </a>
                      )}
                      {player.twitter_url && (
                        <a 
                          href={player.twitter_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-lg font-medium transition-all border border-primary/30"
                        >
                          Twitter
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Join Date */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">{t('joined')}</span>
                    <span className="text-gray-300 font-medium">{new Date(player.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-300 text-xl mb-2 font-semibold">
                {players.length === 0 ? t('noPlayersInTeam') : t('noPlayersMatchSearch')}
              </p>
              <p className="text-gray-500">
                {players.length === 0 
                  ? t('rosterCurrentlyEmpty', { teamName: team?.name || 'your team' })
                  : t('tryAdjustingFilters')}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}