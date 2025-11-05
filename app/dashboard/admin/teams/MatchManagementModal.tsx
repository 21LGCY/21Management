'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, MatchHistory } from '@/lib/types/database'
import { X, Trophy, Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface MatchManagementModalProps {
  teams: Team[]
  onClose: () => void
  onSuccess: () => void
}

export default function MatchManagementModal({ teams, onClose, onSuccess }: MatchManagementModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [matches, setMatches] = useState<MatchHistory[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  useEffect(() => {
    if (selectedTeamId) {
      fetchMatches()
    } else {
      setMatches([])
    }
  }, [selectedTeamId])

  const fetchMatches = async () => {
    if (!selectedTeamId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('match_history')
        .select('*')
        .eq('team_id', selectedTeamId)
        .order('match_date', { ascending: false })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? All player statistics will also be deleted.')) return

    try {
      const { error } = await supabase
        .from('match_history')
        .delete()
        .eq('id', matchId)

      if (error) throw error
      setMatches(matches.filter(m => m.id !== matchId))
      onSuccess()
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Failed to delete match')
    }
  }

  const matchStats = matches.length > 0 ? {
    total: matches.length,
    wins: matches.filter(m => m.result === 'win').length,
    losses: matches.filter(m => m.result === 'loss').length,
    winRate: matches.length > 0 
      ? Math.round((matches.filter(m => m.result === 'win').length / matches.length) * 100)
      : 0
  } : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-dark-card border border-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Match Management</h2>
            <p className="text-gray-400 mt-1">View and manage team matches</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Team Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
            >
              <option value="">Choose a team...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} - {team.game}
                </option>
              ))}
            </select>
          </div>

          {/* Match Stats Overview */}
          {selectedTeamId && matchStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{matchStats.total}</p>
              </div>
              <div className="bg-dark rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Wins</p>
                <p className="text-2xl font-bold text-green-400">{matchStats.wins}</p>
              </div>
              <div className="bg-dark rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Losses</p>
                <p className="text-2xl font-bold text-red-400">{matchStats.losses}</p>
              </div>
              <div className="bg-dark rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-primary">{matchStats.winRate}%</p>
              </div>
            </div>
          )}

          {/* Matches List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !selectedTeamId ? (
            <div className="text-center py-12 text-gray-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a team to view their matches</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-dark rounded-lg border border-gray-700">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No matches recorded yet</p>
              <p className="text-gray-500 text-sm">Use "Record Match" to add match results</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">All Matches ({matches.length})</p>
                {selectedTeamId && (
                  <Link
                    href={`/dashboard/admin/teams/view/${selectedTeamId}/matches`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 rounded-lg transition font-medium"
                  >
                    View All Matches
                  </Link>
                )}
              </div>
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-dark border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {new Date(match.match_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {match.match_type && (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                            {match.match_type}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                          match.result === 'win'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : match.result === 'loss'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {match.result?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {selectedTeam?.name} vs {match.opponent_name}
                        </p>
                        <span className="text-lg font-bold text-white">
                          <span className={match.result === 'win' ? 'text-green-400' : ''}>{match.our_score}</span>
                          <span className="text-gray-500 mx-1">-</span>
                          <span className={match.result === 'loss' ? 'text-red-400' : ''}>{match.opponent_score}</span>
                        </span>
                        {match.map_name && (
                          <span className="text-sm text-gray-400">• {match.map_name}</span>
                        )}
                      </div>
                      {match.notes && (
                        <p className="text-sm text-gray-400 mt-2">{match.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/dashboard/admin/teams/view/${selectedTeamId}/matches/${match.id}`}>
                        <button 
                          className="p-2 text-primary hover:bg-primary/10 rounded transition"
                          title="View Stats"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/admin/teams/view/${selectedTeamId}/matches/${match.id}/edit`}>
                        <button 
                          className="p-2 text-gray-400 hover:bg-gray-700 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
