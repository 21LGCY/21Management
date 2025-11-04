'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory } from '@/lib/types/database'
import { ArrowLeft, Plus, Calendar, Trophy, TrendingUp, TrendingDown, Edit, Trash2, Target } from 'lucide-react'
import Link from 'next/link'

interface MatchesListClientProps {
  teamId: string
  teamName: string
}

export default function MatchesListClient({ teamId, teamName }: MatchesListClientProps) {
  const [matches, setMatches] = useState<MatchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchMatches()
  }, [teamId])

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('match_history')
        .select('*')
        .eq('team_id', teamId)
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
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Failed to delete match')
    }
  }

  const filteredMatches = filter === 'all' 
    ? matches 
    : matches.filter(m => m.result === filter)

  const stats = {
    total: matches.length,
    wins: matches.filter(m => m.result === 'win').length,
    losses: matches.filter(m => m.result === 'loss').length,
    draws: matches.filter(m => m.result === 'draw').length,
    winRate: matches.length > 0 
      ? Math.round((matches.filter(m => m.result === 'win').length / matches.length) * 100)
      : 0
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/admin/teams/view/${teamId}`}>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{teamName} - Matches</h1>
            <p className="text-gray-400 mt-1">View and manage all match history</p>
          </div>
        </div>

        <Link
          href={`/dashboard/admin/teams/view/${teamId}/matches/new`}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Match
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Matches</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Trophy className="w-8 h-8 text-gray-400" />
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
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Draws</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-primary">{stats.winRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('win')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'win'
              ? 'bg-green-500 text-white'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          Wins
        </button>
        <button
          onClick={() => setFilter('loss')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'loss'
              ? 'bg-red-500 text-white'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          Losses
        </button>
        <button
          onClick={() => setFilter('draw')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'draw'
              ? 'bg-yellow-500 text-white'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          Draws
        </button>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        {new Date(match.match_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {match.match_type && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {match.match_type}
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm rounded-lg font-medium ${
                      match.result === 'win'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : match.result === 'loss'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {match.result.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {teamName} <span className="text-primary">{match.our_score}</span>
                      <span className="text-gray-500 mx-2">-</span>
                      <span className={match.result === 'win' ? 'text-red-400' : 'text-primary'}>
                        {match.opponent_score}
                      </span> {match.opponent_name}
                    </h3>
                  </div>

                  {match.map_name && (
                    <p className="text-sm text-gray-400">Map: {match.map_name}</p>
                  )}

                  {match.notes && (
                    <p className="text-sm text-gray-400 mt-2">{match.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Link href={`/dashboard/admin/teams/view/${teamId}/matches/${match.id}`}>
                    <button 
                      className="p-2 text-primary hover:bg-primary/10 rounded transition"
                      title="View Stats"
                    >
                      <Target className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href={`/dashboard/admin/teams/view/${teamId}/matches/${match.id}/edit`}>
                    <button 
                      className="p-2 text-gray-400 hover:bg-gray-700 rounded transition"
                      title="Edit Match"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                    title="Delete Match"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-dark-card border border-gray-800 rounded-lg">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {matches.length === 0 
                ? 'No matches recorded yet' 
                : `No ${filter} matches found`}
            </p>
            <p className="text-gray-500 mb-4">
              {matches.length === 0
                ? 'Start tracking team performance by adding the first match'
                : 'Try selecting a different filter'}
            </p>
            {matches.length === 0 && (
              <Link
                href={`/dashboard/admin/teams/view/${teamId}/matches/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add First Match
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
