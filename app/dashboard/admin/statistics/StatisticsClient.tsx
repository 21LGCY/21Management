'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, UserProfile, PlayerMatchStats } from '@/lib/types/database'
import { BarChart3, User, Users as UsersIcon, Trophy, TrendingUp, ChevronUp, ChevronDown, Search, Medal } from 'lucide-react'
import Image from 'next/image'
import { getTeamColors } from '@/lib/utils/teamColors'
import { useTranslations } from 'next-intl'

interface StatisticsClientProps {
  teams: Team[]
}

interface PlayerAggregatedStats {
  player: UserProfile
  totalKills: number
  totalDeaths: number
  totalAssists: number
  totalACS: number
  matchesPlayed: number
  averageACS: number
  kda: number
  killsPerMatch: number
}

type ViewMode = 'all' | 'team'
type SortField = 'averageACS' | 'kda' | 'totalKills' | 'matchesPlayed' | 'killsPerMatch'
type SortDirection = 'asc' | 'desc'

// Stat bar component for visual representation
const StatBar = memo(function StatBar({ 
  value, 
  max, 
  color 
}: { 
  value: number
  max: number
  color: string 
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})

// Rank badge component
const RankBadge = memo(function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
        <Trophy className="w-3.5 h-3.5 text-white" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
        <Medal className="w-3.5 h-3.5 text-white" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg">
        <Medal className="w-3.5 h-3.5 text-white" />
      </div>
    )
  }
  return (
    <div className="absolute -top-1 -left-1 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400">
      {rank}
    </div>
  )
})

