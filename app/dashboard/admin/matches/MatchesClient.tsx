'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, MatchHistoryWithStats } from '@/lib/types/database'
import { Trophy, Calendar, Search, Eye, Edit, Trash2, Filter, Plus } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'

interface MatchesClientProps {
  teams: Team[]
}

type FilterType = 'all' | 'wins' | 'losses' | 'draws'

export default function MatchesClient({ teams }: MatchesClientProps) {
  const supabase = createClient()
  const t = useTranslations('matches')
  const tCommon = useTranslations('common')
  const [matches, setMatches] = useState<MatchHistoryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('match_history')
        .select(`
          *,
          team:teams(name, tag)
        `)
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
    if (!confirm(t('confirmDeleteWithStats'))) return

    try {
      const { error } = await supabase
        .from('match_history')
        .delete()
        .eq('id', matchId)

      if (error) throw error
      setMatches(matches.filter(m => m.id !== matchId))
    } catch (error) {
      console.error('Error deleting match:', error)
      alert(t('failedDelete'))
    }
  }

  const filteredMatches = matches.filter(match => {
    // Team filter
    if (selectedTeam !== 'all' && match.team_id !== selectedTeam) return false
    
    // Result filter
    if (filterType !== 'all' && match.result !== filterType.slice(0, -1)) return false
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        match.opponent_name.toLowerCase().includes(search) ||
        match.map_name?.toLowerCase().includes(search) ||
        match.match_type?.toLowerCase().includes(search) ||
        (match.team as any)?.name.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  const stats = {
    total: matches.length,
    wins: matches.filter(m => m.result === 'win').length,
    losses: matches.filter(m => m.result === 'loss').length,
    draws: matches.filter(m => m.result === 'draw').length,
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">{t('totalMatches')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
              <p className="text-sm text-gray-400">{t('wins')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-card via-dark-card to-red-500/5 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
              <p className="text-sm text-gray-400">{t('losses')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-card via-dark-card to-yellow-500/5 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
              <p className="text-sm text-gray-400">{t('draws')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tCommon('search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('selectTeam')}</label>
            <CustomSelect
              value={selectedTeam}
              onChange={(value) => setSelectedTeam(value)}
              options={[
                { value: 'all', label: t('allTeams') },
                ...teams.map((team) => ({ value: team.id, label: team.name }))
              ]}
              className="min-w-[180px]"
            />
          </div>

          {/* Result Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('result')}</label>
            <CustomSelect
              value={filterType}
              onChange={(value) => setFilterType(value as FilterType)}
              options={[
                { value: 'all', label: t('allMatches') },
                { value: 'wins', label: t('wins') },
                { value: 'losses', label: t('losses') },
                { value: 'draws', label: t('draws') }
              ]}
              className="min-w-[160px]"
            />
          </div>
        </div>

        {/* Record Match Button */}
        <div className="mt-4 flex justify-end">
          <Link
            href="/dashboard/admin/matches/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110"
          >
            <Plus className="w-5 h-5" />
            {t('recordStats')}
          </Link>
        </div>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {t('noMatches')}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <p className="text-sm text-gray-400">
              {t('showingOfMatches', { count: filteredMatches.length, total: matches.length })}
            </p>
          </div>

          <div className="divide-y divide-gray-800">
            {filteredMatches.map((match) => {
              const team = match.team as any
              return (
                <div
                  key={match.id}
                  className="p-6 hover:bg-gray-800/30 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                        <span className={`px-3 py-1 text-xs rounded-lg font-semibold border ${
                          match.result === 'win'
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : match.result === 'loss'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        }`}>
                          {match.result?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-400 font-medium">
                          {team?.name || t('unknownTeam')}
                        </span>
                        <span className="text-white font-semibold text-lg">vs</span>
                        <p className="text-white font-semibold text-lg">{match.opponent_name}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-white">
                          <span className={match.result === 'win' ? 'text-green-400' : ''}>{match.our_score}</span>
                          <span className="text-gray-500 mx-2">-</span>
                          <span className={match.result === 'loss' ? 'text-red-400' : ''}>{match.opponent_score}</span>
                        </span>
                        {match.map_name && (
                          <span className="text-sm text-gray-400 px-3 py-1 bg-gray-800 rounded-lg">
                            {match.map_name}
                          </span>
                        )}
                      </div>

                      {match.notes && (
                        <p className="text-sm text-gray-400 mt-3 border-l-2 border-gray-700 pl-3">{match.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/dashboard/admin/matches/${match.id}`}>
                        <button
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                          title={t('viewDetails')}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title={tCommon('delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
