'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, Match } from '@/lib/types/database'
import { Plus, Edit, Trash2, Calendar, TrendingUp, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getTeamColors } from '@/lib/utils/teamColors'

export default function TeamManagementClient() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<(Match & { teams: Team })[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    fetchAllMatches()
  }, [])

  const fetchData = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (teamsError) throw teamsError
      setTeams(teamsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, teams(*)')
        .order('scheduled_at', { ascending: false })
        .limit(20)

      if (error) throw error
      console.log('Fetched matches:', data)
      console.log('Matches with results:', data?.filter(m => m.result))
      console.log('Upcoming matches:', data?.filter(m => !m.result && new Date(m.scheduled_at) >= new Date()))
      setMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const deleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? All associated matches will also be deleted.')) return

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTeams(teams.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting team:', error)
    }
  }

  const deleteMatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMatches(matches.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting match:', error)
    }
  }

  const getMatchResultColor = (result?: string) => {
    switch (result) {
      case 'win': return 'text-green-400'
      case 'loss': return 'text-red-400'
      case 'draw': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const calculateStats = () => {
    if (!matches.length) return { wins: 0, losses: 0, draws: 0, winRate: 0 }
    
    const wins = matches.filter(m => m.result === 'win').length
    const losses = matches.filter(m => m.result === 'loss').length
    const draws = matches.filter(m => m.result === 'draw').length
    const winRate = matches.filter(m => m.result).length > 0 
      ? Math.round((wins / matches.filter(m => m.result).length) * 100)
      : 0

    return { wins, losses, draws, winRate }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Teams List */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Teams</h2>
          <Link
            href="/dashboard/admin/teams/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110"
          >
            <Plus className="w-5 h-5" />
            <span>Add Team</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamColors = getTeamColors(team.tag)
            return (
              <Link
                key={team.id}
                href={`/dashboard/admin/teams/view/${team.id}`}
                className={`group p-5 rounded-xl border bg-gradient-to-br ${teamColors.gradient} ${teamColors.border} ${teamColors.hoverBorder} transition-all cursor-pointer`}
                style={{
                  ...teamColors.style,
                  boxShadow: '0 0 0 0 transparent',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 25px -5px ${teamColors.hoverShadow}, 0 8px 10px -6px ${teamColors.hoverShadow}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 0 transparent'
                }}
              >
                <div className="flex items-center gap-4 mb-2">
                  {team.logo_url ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      <Image
                        src={team.logo_url}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white transition text-lg">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.game}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Planning Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match History */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Match History</h2>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/dashboard/admin/matches"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-300 border border-gray-600/50 hover:border-primary/50 shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:brightness-125"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">View All</span>
              </Link>
              <Link
                href="/dashboard/admin/matches/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Record Match</span>
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {matches.filter(m => m.result).length === 0 ? (
              <p className="text-center text-gray-400 py-12 bg-gray-800/20 rounded-lg border border-gray-800/50">No match history yet</p>
            ) : (
              matches.filter(m => m.result).slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="group flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-800 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold text-white">
                        {match.teams?.name || teams.find(t => t.id === match.team_id)?.name} vs {match.opponent}
                      </p>
                      {match.result && (
                        <span className={`px-2.5 py-1 text-xs rounded-lg font-semibold border ${
                          match.result === 'win' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          match.result === 'loss' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {match.result.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(match.scheduled_at).toLocaleDateString()}
                      {match.score && ` • ${match.score}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Planning */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Planning</h2>
            <Link
              href="/dashboard/admin/teams/schedule"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </Link>
          </div>

          <div className="space-y-3">
            {matches.filter(m => !m.result && new Date(m.scheduled_at) >= new Date()).length === 0 ? (
              <p className="text-center text-gray-400 py-12 bg-gray-800/20 rounded-lg border border-gray-800/50">No matches scheduled</p>
            ) : (
              matches.filter(m => !m.result && new Date(m.scheduled_at) >= new Date()).slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="group flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-800 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold text-white">
                        {match.teams?.name || teams.find(t => t.id === match.team_id)?.name} vs {match.opponent}
                      </p>
                      <span className="px-2.5 py-1 text-xs rounded-lg font-semibold border bg-blue-500/20 text-blue-400 border-blue-500/30">
                        SCHEDULED
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(match.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals would go here - simplified for now */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Add Team</h3>
            <p className="text-gray-400 mb-4">Team creation form would go here</p>
            <button
              onClick={() => setShowTeamModal(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Add Match</h3>
            <p className="text-gray-400 mb-4">Match creation form would go here</p>
            <button
              onClick={() => setShowMatchModal(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
