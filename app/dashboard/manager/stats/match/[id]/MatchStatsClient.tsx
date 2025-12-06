'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory, PlayerMatchStats, UserProfile } from '@/lib/types/database'
import { ArrowLeft, Calendar, Trophy, Target, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('stats')

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

  const teamAvgStats = playerStats.length > 0 ? {
    kills: (playerStats.reduce((sum, p) => sum + p.kills, 0) / playerStats.length).toFixed(1),
    deaths: (playerStats.reduce((sum, p) => sum + p.deaths, 0) / playerStats.length).toFixed(1),
    assists: (playerStats.reduce((sum, p) => sum + p.assists, 0) / playerStats.length).toFixed(1),
    acs: (playerStats.reduce((sum, p) => sum + p.acs, 0) / playerStats.length).toFixed(0),
    headshotPercent: (playerStats.reduce((sum, p) => sum + (p.headshot_percentage || 0), 0) / playerStats.length).toFixed(1),
  } : null

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/manager/stats">
            <button className="p-2 hover:bg-dark-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('matchDetails')}</h1>
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

        {/* Match Overview */}
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Trophy className={`w-12 h-12 ${
                match.result === 'win' ? 'text-green-400' :
                match.result === 'loss' ? 'text-red-400' :
                'text-yellow-400'
              }`} />
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  vs {match.opponent_name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-lg rounded-lg font-bold ${
                    match.result === 'win'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : match.result === 'loss'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {match.result.toUpperCase()}
                  </span>
                  <span className="text-3xl font-bold text-white">
                    <span className={match.result === 'win' ? 'text-green-400' : ''}>{match.our_score}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span className={match.result === 'loss' ? 'text-red-400' : ''}>{match.opponent_score}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              {match.match_type && (
                <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded inline-block">
                  {match.match_type}
                </div>
              )}
              {match.map_name && (
                <p className="text-gray-400">Map: <span className="text-white font-medium">{match.map_name}</span></p>
              )}
            </div>
          </div>

          {match.notes && (
            <div className="mt-4 p-4 bg-dark rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300">{match.notes}</p>
            </div>
          )}
        </div>

        {/* Team Average Stats */}
        {teamAvgStats && (
          <div className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">{t('teamAverage')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-dark/50 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">K/D/A</p>
                <p className="text-xl font-bold text-white">
                  {teamAvgStats.kills}/{teamAvgStats.deaths}/{teamAvgStats.assists}
                </p>
              </div>
              <div className="text-center p-4 bg-dark/50 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">ACS</p>
                <p className="text-xl font-bold text-primary">{teamAvgStats.acs}</p>
              </div>
              <div className="text-center p-4 bg-dark/50 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">HS%</p>
                <p className="text-xl font-bold text-white">{teamAvgStats.headshotPercent}%</p>
              </div>
              <div className="text-center p-4 bg-dark/50 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">FK/FD</p>
                <p className="text-xl font-bold text-white">
                  {playerStats.reduce((sum, p) => sum + p.first_kills, 0)}/
                  {playerStats.reduce((sum, p) => sum + p.first_deaths, 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-dark/50 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Plants/Defuses</p>
                <p className="text-xl font-bold text-white">
                  {playerStats.reduce((sum, p) => sum + p.plants, 0)}/
                  {playerStats.reduce((sum, p) => sum + p.defuses, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Player Statistics */}
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {t('playerStatistics')} ({playerStats.length})
          </h3>

          {playerStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Player</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Agent</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">K</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">D</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">A</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">K/D</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">ACS</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">HS%</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">FK</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">FD</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Plants</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Defuses</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats
                    .sort((a, b) => b.acs - a.acs)
                    .map((stat) => {
                      const kd = stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills.toFixed(2)
                      return (
                        <tr key={stat.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">{stat.player.username}</div>
                            <div className="text-sm text-gray-400">{stat.player.in_game_name || 'No IGN'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                              {stat.agent_played || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-white font-semibold">{stat.kills}</td>
                          <td className="py-3 px-4 text-center text-white font-semibold">{stat.deaths}</td>
                          <td className="py-3 px-4 text-center text-white font-semibold">{stat.assists}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-semibold ${
                              parseFloat(kd) >= 1.5 ? 'text-green-400' :
                              parseFloat(kd) >= 1.0 ? 'text-white' :
                              'text-red-400'
                            }`}>
                              {kd}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-primary font-semibold">{stat.acs}</td>
                          <td className="py-3 px-4 text-center text-white">{stat.headshot_percentage || 0}%</td>
                          <td className="py-3 px-4 text-center text-green-400">{stat.first_kills}</td>
                          <td className="py-3 px-4 text-center text-red-400">{stat.first_deaths}</td>
                          <td className="py-3 px-4 text-center text-gray-300">{stat.plants}</td>
                          <td className="py-3 px-4 text-center text-gray-300">{stat.defuses}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">{t('noPlayerStatsRecorded')}</p>
              <p className="text-gray-500">{t('playerDataWillAppear')}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}