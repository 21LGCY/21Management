'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, Match } from '@/lib/types/database'
import { Plus, Edit, Trash2, Calendar, TrendingUp, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import RecordMatchModal from './RecordMatchModal'
import MatchManagementModal from './MatchManagementModal'

export default function TeamManagementClient() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<(Match & { teams: Team })[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showRecordMatchModal, setShowRecordMatchModal] = useState(false)
  const [showMatchManagementModal, setShowMatchManagementModal] = useState(false)
  
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
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Teams</h2>
          <Link
            href="/dashboard/admin/teams/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/dashboard/admin/teams/view/${team.id}`}
              className="group p-5 rounded-xl border bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-800 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-2">
                {team.logo_url ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/30 group-hover:border-primary/50 transition-all">
                    <Image
                      src={team.logo_url}
                      alt={team.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-2 border-gray-700 group-hover:border-primary/50 transition-all">
                    <Users className="w-6 h-6 text-gray-400 group-hover:text-primary transition" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-primary transition text-lg">{team.name}</h3>
                  <p className="text-sm text-gray-500">{team.game}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Planning Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match History */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Match History</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowMatchManagementModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-all border border-gray-700 hover:border-gray-600"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Management</span>
              </button>
              <button
                onClick={() => setShowRecordMatchModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Record Match</span>
              </button>
            </div>
          </div>
          <p className="text-center text-gray-400 py-12 bg-gray-800/20 rounded-lg border border-gray-800/50">Match history will appear here</p>
        </div>

        {/* Planning */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Planning</h2>
            <Link
              href="/dashboard/admin/teams/schedule"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </Link>
          </div>

          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-center text-gray-400 py-12 bg-gray-800/20 rounded-lg border border-gray-800/50">No matches scheduled</p>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="group flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-800 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold text-white">
                        {teams.find(t => t.id === match.team_id)?.name} vs {match.opponent}
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
                      {new Date(match.scheduled_at).toLocaleString()}
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

      {/* Match Management Modal */}
      {showMatchManagementModal && (
        <MatchManagementModal
          teams={teams}
          onClose={() => setShowMatchManagementModal(false)}
          onSuccess={() => {
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
