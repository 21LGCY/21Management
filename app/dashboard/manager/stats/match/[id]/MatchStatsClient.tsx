'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory, PlayerMatchStats, UserProfile } from '@/lib/types/database'
import { ArrowLeft, Calendar, Trophy, Target, Users, TrendingUp, TrendingDown, Shield, Sword } from 'lucide-react'
import Link from 'next/link'

interface MatchStatsClientProps {
  matchId: string
  teamId: string
  initialMatch: MatchHistory
}

interface PlayerStatsWithProfile extends PlayerMatchStats {
  player: UserProfile
}

export default function MatchStatsClient({ matchId, teamId, initialMatch }: MatchStatsClientProps) {
  const [match] = useState<MatchHistory>(initialMatch)
  const [playerStats, setPlayerStats] = useState<PlayerStatsWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPlayerStats()
  }, [matchId])

  const fetchPlayerStats = async () => {
    try {
      const { data, error } = await supabase
        .from('player_match_stats')
        .select(`
          *,
          player:profiles(*)
        `)
        .eq('match_id', matchId)

      if (error) throw error
      setPlayerStats(data || [])
    } catch (error) {
      console.error('Error fetching player stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate team totals
  const teamTotals = playerStats.reduce((acc, stat) => ({
    kills: acc.kills + stat.kills,
    deaths: acc.deaths + stat.deaths,
    assists: acc.assists + stat.assists,
    acs: acc.acs + stat.acs,
    first_kills: acc.first_kills + stat.first_kills,
    first_deaths: acc.first_deaths + stat.first_deaths,
    plants: acc.plants + stat.plants,
    defuses: acc.defuses + stat.defuses
  }), {
    kills: 0,
    deaths: 0,
    assists: 0,
    acs: 0,
    first_kills: 0,
    first_deaths: 0,
    plants: 0,
    defuses: 0
  })

  const teamKDA = teamTotals.deaths > 0 
    ? ((teamTotals.kills + teamTotals.assists) / teamTotals.deaths).toFixed(2)
    : (teamTotals.kills + teamTotals.assists).toString()

  const avgACS = playerStats.length > 0 
    ? Math.round(teamTotals.acs / playerStats.length)
    : 0

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/manager/stats">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Match Statistics</h1>
          <p className="text-gray-400 mt-1">
            {new Date(match.match_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Match Summary */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-right">
                <p className="text-xl font-bold text-white">Team</p>
                <p className="text-3xl font-bold text-primary">{match.our_score}</p>
              </div>
              <div className="text-2xl font-bold text-gray-500">-</div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">{match.opponent_name}</p>
                <p className={`text-3xl font-bold ${match.result === 'win' ? 'text-red-400' : 'text-primary'}`}>
                  {match.opponent_score}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 text-lg rounded-lg font-bold ${
              match.result === 'win'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : match.result === 'loss'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            }`}>
              {match.result.toUpperCase()}
            </span>
          </div>

          {/* Match Details */}
          <div className="space-y-3">
            {match.map_name && (
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-gray-300">Map: {match.map_name}</span>
              </div>
            )}
            {match.match_type && (
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-gray-300">Type: {match.match_type}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-gray-300">
                {new Date(match.match_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Team Stats Summary */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Team K/D/A:</span>
              <span className="text-white font-bold">
                {teamTotals.kills}/{teamTotals.deaths}/{teamTotals.assists}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Team KDA:</span>
              <span className="text-primary font-bold">{teamKDA}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg ACS:</span>
              <span className="text-white font-bold">{avgACS}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Players:</span>
              <span className="text-white font-bold">{playerStats.length}</span>
            </div>
          </div>
        </div>

        {match.notes && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="font-semibold text-white mb-2">Match Notes</h3>
            <p className="text-gray-300">{match.notes}</p>
          </div>
        )}
      </div>

      {/* Player Statistics */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Player Performance</h2>
        
        {playerStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Player</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Agent</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">K</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">D</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">A</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">KDA</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">ACS</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">HS%</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">FK</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">FD</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Plants</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Defuses</th>
                </tr>
              </thead>
              <tbody>
                {playerStats
                  .sort((a, b) => {
                    const kdaA = a.deaths > 0 ? (a.kills + a.assists) / a.deaths : a.kills + a.assists
                    const kdaB = b.deaths > 0 ? (b.kills + b.assists) / b.deaths : b.kills + b.assists
                    return kdaB - kdaA
                  })
                  .map((stat) => {
                    const kda = stat.deaths > 0 
                      ? ((stat.kills + stat.assists) / stat.deaths).toFixed(2)
                      : (stat.kills + stat.assists).toString()
                    
                    return (
                      <tr key={stat.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{stat.player.username}</p>
                              <p className="text-sm text-gray-400">{stat.player.in_game_name || 'No IGN'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {stat.agent_played || 'Unknown'}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-white font-medium">{stat.kills}</td>
                        <td className="text-center py-3 px-4 text-white font-medium">{stat.deaths}</td>
                        <td className="text-center py-3 px-4 text-white font-medium">{stat.assists}</td>
                        <td className="text-center py-3 px-4 text-primary font-bold">{kda}</td>
                        <td className="text-center py-3 px-4 text-white font-medium">{stat.acs}</td>
                        <td className="text-center py-3 px-4 text-white">
                          {stat.headshot_percentage ? `${stat.headshot_percentage}%` : '-'}
                        </td>
                        <td className="text-center py-3 px-4 text-green-400">{stat.first_kills}</td>
                        <td className="text-center py-3 px-4 text-red-400">{stat.first_deaths}</td>
                        <td className="text-center py-3 px-4 text-blue-400">{stat.plants}</td>
                        <td className="text-center py-3 px-4 text-yellow-400">{stat.defuses}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No player statistics recorded</p>
            <p className="text-gray-500">Player performance data will appear here once added</p>
          </div>
        )}
      </div>
    </main>
  )
}