'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, MatchHistory, UserRole } from '@/lib/types/database'
import { ArrowLeft, MessageSquare, Calendar, Trophy } from 'lucide-react'
import Link from 'next/link'
import TeamCommunication from '../../TeamCommunication'
import { useTranslations } from 'next-intl'

interface PraccsReviewClientProps {
  teamId: string
  matchId: string
  userId: string
  userName: string
  userRole: UserRole
}

export default function PraccsReviewClient({ 
  teamId, 
  matchId, 
  userId, 
  userName, 
  userRole 
}: PraccsReviewClientProps) {
  const t = useTranslations('practiceReviews')
  const tMatches = useTranslations('matches')
  const [team, setTeam] = useState<Team | null>(null)
  const [match, setMatch] = useState<MatchHistory | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [teamId, matchId])

  const fetchData = async () => {
    try {
      // Fetch team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError
      setTeam(teamData)

      // Fetch match
      const { data: matchData, error: matchError } = await supabase
        .from('match_history')
        .select('*')
        .eq('id', matchId)
        .single()

      if (matchError) throw matchError
      setMatch(matchData)
    } catch (error) {
      console.error('Error fetching data:', error)
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
      case 'win': return tMatches('win')
      case 'loss': return tMatches('loss')
      case 'draw': return tMatches('draw')
      default: return tMatches('noResult')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!team || !match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{t('matchOrTeamNotFound')}</p>
        <Link
          href={`/dashboard/admin/teams/view/${teamId}`}
          className="text-primary hover:underline"
        >
          {t('backToTeamHub')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Link
          href={`/dashboard/admin/teams/view/${teamId}`}
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-white">{t('practiceReview')}</h1>
              <p className="text-gray-400">{team.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Info Card */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Match Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-white">
              {new Date(match.match_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Opponent */}
          <div>
            <span className="text-gray-400">{tMatches('vs')} </span>
            <span className="text-white font-bold">{match.opponent_name}</span>
          </div>

          {/* Score & Result */}
          {match.our_score !== null && match.opponent_score !== null && (
            <div className="flex items-center gap-3">
              <Trophy className={`w-5 h-5 ${getResultColor(match.result)}`} />
              <span className="text-xl font-bold text-white">
                {match.our_score} - {match.opponent_score}
              </span>
              <span className={`px-2 py-1 text-xs border rounded ${getResultColor(match.result)}`}>
                {getResultLabel(match.result)}
              </span>
            </div>
          )}

          {/* Map */}
          {match.map_name && (
            <div>
              <span className="text-gray-400">{tMatches('map')}: </span>
              <span className="text-white font-medium">{match.map_name}</span>
            </div>
          )}

          {/* Match Type */}
          {match.match_type && (
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
              {match.match_type}
            </span>
          )}
        </div>

        {/* Notes if any */}
        {match.notes && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-1">{tMatches('matchNotes')}</p>
            <p className="text-gray-300">{match.notes}</p>
          </div>
        )}
      </div>

      {/* Communication Component */}
      <TeamCommunication
        teamId={teamId}
        section="review_praccs"
        matchId={matchId}
        userId={userId}
        userName={userName}
        userRole={userRole}
      />
    </div>
  )
}
