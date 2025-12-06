'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory } from '@/lib/types/database'
import { ArrowLeft, Plus, Calendar, Trophy, TrendingUp, TrendingDown, Edit, Trash2, Eye, Target } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface MatchesListClientProps {
  teamId: string
  teamName: string
}

export default function MatchesListClient({ teamId, teamName }: MatchesListClientProps) {
  const [matches, setMatches] = useState<MatchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all')
  const t = useTranslations('matches')
  const tCommon = useTranslations('common')
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
    if (!confirm(t('confirmDeleteMatchWithStats'))) return

    try {
      const { error } = await supabase
        .from('match_history')
        .delete()
        .eq('id', matchId)

      if (error) throw error
      setMatches(matches.filter(m => m.id !== matchId))
    } catch (error) {
      console.error('Error deleting match:', error)
      alert(t('failedDeleteMatch'))
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Link href="/dashboard/admin/teams">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition flex-shrink-0 group">
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:-translate-x-1 transition-transform" />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent truncate">{teamName} - {t('matches')}</h1>
            <p className="text-gray-400 mt-1">{t('manageMatchHistory')}</p>
          </div>
        </div>

        <Link
          href={`/dashboard/admin/teams/view/${teamId}/matches/new`}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20 flex-shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addMatch')}</span>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">{t('totalMatches')}</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">{t('wins')}</p>
              <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-800 rounded-xl p-5 hover:border-red-500/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">{t('losses')}</p>
              <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-800 rounded-xl p-5 hover:border-yellow-500/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">{t('draws')}</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-800 rounded-xl p-5 hover:border-primary/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">{t('winRate')}</p>
              <p className="text-2xl font-bold text-primary">{stats.winRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
          }`}
        >
          {tCommon('all')}
        </button>
        <button
          onClick={() => setFilter('win')}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
            filter === 'win'
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/20'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
          }`}
        >
          {t('wins')}
        </button>
        <button
          onClick={() => setFilter('loss')}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
            filter === 'loss'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
          }`}
        >
          {t('losses')}
        </button>
        <button
          onClick={() => setFilter('draw')}
          className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
            filter === 'draw'
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg shadow-yellow-500/20'
              : 'bg-dark-card text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
          }`}
        >
          {t('draws')}
        </button>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-400 whitespace-nowrap">
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
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded whitespace-nowrap">
                        {match.match_type}
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm rounded-lg font-medium whitespace-nowrap ${
                      match.result === 'win'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : match.result === 'loss'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {match.result.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-white break-words">
                      <span className="text-white">{teamName}</span>{' '}
                      <span className="text-primary">{match.our_score}</span>
                      <span className="text-gray-500 mx-2">-</span>
                      <span className={match.result === 'win' ? 'text-red-400' : 'text-primary'}>
                        {match.opponent_score}
                      </span>{' '}
                      <span className="text-white">{match.opponent_name}</span>
                    </h3>
                  </div>

                  {match.map_name && (
                    <p className="text-sm text-gray-400 truncate">{t('map')}: {match.map_name}</p>
                  )}

                  {match.notes && (
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{match.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/dashboard/admin/teams/view/${teamId}/matches/${match.id}`}>
                    <button 
                      className="p-2 text-primary hover:bg-primary/10 rounded transition"
                      title={t('viewStats')}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </Link>
                  <Link href={`/dashboard/admin/teams/view/${teamId}/matches/${match.id}/edit`}>
                    <button 
                      className="p-2 text-gray-400 hover:bg-gray-700 rounded transition"
                      title={t('editMatch')}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                    title={t('deleteMatch')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl shadow-xl">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-semibold mb-2">
              {matches.length === 0 
                ? t('noMatchesRecorded')
                : t('noFilteredMatches', { filter })}
            </p>
            <p className="text-gray-500 mb-6">
              {matches.length === 0
                ? t('startTrackingPerformance')
                : t('tryDifferentFilter')}
            </p>
            {matches.length === 0 && (
              <Link
                href={`/dashboard/admin/teams/view/${teamId}/matches/new`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addFirstMatch')}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
