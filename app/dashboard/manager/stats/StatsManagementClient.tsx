'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory, PlayerMatchStats, UserProfile } from '@/lib/types/database'
import { TrendingUp, Target, Award, BarChart3, Plus, Filter, Download, Users, Trophy, Calendar, TrendingDown, Eye, Edit, Trash2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import ActionButton from '@/components/ActionButton'
import { useTranslations } from 'next-intl'
import { getFaceitLevelImage } from '@/lib/types/games'

interface StatsManagementClientProps {
  user: UserProfile
  teamId: string
  teamName: string
  teamGame?: string
  playersWithFaceit?: any[]
}

interface MatchWithStats extends MatchHistory {
  player_stats?: (PlayerMatchStats & { player: UserProfile })[]
}

export default function StatsManagementClient({ user, teamId, teamName, teamGame = 'valorant', playersWithFaceit = [] }: StatsManagementClientProps) {
  const [matches, setMatches] = useState<MatchWithStats[]>([])
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'last5' | 'last10' | 'last15'>('all')
  const [syncingTeam, setSyncingTeam] = useState(false)
  const supabase = createClient()
  const t = useTranslations('stats')
  const tCommon = useTranslations('common')
  const tFaceit = useTranslations('faceit')

  const handleSyncTeam = async () => {
    setSyncingTeam(true)
    try {
      const response = await fetch('/api/faceit/team/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      })

      const data = await response.json()

      if (data.success) {
        alert(`${tFaceit('syncComplete')}: ${data.synced} ${tFaceit('playersUpdated')}`)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to sync team')
      }
    } catch (error) {
      alert('Failed to sync team')
    } finally {
      setSyncingTeam(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [teamId])

  const fetchData = async () => {
    try {
      // Fetch match history
      const { data: matchData, error: matchError } = await supabase
        .from('match_history')
        .select('*')
        .eq('team_id', teamId)
        .order('match_date', { ascending: false })

      if (matchError) throw matchError

      // Fetch player match stats for each match
      const matchesWithStats = await Promise.all(
        (matchData || []).map(async (match) => {
          const { data: statsData, error: statsError } = await supabase
            .from('player_match_stats')
            .select(`
              *,
              player:profiles(*)
            `)
            .eq('match_id', match.id)

          if (statsError) {
            return { ...match, player_stats: [] }
          }

          return { ...match, player_stats: statsData || [] }
        })
      )

      setMatches(matchesWithStats)

      // Fetch team players
      const { data: playersData, error: playersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'player')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (playersError) throw playersError
      setPlayers(playersData || [])

    } catch (error) {
      // Error fetching data
    } finally {
      setLoading(false)
    }
  }

  const filteredMatches = filter === 'all' 
    ? matches 
    : matches.filter(m => m.result === filter)

  // Calculate stats
  const stats = {
    total: matches.length,
    wins: matches.filter(m => m.result === 'win').length,
    losses: matches.filter(m => m.result === 'loss').length,
    draws: matches.filter(m => m.result === 'draw').length,
    winRate: matches.length > 0 
      ? Math.round((matches.filter(m => m.result === 'win').length / matches.length) * 100)
      : 0
  }

  // Calculate map statistics from FACEIT data for CS2
  const faceitMapStats = teamGame === 'cs2' && playersWithFaceit.length > 0
    ? playersWithFaceit.reduce((acc: any, player) => {
        const segments = player.faceit_stats?.segments || []
        segments.forEach((segment: any) => {
          const mapName = segment.label
          if (!acc[mapName]) {
            acc[mapName] = {
              mapName,
              matches: 0,
              wins: 0,
              totalKills: 0,
              totalDeaths: 0,
              kdRatio: 0,
              playerCount: 0,
              mapImage: segment.img_regular
            }
          }
          const matches = parseInt(segment.stats['Matches'] || '0', 10)
          const wins = parseInt(segment.stats['Wins'] || '0', 10)
          const kdRatio = parseFloat(segment.stats['K/D Ratio'] || '0')
          
          acc[mapName].matches += matches
          acc[mapName].wins += wins
          acc[mapName].totalKills += parseInt(segment.stats['Kills'] || '0', 10)
          acc[mapName].totalDeaths += parseInt(segment.stats['Deaths'] || '0', 10)
          acc[mapName].kdRatio += kdRatio
          acc[mapName].playerCount++
        })
        return acc
      }, {})
    : {}

  const sortedFaceitMapStats = Object.values(faceitMapStats)
    .map((stat: any) => ({
      ...stat,
      winRate: stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0,
      avgKdRatio: stat.playerCount > 0 ? stat.kdRatio / stat.playerCount : 0
    }))
    .sort((a: any, b: any) => b.matches - a.matches)

  // Calculate map statistics from manual match recording (for Valorant)
  const manualMapStats = teamGame !== 'cs2' ? matches
    .filter(m => m.map_name)
    .reduce((acc: any, match) => {
      const mapName = match.map_name!
      if (!acc[mapName]) {
        acc[mapName] = {
          mapName,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalRounds: 0,
          roundsWon: 0,
          roundsLost: 0
        }
      }
      acc[mapName].matches++
      if (match.result === 'win') acc[mapName].wins++
      if (match.result === 'loss') acc[mapName].losses++
      if (match.result === 'draw') acc[mapName].draws++
      acc[mapName].totalRounds += (match.our_score || 0) + (match.opponent_score || 0)
      acc[mapName].roundsWon += match.our_score || 0
      acc[mapName].roundsLost += match.opponent_score || 0
      return acc
    }, {}) : {}

  const sortedManualMapStats = Object.values(manualMapStats)
    .map((stat: any) => ({
      ...stat,
      winRate: stat.matches > 0 ? (stat.wins / stat.matches) * 100 : 0,
      avgRoundsWon: stat.matches > 0 ? stat.roundsWon / stat.matches : 0,
      avgRoundsLost: stat.matches > 0 ? stat.roundsLost / stat.matches : 0
    }))
    .sort((a: any, b: any) => b.matches - a.matches)

  const sortedMapStats = teamGame === 'cs2' ? sortedFaceitMapStats : sortedManualMapStats

  // Calculate player performance averages with time filtering
  const getPlayerAverages = (playerId: string) => {
    // Get matches for time filtering
    let matchesToConsider = matches
    if (timeFilter === 'last5') {
      matchesToConsider = matches.slice(0, 5)
    } else if (timeFilter === 'last10') {
      matchesToConsider = matches.slice(0, 10)
    } else if (timeFilter === 'last15') {
      matchesToConsider = matches.slice(0, 15)
    }

    const playerStats = matchesToConsider.flatMap(match => 
      match.player_stats?.filter(stat => stat.player_id === playerId) || []
    )
    
    if (playerStats.length === 0) return { kda: 0, acs: 0, matches: 0, hasStats: false }
    
    const totalKills = playerStats.reduce((sum, stat) => sum + stat.kills, 0)
    const totalDeaths = playerStats.reduce((sum, stat) => sum + stat.deaths, 0)
    const totalAssists = playerStats.reduce((sum, stat) => sum + stat.assists, 0)
    const totalAcs = playerStats.reduce((sum, stat) => sum + stat.acs, 0)
    
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists
    const avgAcs = totalAcs / playerStats.length
    
    return {
      kda: parseFloat(kda.toFixed(2)),
      acs: Math.round(avgAcs),
      matches: playerStats.length,
      hasStats: true
    }
  }

  // Intelligent player sorting: players with stats first, then by performance
  const sortedPlayers = players.sort((a, b) => {
    const aStats = getPlayerAverages(a.id)
    const bStats = getPlayerAverages(b.id)
    
    // Players with stats come first
    if (aStats.hasStats && !bStats.hasStats) return -1
    if (!aStats.hasStats && bStats.hasStats) return 1
    
    // If both have stats, sort by KDA (descending), then by ACS (descending)
    if (aStats.hasStats && bStats.hasStats) {
      if (aStats.kda !== bStats.kda) return bStats.kda - aStats.kda
      return bStats.acs - aStats.acs
    }
    
    // If neither has stats, sort by username
    return a.username.localeCompare(b.username)
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('statisticsManagement')}
          </h1>
          <p className="text-gray-400">{t('trackAndAnalyze', { teamName })}</p>
        </div>

        {/* Stats Overview - Enhanced Design - Hidden for CS2 */}
        {teamGame !== 'cs2' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all hover:shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <Trophy className="w-6 h-6 text-gray-300" />
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-1">{tCommon('totalMatches')}</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-300/70 mb-1">{tCommon('wins')}</p>
            <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-dark border border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <p className="text-sm text-red-300/70 mb-1">{tCommon('losses')}</p>
            <p className="text-3xl font-bold text-red-400">{stats.losses}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-yellow-300/70 mb-1">{tCommon('draws')}</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.draws}</p>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-dark border border-primary/40 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-primary/30 rounded-lg">
                <Award className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-primary/70 mb-1">{tCommon('winRate')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary">{stats.winRate}%</p>
              {stats.total > 0 && (
                <span className="text-xs text-gray-400">of {stats.total}</span>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Manual Match Recording Option for CS2 */}
        {teamGame === 'cs2' && (
          <div className="mb-6 bg-dark-card border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{t('manualMatchRecording')}</h3>
                <p className="text-sm text-gray-400">{t('recordMatchesNotOnFaceit')}</p>
              </div>
              <Link href="/dashboard/manager/stats/game/new">
                <ActionButton icon={Plus}>
                  {t('recordMatch')}
                </ActionButton>
              </Link>
            </div>
          </div>
        )}

        {/* FACEIT Integration Section - Only for CS2 */}
        {teamGame === 'cs2' && (
          <div className="bg-gradient-to-br from-orange-500/5 to-dark border border-orange-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/images/faceit.svg" alt="FACEIT" className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{tFaceit('teamStats')}</h2>
                  <p className="text-sm text-gray-400">{playersWithFaceit.length} {tFaceit('linkedPlayers')} / {players.length} total players</p>
                </div>
              </div>
              <button
                onClick={handleSyncTeam}
                disabled={syncingTeam}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg hover:shadow-orange-500/25"
              >
                <RefreshCw className={`w-4 h-4 ${syncingTeam ? 'animate-spin' : ''}`} />
                {syncingTeam ? tFaceit('syncing') : tFaceit('syncTeam')}
              </button>
            </div>

            {playersWithFaceit.length > 0 && (
              <>
                {/* Team Aggregate Stats */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-orange-500/30 transition-all">
                    <p className="text-xs text-gray-400 mb-1">{tFaceit('avgElo')}</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {Math.round(playersWithFaceit.reduce((sum, p) => sum + (p.faceit_elo || 0), 0) / playersWithFaceit.length)}
                    </p>
                  </div>
                  <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-yellow-500/30 transition-all">
                    <p className="text-xs text-gray-400 mb-1">{tFaceit('avgLevel')}</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {(playersWithFaceit.reduce((sum, p) => sum + (p.faceit_level || 0), 0) / playersWithFaceit.length).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-green-500/30 transition-all">
                    <p className="text-xs text-gray-400 mb-1">{tFaceit('avgWinRate')}</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(playersWithFaceit.reduce((sum, p) => sum + (p.faceit_stats?.winRate || 0), 0) / playersWithFaceit.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-blue-500/30 transition-all">
                    <p className="text-xs text-gray-400 mb-1">{tFaceit('totalMatches')}</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {playersWithFaceit.reduce((sum, p) => sum + (p.faceit_stats?.matches || 0), 0)}
                    </p>
                  </div>
                </div>

                {/* All Players with FACEIT */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    All Players FACEIT Statistics
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {playersWithFaceit
                      .sort((a, b) => (b.faceit_elo || 0) - (a.faceit_elo || 0))
                      .map((player, index) => {
                        const stats = player.faceit_stats
                        const levelColor = player.faceit_level >= 8 ? 'from-red-600 to-orange-500' :
                                          player.faceit_level >= 5 ? 'from-orange-500 to-yellow-500' :
                                          player.faceit_level >= 3 ? 'from-yellow-500 to-green-500' :
                                          'from-green-500 to-blue-500'
                        
                        return (
                          <div 
                            key={player.id}
                            className="group bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-4 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10"
                          >
                            {/* Player Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Rank Badge for Top 3 */}
                                {index < 3 && (
                                  <div className="flex-shrink-0">
                                    {index === 0 && <span className="text-2xl">🥇</span>}
                                    {index === 1 && <span className="text-2xl">🥈</span>}
                                    {index === 2 && <span className="text-2xl">🥉</span>}
                                  </div>
                                )}
                                
                                {/* Player Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-white truncate">{player.username}</p>
                                    {player.faceit_stats?.verified && (
                                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-gray-400 truncate">{player.faceit_nickname || player.in_game_name}</p>
                                    {player.faceit_stats?.country && (
                                      <>
                                        <span className="text-gray-600">•</span>
                                        <p className="text-xs text-gray-500">{player.faceit_stats.country.toUpperCase()}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Level Badge */}
                              <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center">
                                <img 
                                  src={getFaceitLevelImage(player.faceit_level || 1)} 
                                  alt={`Level ${player.faceit_level}`}
                                  className="w-full h-full"
                                />
                              </div>
                            </div>

                            {/* ELO Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">FACEIT ELO</span>
                                <span className="text-orange-400 font-bold">{player.faceit_elo}</span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                                  style={{ width: `${Math.min((player.faceit_elo || 0) / 3000 * 100, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-gray-400 uppercase mb-1">Win Rate</p>
                                <p className="text-sm font-bold text-green-400">{stats?.winRate?.toFixed(0) || 0}%</p>
                              </div>
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-gray-400 uppercase mb-1">K/D</p>
                                <p className="text-sm font-bold text-blue-400">{stats?.avgKdRatio?.toFixed(2) || '-'}</p>
                              </div>
                              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-gray-400 uppercase mb-1">HS%</p>
                                <p className="text-sm font-bold text-purple-400">{stats?.headshotPercentage?.toFixed(0) || 0}%</p>
                              </div>
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-gray-400 uppercase mb-1">Matches</p>
                                <p className="text-sm font-bold text-yellow-400">{stats?.matches || 0}</p>
                              </div>
                            </div>

                            {/* Additional Stats */}
                            {stats && (
                              <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                  <p className="text-gray-500">Wins</p>
                                  <p className="text-white font-medium">{stats.wins || 0}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Win Streak</p>
                                  <p className="text-white font-medium">{stats.currentStreak || 0}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Best Streak</p>
                                  <p className="text-white font-medium">{stats.longestWinStreak || 0}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </>
            )}

            {/* Players without FACEIT */}
            {players.filter(p => !p.faceit_player_id).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Players Without FACEIT ({players.filter(p => !p.faceit_player_id).length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {players.filter(p => !p.faceit_player_id).map((player) => (
                    <div 
                      key={player.id}
                      className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                    >
                      <p className="text-sm font-medium text-white">{player.username}</p>
                      <p className="text-xs text-gray-500">{player.in_game_name || 'No IGN'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Game Statistics and Player Performance - Hidden for CS2 */}
        {teamGame !== 'cs2' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Game Statistics - Identical to Admin Match History */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">{t('recentGameStatistics')}</h2>
              <Link href="/dashboard/manager/stats/game/new">
                <ActionButton icon={Trophy}>
                  {t('recordMatch')}
                </ActionButton>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-dark text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tCommon('all')}
              </button>
              <button
                onClick={() => setFilter('win')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'win'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tCommon('wins')}
              </button>
              <button
                onClick={() => setFilter('loss')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'loss'
                    ? 'bg-red-500 text-white'
                    : 'bg-dark text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tCommon('losses')}
              </button>
              <button
                onClick={() => setFilter('draw')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'draw'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-dark text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tCommon('draws')}
              </button>
            </div>
            
            <div className="space-y-4">
              {filteredMatches && filteredMatches.length > 0 ? (
                filteredMatches.slice(0, 10).map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800 hover:border-gray-700 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-400 whitespace-nowrap">
                              {new Date(match.match_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {match.match_type && (
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded whitespace-nowrap">
                              {match.match_type}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-sm rounded-lg font-medium whitespace-nowrap ${
                            match.result === 'win'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : match.result === 'loss'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            {match.result.toUpperCase()}
                          </span>
                        </div>

                        <div className="mb-2">
                          <h3 className="text-lg font-bold text-white break-words">
                            <span className="text-white">{teamName}</span>{' '}
                            <span className="text-primary">{match.our_score}</span>
                            <span className="text-gray-500 mx-2">-</span>
                            <span className={match.result === 'win' ? 'text-red-400' : 'text-primary'}>
                              {match.opponent_score}
                            </span>{' '}
                            <span className="text-white">{match.opponent_name}</span>
                          </h3>
                        </div>

                        {match.map_name && (
                          <p className="text-sm text-gray-400 truncate">{t('map')}: {match.map_name}</p>
                        )}

                        {match.notes && (
                          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{match.notes}</p>
                        )}

                        {/* Show player stats summary */}
                        {match.player_stats && match.player_stats.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-gray-400 mb-2">{t('playerStatsAvailable')}</p>
                            <div className="flex gap-4 text-xs">
                              <span className="text-gray-400">
                                {t('players')}: {match.player_stats.length}
                              </span>
                              <span className="text-gray-400">
                                {t('avgACSLabel')}: {Math.round(match.player_stats.reduce((sum, stat) => sum + stat.acs, 0) / match.player_stats.length)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/dashboard/manager/stats/match/${match.id}`}>
                          <button 
                            className="p-2 text-primary hover:bg-primary/10 rounded transition"
                            title={t('viewStats')}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </Link>
                        <Link href={`/dashboard/manager/stats/match/${match.id}/edit`}>
                          <button 
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition"
                            title={t('editMatch')}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">{t('noGameStatistics')}</p>
                  <Link href="/dashboard/manager/stats/game/new">
                    <ActionButton icon={Trophy}>
                      {matches.length === 0 ? t('recordFirstMatch') : t('recordMatch')}
                    </ActionButton>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Player Performance - Enhanced with Real Stats */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">{t('playerPerformance')}</h2>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-dark border border-gray-700 rounded text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{teamName}</span>
                </div>
                <CustomSelect
                  value={timeFilter}
                  onChange={(value) => setTimeFilter(value as 'all' | 'last5' | 'last10' | 'last15')}
                  options={[
                    { value: 'all', label: t('allTime') },
                    { value: 'last5', label: t('lastNMatchesFilter', { count: 5 }) },
                    { value: 'last10', label: t('lastNMatchesFilter', { count: 10 }) },
                    { value: 'last15', label: t('lastNMatchesFilter', { count: 15 }) }
                  ]}
                  className="min-w-[150px]"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {sortedPlayers && sortedPlayers.length > 0 ? (
                sortedPlayers.slice(0, 8).map((player) => {
                  const averages = getPlayerAverages(player.id)
                  return (
                    <div
                      key={player.id}
                      className={`p-4 bg-dark rounded-lg border ${
                        averages.hasStats ? 'border-gray-700' : 'border-gray-800'
                      } ${averages.hasStats ? 'bg-gray-800/30' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            averages.hasStats ? 'bg-primary/20' : 'bg-gray-600/20'
                          }`}>
                            <Users className={`w-4 h-4 ${
                              averages.hasStats ? 'text-primary' : 'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{player.username}</p>
                              {averages.hasStats && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                  {t('active')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {player.in_game_name || t('noIGN')} 
                              {player.position && ` • ${player.position}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {averages.hasStats ? (
                            <div className="flex gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">{t('kda')}</p>
                                <p className="text-white font-medium">{averages.kda}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">{t('avgACS')}</p>
                                <p className="text-white font-medium">{averages.acs}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">{t('matches')}</p>
                                <p className="text-white font-medium">{averages.matches}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-gray-500 text-sm">{t('noStats')}</p>
                              <p className="text-gray-600 text-xs">{t('recordMatchToSeeData')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">{t('noPlayersFound')}</p>
                  <p className="text-gray-500 text-sm">{t('addPlayersToTrack')}</p>
                </div>
              )}
            </div>
          </div>
          </div>
          </>
        )}

        {/* Map Statistics Section */}
        {sortedMapStats.length > 0 && (
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('mapStatistics')}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {teamGame === 'cs2' ? t('faceitMapData') : t('teamPerformanceByMap')}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-dark border border-gray-700 rounded text-sm text-gray-400">
                <Trophy className="w-4 h-4" />
                <span>{sortedMapStats.length} {t('mapsPlayed')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedMapStats.map((mapStat: any) => {
                const winRateColor = 
                  mapStat.winRate >= 60 ? 'from-green-500 to-emerald-600' :
                  mapStat.winRate >= 40 ? 'from-yellow-500 to-orange-500' :
                  'from-red-500 to-rose-600'
                
                return (
                  <div 
                    key={mapStat.mapName}
                    className="bg-gradient-to-br from-dark to-dark-card border border-gray-800 rounded-xl p-5 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group"
                  >
                    {/* Map Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{mapStat.mapName}</h3>
                        <p className="text-xs text-gray-500">{mapStat.matches} {t('matches')}</p>
                      </div>
                      {mapStat.mapImage && (
                        <img 
                          src={mapStat.mapImage} 
                          alt={mapStat.mapName}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>

                    {/* Win Rate Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-400">{t('winRate')}</span>
                        <span className={`font-bold bg-gradient-to-r ${winRateColor} bg-clip-text text-transparent`}>
                          {mapStat.winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${winRateColor} transition-all duration-500`}
                          style={{ width: `${Math.min(mapStat.winRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    {teamGame === 'cs2' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-1">{t('matches')}</p>
                          <p className="text-lg font-bold text-blue-400">{mapStat.matches}</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-1">{tCommon('wins')}</p>
                          <p className="text-lg font-bold text-green-400">{mapStat.wins}</p>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-1">K/D</p>
                          <p className="text-lg font-bold text-purple-400">{mapStat.avgKdRatio?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-1">{tCommon('wins')}</p>
                          <p className="text-lg font-bold text-green-400">{mapStat.wins}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-1">{tCommon('losses')}</p>
                          <p className="text-lg font-bold text-red-400">{mapStat.losses}</p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400 mb-1">{tCommon('draws')}</p>
                          <p className="text-lg font-bold text-yellow-400">{mapStat.draws}</p>
                        </div>
                      </div>
                    )}

                    {/* Additional Stats */}
                    {teamGame !== 'cs2' && (
                      <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-3 text-center text-xs">
                        <div>
                          <p className="text-gray-500">{t('avgRoundsWon')}</p>
                          <p className="text-white font-medium">{mapStat.avgRoundsWon?.toFixed(1) || '0.0'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('avgRoundsLost')}</p>
                          <p className="text-white font-medium">{mapStat.avgRoundsLost?.toFixed(1) || '0.0'}</p>
                        </div>
                      </div>
                    )}
                    {teamGame === 'cs2' && (
                      <div className="mt-3 pt-3 border-t border-gray-800 text-center text-xs">
                        <p className="text-gray-500">{t('aggregatedFromPlayers', { count: mapStat.playerCount })}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}