export default function StatisticsClient({ teams }: StatisticsClientProps) {
  const supabase = createClient()
  const t = useTranslations('stats')
  const tRoles = useTranslations('roles')
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [stats, setStats] = useState<PlayerAggregatedStats[]>([])
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('averageACS')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate max values for stat bars
  const maxValues = useMemo(() => ({
    kills: Math.max(...stats.map(s => s.totalKills), 1),
    acs: Math.max(...stats.map(s => s.averageACS), 1),
    kda: Math.max(...stats.map(s => s.kda), 1),
  }), [stats])

  // Sort and filter stats
  const displayedStats = useMemo(() => {
    let filtered = stats.filter(s => {
      if (!searchQuery) return true
      const name = s.player.in_game_name || s.player.username
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })

    return filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
    })
  }, [stats, searchQuery, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField])

  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllStats()
    } else if (viewMode === 'team' && selectedTeamId) {
      fetchTeamStats(selectedTeamId)
    }
  }, [viewMode, selectedTeamId])

  const fetchAllStats = async () => {
    setLoading(true)
    try {
      // Get all players
      const { data: allPlayers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .not('team_id', 'is', null)

      if (!allPlayers) {
        setStats([])
        return
      }

      const aggregatedStats = await Promise.all(
        allPlayers.map(player => aggregatePlayerStats(player))
      )

      setStats(aggregatedStats.filter(s => s.matchesPlayed > 0).sort((a, b) => b.averageACS - a.averageACS))
    } catch (error) {
      console.error('Error fetching all stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamStats = async (teamId: string) => {
    setLoading(true)
    try {
      const { data: teamPlayers } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', 'player')

      if (!teamPlayers) {
        setStats([])
        return
      }

      const aggregatedStats = await Promise.all(
        teamPlayers.map(player => aggregatePlayerStats(player))
      )

      setStats(aggregatedStats.filter(s => s.matchesPlayed > 0).sort((a, b) => b.averageACS - a.averageACS))
    } catch (error) {
      console.error('Error fetching team stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const aggregatePlayerStats = async (player: UserProfile): Promise<PlayerAggregatedStats> => {
    const { data: matchStats } = await supabase
      .from('player_match_stats')
      .select('*')
      .eq('player_id', player.id)

    if (!matchStats || matchStats.length === 0) {
      return {
        player,
        totalKills: 0,
        totalDeaths: 0,
        totalAssists: 0,
        totalACS: 0,
        matchesPlayed: 0,
        averageACS: 0,
        kda: 0,
        killsPerMatch: 0
      }
    }

    const totalKills = matchStats.reduce((sum, s) => sum + s.kills, 0)
    const totalDeaths = matchStats.reduce((sum, s) => sum + s.deaths, 0)
    const totalAssists = matchStats.reduce((sum, s) => sum + s.assists, 0)
    const totalACS = matchStats.reduce((sum, s) => sum + s.acs, 0)
    const matchesPlayed = matchStats.length
    const averageACS = Math.round(totalACS / matchesPlayed)
    const kda = totalDeaths > 0 ? parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : totalKills + totalAssists
    const killsPerMatch = parseFloat((totalKills / matchesPlayed).toFixed(1))

    return {
      player,
      totalKills,
      totalDeaths,
      totalAssists,
      totalACS,
      matchesPlayed,
      averageACS,
      kda,
      killsPerMatch
    }
  }

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <p className="text-sm text-gray-400 mb-3 font-medium">{t('filterStatistics')}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setViewMode('all')
              setSelectedTeamId('')
            }}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t('allPlayers')}
          </button>

          <button
            onClick={() => {
              setViewMode('team')
            }}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              viewMode === 'team'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            {t('byTeam')}
          </button>
        </div>

        {/* Team Selector */}
        {viewMode === 'team' && (
          <div className="mt-5 pt-5 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-3 font-medium">{t('selectTeam')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map(team => {
                const teamColors = getTeamColors(team.tag || team.name)
                const isSelected = selectedTeamId === team.id
                
                return (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`group relative p-4 rounded-xl text-left transition-all duration-300 ${
                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      ...teamColors.style,
                      boxShadow: isSelected 
                        ? `0 0 20px ${teamColors.hoverShadow}, 0 0 40px ${teamColors.hoverShadow}` 
                        : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.boxShadow = `0 0 15px ${teamColors.hoverShadow}`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Team Logo or Initial */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                        style={{
                          backgroundColor: teamColors.badgeStyle.backgroundColor,
                          color: teamColors.badgeStyle.color,
                        }}
                      >
                        {team.logo_url ? (
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          team.tag?.charAt(0) || team.name.charAt(0)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white block truncate">
                          {team.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {team.tag && (
                            <span 
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: teamColors.badgeStyle.backgroundColor,
                                color: teamColors.badgeStyle.color,
                              }}
                            >
                              {team.tag}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {team.game}
                          </span>
                        </div>
                      </div>
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div 
                          className="w-3 h-3 rounded-full animate-pulse"
                          style={{ backgroundColor: teamColors.badgeStyle.color }}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            {teams.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">{t('noTeamsAvailable')}</p>
            )}
          </div>
        )}
      </div>

      {/* Statistics Display */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      ) : stats.length === 0 ? (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-12 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-dark-card rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <p className="text-gray-400 text-lg font-medium">{t('noStatisticsAvailable')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('recordMatchesToSee')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search and Sort Controls */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder={t('searchPlayers')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                />
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">{t('sort')}:</span>
                {([
                  { field: 'averageACS' as SortField, label: t('acs') },
                  { field: 'kda' as SortField, label: t('kda') },
                  { field: 'totalKills' as SortField, label: t('kills') },
                  { field: 'matchesPlayed' as SortField, label: t('matches') },
                ]).map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      sortField === field
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    }`}
                  >
                    {label}
                    {sortField === field && (
                      sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid - Leaderboard Style */}
          <div className="grid gap-3">
            {displayedStats.map((stat, index) => {
              const rank = index + 1
              const isTopThree = rank <= 3
              
              return (
                <div 
                  key={stat.player.id}
                  className={`relative bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10 group ${
                    isTopThree ? 'border-primary/30' : 'border-gray-800'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Rank & Player Info */}
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="relative flex-shrink-0">
                      <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center ${
                        rank === 1 ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/20' :
                        rank === 2 ? 'ring-2 ring-gray-400' :
                        rank === 3 ? 'ring-2 ring-amber-700' :
                        'bg-gray-800'
                      }`}>
                        {stat.player.avatar_url ? (
                          <Image
                            src={stat.player.avatar_url}
                            alt={stat.player.username}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-7 h-7 text-gray-600" />
                        )}
                      </div>
                      <RankBadge rank={rank} />
                    </div>

                    {/* Player Name & Position */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {stat.player.in_game_name || stat.player.username}
                      </h3>
                      <p className="text-sm text-gray-500">{stat.player.position ? tRoles(stat.player.position.toLowerCase() as any) : tRoles('player')}</p>
                    </div>

                    {/* Stats Grid - Desktop */}
                    <div className="hidden lg:grid grid-cols-5 gap-6 flex-shrink-0">
                      {/* Matches */}
                      <div className="text-center w-20">
                        <p className="text-xs text-gray-500 uppercase mb-1">{t('matches')}</p>
                        <p className="text-xl font-bold text-white">{stat.matchesPlayed}</p>
                      </div>

                      {/* K/D/A */}
                      <div className="text-center w-24">
                        <p className="text-xs text-gray-500 uppercase mb-1">{t('kda')}</p>
                        <div className="flex items-center justify-center gap-1 text-lg font-bold">
                          <span className="text-green-400">{stat.totalKills}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-red-400">{stat.totalDeaths}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-blue-400">{stat.totalAssists}</span>
                        </div>
                      </div>

                      {/* KDA Ratio */}
                      <div className="text-center w-20">
                        <p className="text-xs text-gray-500 uppercase mb-1">{t('kdRatio')}</p>
                        <p className={`text-xl font-bold ${
                          stat.kda >= 2 ? 'text-green-400' :
                          stat.kda >= 1 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>{stat.kda}</p>
                      </div>

                      {/* Kills/Match */}
                      <div className="text-center w-20">
                        <p className="text-xs text-gray-500 uppercase mb-1">{t('killsPerMatch')}</p>
                        <p className="text-xl font-bold text-white">{stat.killsPerMatch}</p>
                      </div>

                      {/* ACS */}
                      <div className="text-center w-24">
                        <p className="text-xs text-gray-500 uppercase mb-1">{t('avgACS')}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className={`w-4 h-4 ${
                              stat.averageACS >= 250 ? 'text-green-400' :
                              stat.averageACS >= 200 ? 'text-primary' :
                              'text-gray-400'
                            }`} />
                            <span className={`text-xl font-bold ${
                              stat.averageACS >= 250 ? 'text-green-400' :
                              stat.averageACS >= 200 ? 'text-primary' :
                              'text-white'
                            }`}>{stat.averageACS}</span>
                          </div>
                          <StatBar value={stat.averageACS} max={maxValues.acs} color="bg-gradient-to-r from-primary to-purple-500" />
                        </div>
                      </div>
                    </div>

                    {/* Stats - Mobile/Tablet */}
                    <div className="lg:hidden flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xl font-bold text-primary">{stat.averageACS}</span>
                      </div>
                      <p className="text-xs text-gray-500">ACS</p>
                    </div>
                  </div>

                  {/* Mobile Stats Row */}
                  <div className="lg:hidden mt-4 pt-4 border-t border-gray-800 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">{t('matches')}</p>
                      <p className="text-sm font-bold text-white">{stat.matchesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">{t('kills')}</p>
                      <p className="text-sm font-bold text-green-400">{stat.totalKills}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">{t('deaths')}</p>
                      <p className="text-sm font-bold text-red-400">{stat.totalDeaths}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">{t('kdRatio')}</p>
                      <p className={`text-sm font-bold ${
                        stat.kda >= 2 ? 'text-green-400' : stat.kda >= 1 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{stat.kda}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Footer */}
          {displayedStats.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center text-sm text-gray-500">
              {t('showingPlayers', { count: displayedStats.length })}
              {searchQuery && <span> {t('matching')} &quot;{searchQuery}&quot;</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
