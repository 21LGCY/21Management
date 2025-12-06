'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchHistory } from '@/lib/types/database'
import Link from 'next/link'
import { MessageSquare, Calendar, Trophy, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PraccsReviewSelectionProps {
  teamId: string
}

export default function PraccsReviewSelection({ teamId }: PraccsReviewSelectionProps) {
  const [matches, setMatches] = useState<MatchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('practiceReviews')
  const tMatches = useTranslations('matches')
  
  const supabase = createClient()

  useEffect(() => {
    fetchPraccsMatches()
  }, [teamId])

  const fetchPraccsMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('match_history')
        .select('*')
        .eq('team_id', teamId)
        .in('match_type', ['Scrim', 'Other']) // Assuming 'Other' can be praccs
        .order('match_date', { ascending: false })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error fetching praccs matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'win': return 'text-green-400'
      case 'loss': return 'text-red-400'
      case 'draw': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getResultLabel = (result?: string) => {
    switch (result) {
      case 'win': return t('victory')
      case 'loss': return t('defeat')
      case 'draw': return t('draw')
      default: return t('noResult')
    }
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
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
            <p className="text-gray-400 text-sm">{t('description')}</p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">{t('noPracticeMatches')}</p>
            <p className="text-gray-500 text-sm">{t('practiceMatchesWillAppear')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/dashboard/manager/teams/review-praccs/${match.id}`}
                className="group bg-dark border border-gray-800 hover:border-primary rounded-lg p-4 transition-all duration-300 hover:scale-105"
              >
                <div className="space-y-3">
                  {/* Header: Date & Type */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(match.match_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                      {match.match_type === 'Scrim' ? tMatches('scrim') : t('practice')}
                    </span>
                  </div>

                  {/* Opponent */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition">
                      {tMatches('vs')} {match.opponent_name}
                    </h3>
                  </div>

                  {/* Score & Result */}
                  <div className="flex items-center justify-between">
                    {match.our_score !== null && match.opponent_score !== null ? (
                      <div className="flex items-center gap-2">
                        <Trophy className={`w-4 h-4 ${getResultColor(match.result)}`} />
                        <span className="text-lg font-bold text-white">
                          {match.our_score} - {match.opponent_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{t('noScoreRecorded')}</span>
                    )}
                    
                    {match.result && (
                      <span className={`text-sm font-medium ${getResultColor(match.result)}`}>
                        {getResultLabel(match.result)}
                      </span>
                    )}
                  </div>

                  {/* Map */}
                  {match.map_name && (
                    <div className="pt-2 border-t border-gray-800">
                      <span className="text-xs text-gray-400">{tMatches('map')}: </span>
                      <span className="text-xs text-gray-300 font-medium">{match.map_name}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
