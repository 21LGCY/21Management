'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory, PlayerMatchStats, UserProfile, UserRole } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Trophy, Edit, Trash2, MessageSquare } from 'lucide-react'
import TeamCommunication from '../../TeamCommunication'

interface MatchDetailsClientProps {
  matchId: string
  teamId: string
  userId: string
  userName: string
  userRole: UserRole
}

interface PlayerStatsWithProfile extends PlayerMatchStats {
  player: UserProfile
}

export default function MatchDetailsClient({ matchId, teamId, userId, userName, userRole }: MatchDetailsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<MatchHistory | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStatsWithProfile[]>([])

  useEffect(() => {
    fetchMatchDetails()
  }, [matchId])

  const fetchMatchDetails = async () => {
    try {
      const { data: matchData, error: matchError} = await supabase
        .from('match_history')
        .select('*')
        .eq('id', matchId)
        .eq('team_id', teamId)
        .single()

      if (matchError) throw matchError
      setMatch(matchData)

      const { data: statsData, error: statsError } = await supabase
        .from('player_match_stats')
        .select(`
          *,
          player:profiles(*)
        `)
        .eq('match_id', matchId)

      if (statsError) throw statsError
      setPlayerStats(statsData as any || [])
    } catch (error) {
      console.error('Error fetching match details:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMatch = async () => {
    if (!confirm('Are you sure you want to delete this match? All player statistics will also be deleted.')) return

    try {
      const { error } = await supabase
        .from('match_history')
        .delete()
        .eq('id', matchId)

      if (error) throw error
      router.push(`/dashboard/admin/teams/view/${teamId}`)
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Failed to delete match')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg mb-4">Match not found</p>
        <Link href={`/dashboard/admin/teams/view/${teamId}`} className="text-primary hover:underline">
          Return to team
        </Link>
      </div>
    )
  }

  const teamAvgStats = playerStats.length > 0 ? {
    kills: (playerStats.reduce((sum, p) => sum + p.kills, 0) / playerStats.length).toFixed(1),
    deaths: (playerStats.reduce((sum, p) => sum + p.deaths, 0) / playerStats.length).toFixed(1),
    assists: (playerStats.reduce((sum, p) => sum + p.assists, 0) / playerStats.length).toFixed(1),
    acs: (playerStats.reduce((sum, p) => sum + p.acs, 0) / playerStats.length).toFixed(0),
    econRating: (playerStats.reduce((sum, p) => sum + (p.econ_rating || 0), 0) / playerStats.length).toFixed(0),
  } : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/admin/teams/view/${teamId}`}>
            <button className="p-2 hover:bg-dark-card rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Match Details</h1>
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

        <div className="flex gap-2">
          <Link href={`/dashboard/admin/teams/view/${teamId}/matches/${matchId}/edit`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </Link>
          <button
            onClick={deleteMatch}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Match Overview */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
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
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Team Average</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">K/D/A</p>
              <p className="text-xl font-bold text-white">
                {teamAvgStats.kills}/{teamAvgStats.deaths}/{teamAvgStats.assists}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">ACS</p>
              <p className="text-xl font-bold text-primary">{teamAvgStats.acs}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">ECON Rating</p>
              <p className="text-xl font-bold text-white">{teamAvgStats.econRating}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">First Bloods</p>
              <p className="text-xl font-bold text-green-400">
                {playerStats.reduce((sum, p) => sum + p.first_kills, 0)}
              </p>
            </div>
            <div className="text-center">
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
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Player Statistics ({playerStats.length})
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
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">ECON</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">FK</th>
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
                      <tr key={stat.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="text-white font-medium">{stat.player.username}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{stat.agent_played}</td>
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
                        <td className="py-3 px-4 text-center text-white">{stat.econ_rating || 0}</td>
                        <td className="py-3 px-4 text-center text-green-400">{stat.first_kills}</td>
                        <td className="py-3 px-4 text-center text-gray-300">{stat.plants}</td>
                        <td className="py-3 px-4 text-center text-gray-300">{stat.defuses}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No player statistics recorded for this match.</p>
          </div>
        )}
      </div>

      {/* Match Review Section - Available for All Match Types */}
      {match && (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-white">Match Review</h2>
          </div>
          <TeamCommunication
            teamId={teamId}
            section="review_praccs"
            matchId={matchId}
            userId={userId}
            userName={userName}
            userRole={userRole}
          />
        </div>
      )}
    </div>
  )
}
