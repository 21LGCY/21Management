'use client'

import { MatchHistoryWithStats, PlayerMatchStats } from '@/lib/types/database'
import { ArrowLeft, Trophy, Calendar, Map, Flag, Users, Target, Crosshair, Heart, Edit } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface MatchDetailClientProps {
  match: MatchHistoryWithStats & {
    team?: { name: string; tag?: string }
    player_stats?: (PlayerMatchStats & {
      player: {
        id: string
        username: string
        in_game_name?: string
        avatar_url?: string
        position?: string
      }
    })[]
  }
}

export default function MatchDetailClient({ match }: MatchDetailClientProps) {
  const team = match.team
  const playerStats = match.player_stats || []
  const t = useTranslations('stats')

  const resultColor = match.result === 'win' ? 'text-green-400' : match.result === 'loss' ? 'text-red-400' : 'text-yellow-400'
  const resultBg = match.result === 'win' ? 'bg-green-500/20 border-green-500/30' : match.result === 'loss' ? 'bg-red-500/20 border-red-500/30' : 'bg-yellow-500/20 border-yellow-500/30'

  // Calculate team totals
  const teamTotals = playerStats.reduce((acc, stat) => ({
    kills: acc.kills + stat.kills,
    deaths: acc.deaths + stat.deaths,
    assists: acc.assists + stat.assists,
    acs: acc.acs + stat.acs
  }), { kills: 0, deaths: 0, assists: 0, acs: 0 })

  const avgACS = playerStats.length > 0 ? Math.round(teamTotals.acs / playerStats.length) : 0

  return (
    <div className="space-y-6">
      {/* Header with Back and Edit Buttons */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/admin/matches">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            {t('backToMatches')}
          </button>
        </Link>
        <Link href={`/dashboard/admin/teams/view/${match.team_id}/matches/${match.id}/edit`}>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
            <Edit className="w-4 h-4" />
            {t('editMatch')}
          </button>
        </Link>
      </div>

      {/* Match Header */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">
                {new Date(match.match_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {match.match_type && (
                <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg">
                  {match.match_type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-white">{team?.name || t('unknownTeam')}</h1>
              <span className="text-3xl text-gray-500">vs</span>
              <h1 className="text-4xl font-bold text-white">{match.opponent_name}</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-bold ${match.result === 'win' ? 'text-green-400' : 'text-white'}`}>
                  {match.our_score}
                </span>
                <span className="text-4xl text-gray-500">-</span>
                <span className={`text-6xl font-bold ${match.result === 'loss' ? 'text-red-400' : 'text-white'}`}>
                  {match.opponent_score}
                </span>
              </div>

              <span className={`px-4 py-2 text-lg rounded-xl font-bold border ${resultBg} ${resultColor}`}>
                {match.result?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {match.map_name && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                <Map className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">{match.map_name}</span>
              </div>
            )}
          </div>
        </div>

        {match.notes && (
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400 italic">{match.notes}</p>
          </div>
        )}
      </div>

      {/* Team Statistics Summary */}
      {playerStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teamTotals.kills}</p>
                <p className="text-sm text-gray-400">{t('totalKills')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-card via-dark-card to-red-500/5 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teamTotals.deaths}</p>
                <p className="text-sm text-gray-400">{t('totalDeaths')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teamTotals.assists}</p>
                <p className="text-sm text-gray-400">{t('totalAssists')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{avgACS}</p>
                <p className="text-sm text-gray-400">{t('avgACSShort')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Statistics */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-2xl font-bold text-white">{t('playerStatistics')}</h2>
        </div>

        {playerStats.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('noStatsForMatch')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Agent
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
                    ACS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {playerStats
                  .sort((a, b) => b.acs - a.acs)
                  .map((stat) => {
                    const player = (stat as any).player
                    const kda = stat.deaths > 0 ? ((stat.kills + stat.assists) / stat.deaths).toFixed(2) : (stat.kills + stat.assists).toFixed(2)
                    
                    return (
                      <tr key={stat.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                              {player.avatar_url ? (
                                <Image
                                  src={player.avatar_url}
                                  alt={player.username}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{player.in_game_name || player.username}</p>
                              <p className="text-xs text-gray-500">{player.position || 'Player'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded">
                            {stat.agent_played || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-green-400 font-semibold text-lg">{stat.kills}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-red-400 font-semibold text-lg">{stat.deaths}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-blue-400 font-semibold text-lg">{stat.assists}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-white font-semibold text-lg">{kda}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-primary font-bold text-lg">{stat.acs}</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
