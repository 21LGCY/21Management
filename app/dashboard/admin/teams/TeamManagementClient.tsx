'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, Match } from '@/lib/types/database'
import { Plus, Edit, Trash2, Calendar, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export default function TeamManagementClient() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<(Match & { teams: Team })[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      fetchMatches(selectedTeam)
    }
  }, [selectedTeam])

  const fetchData = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (teamsError) throw teamsError
      setTeams(teamsData || [])
      
      if (teamsData && teamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsData[0].id)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, teams(*)')
        .eq('team_id', teamId)
        .order('scheduled_at', { ascending: false })
        .limit(10)

      if (error) throw error
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
      if (selectedTeam === id) {
        setSelectedTeam(teams[0]?.id || null)
      }
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

  const stats = calculateStats()
  const selectedTeamData = teams.find(t => t.id === selectedTeam)

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Teams List */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Teams</h2>
          <Link
            href="/dashboard/admin/teams/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Team
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                selectedTeam === team.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-dark border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  <p className="text-sm text-gray-400">{team.game}</p>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/dashboard/admin/teams/${team.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-primary hover:bg-primary/10 rounded transition"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTeam(team.id)
                    }}
                    className="p-1 text-red-400 hover:bg-red-400/10 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Team Details */}
      {selectedTeamData && (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Wins</p>
                  <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Losses</p>
                  <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Draws</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Matches Schedule */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Match Schedule</h2>
              <button
                onClick={() => setShowMatchModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Match
              </button>
            </div>

            <div className="space-y-3">
              {matches.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No matches scheduled</p>
              ) : (
                matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-dark rounded-lg border border-gray-800 hover:border-gray-700 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-white">
                          {selectedTeamData.name} vs {match.opponent}
                        </p>
                        {match.result && (
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            match.result === 'win' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            match.result === 'loss' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            {match.result.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(match.scheduled_at).toLocaleString()}
                        {match.score && ` • ${match.score}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

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
