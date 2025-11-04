'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, Match } from '@/lib/types/database'
import { Plus, Edit, Trash2, Calendar, TrendingUp, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import RecordMatchModal from './RecordMatchModal'

export default function TeamManagementClient() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<(Match & { teams: Team })[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showRecordMatchModal, setShowRecordMatchModal] = useState(false)
  
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
              className="p-4 rounded-lg border bg-dark border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex items-center gap-3 mb-2">
                {team.logo_url ? (
                  <Image
                    src={team.logo_url}
                    alt={team.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  <p className="text-sm text-gray-400">{team.game}</p>
                </div>
                <Link
                  href={`/dashboard/admin/teams/view/${team.id}`}
                  className="text-sm font-medium text-primary hover:text-primary-dark transition"
                >
                  VIEW
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planning Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match History */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Match History</h2>
            <button
              onClick={() => setShowRecordMatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
            >
              <Trophy className="w-4 h-4" />
              Record Match
            </button>
          </div>
          <p className="text-center text-gray-400 py-8">Match history will appear here</p>
        </div>

        {/* Planning */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Planning</h2>
            <button
              onClick={() => setShowMatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
            >
              <Calendar className="w-4 h-4" />
              Manage Planning
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
                        {teams.find(t => t.id === match.team_id)?.name} vs {match.opponent}
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
      </div>

      {/* Record Match Modal */}
      {showRecordMatchModal && (
        <RecordMatchModal
          teams={teams}
          onClose={() => setShowRecordMatchModal(false)}
          onSuccess={() => {
            setShowRecordMatchModal(false)
            fetchData()
            fetchAllMatches()
          }}
        />
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
