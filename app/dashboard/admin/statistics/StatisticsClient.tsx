'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, UserProfile, PlayerMatchStats } from '@/lib/types/database'
import { BarChart3, User, Users as UsersIcon, Trophy, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import CustomSelect from '@/components/CustomSelect'

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
}

type ViewMode = 'all' | 'team' | 'player'

export default function StatisticsClient({ teams }: StatisticsClientProps) {
  const supabase = createClient()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<PlayerAggregatedStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllStats()
    } else if (viewMode === 'team' && selectedTeamId) {
      fetchTeamStats(selectedTeamId)
    } else if (viewMode === 'player' && selectedPlayerId) {
      fetchPlayerStats(selectedPlayerId)
    }
  }, [viewMode, selectedTeamId, selectedPlayerId])

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamPlayers(selectedTeamId)
    }
  }, [selectedTeamId])

  const fetchTeamPlayers = async (teamId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('team_id', teamId)
      .eq('role', 'player')
      .order('username')
    
    setPlayers(data || [])
  }

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

  const fetchPlayerStats = async (playerId: string) => {
    setLoading(true)
    try {
      const { data: player } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (!player) {
        setStats([])
        return
      }

      const aggregated = await aggregatePlayerStats(player)
      setStats([aggregated])
    } catch (error) {
      console.error('Error fetching player stats:', error)
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
        kda: 0
      }
    }

    const totalKills = matchStats.reduce((sum, s) => sum + s.kills, 0)
    const totalDeaths = matchStats.reduce((sum, s) => sum + s.deaths, 0)
    const totalAssists = matchStats.reduce((sum, s) => sum + s.assists, 0)
    const totalACS = matchStats.reduce((sum, s) => sum + s.acs, 0)
    const matchesPlayed = matchStats.length
    const averageACS = Math.round(totalACS / matchesPlayed)
    const kda = totalDeaths > 0 ? parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : totalKills + totalAssists

    return {
      player,
      totalKills,
      totalDeaths,
      totalAssists,
      totalACS,
      matchesPlayed,
      averageACS,
      kda
    }
  }

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              setViewMode('all')
              setSelectedTeamId('')
              setSelectedPlayerId('')
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === 'all'
                ? 'bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            All Players
          </button>

          <button
            onClick={() => {
              setViewMode('team')
              setSelectedPlayerId('')
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === 'team'
                ? 'bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            By Team
          </button>

          <button
            onClick={() => {
              setViewMode('player')
              setSelectedTeamId('')
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === 'player'
                ? 'bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
            }`}
          >
            <User className="w-5 h-5" />
            Individual Player
          </button>
        </div>

        {/* Team Selector */}
        {viewMode === 'team' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Team</label>
            <CustomSelect
              value={selectedTeamId}
              onChange={(value) => setSelectedTeamId(value)}
              options={[
                { value: '', label: 'Choose a team...' },
                ...teams.map(team => ({
                  value: team.id,
                  label: `${team.name} - ${team.game}`
                }))
              ]}
              className="w-full"
            />
          </div>
        )}

        {/* Player Selector */}
        {viewMode === 'player' && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Team (Optional)</label>
              <CustomSelect
                value={selectedTeamId}
                onChange={(value) => setSelectedTeamId(value)}
                options={[
                  { value: '', label: 'All teams...' },
                  ...teams.map(team => ({
                    value: team.id,
                    label: `${team.name} - ${team.game}`
                  }))
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Player</label>
              <CustomSelect
                value={selectedPlayerId}
                onChange={(value) => setSelectedPlayerId(value)}
                options={[
                  { value: '', label: 'Choose a player...' },
                  ...(selectedTeamId ? players : []).map(player => ({
                    value: player.id,
                    label: player.in_game_name || player.username
                  }))
                ]}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Statistics Display */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : stats.length === 0 ? (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No statistics available</p>
          <p className="text-gray-500 text-sm mt-2">Record some matches to see player statistics</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          {/* Stats Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Kills
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Deaths
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Assists
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    K/D/A
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Avg ACS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.map((stat, index) => (
                  <tr key={stat.player.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                          {stat.player.avatar_url ? (
                            <Image
                              src={stat.player.avatar_url}
                              alt={stat.player.username}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{stat.player.in_game_name || stat.player.username}</p>
                          <p className="text-xs text-gray-500">{stat.player.position || 'Player'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-semibold">{stat.matchesPlayed}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-400 font-semibold">{stat.totalKills}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-red-400 font-semibold">{stat.totalDeaths}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-blue-400 font-semibold">{stat.totalAssists}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white font-semibold">{stat.kda}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-primary font-bold">{stat.averageACS}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
