'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, Users, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TryoutWeek, PlayerAvailability, TeamCategory } from '@/lib/types/database'
import Link from 'next/link'
import ActionButton from '@/components/ActionButton'
import { useTranslations } from 'next-intl'

type TryoutWeekWithStats = TryoutWeek & {
  availabilities?: PlayerAvailability[]
  stats?: {
    total: number
    responded: number
    pending: number
  }
}

export default function TryoutWeeks() {
  const [allTryoutWeeks, setAllTryoutWeeks] = useState<TryoutWeekWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<TeamCategory>('21L')
  const supabase = createClient()
  const t = useTranslations('tryouts')
  const tCommon = useTranslations('common')

  useEffect(() => {
    fetchTryoutWeeks()
  }, [])

  const fetchTryoutWeeks = async () => {
    setLoading(true)
    try {
      // Fetch ALL tryout weeks at once
      const { data: weeks, error: weeksError } = await supabase
        .from('tryout_weeks')
        .select('*')
        .order('week_start', { ascending: false })

      if (weeksError) throw weeksError

      // Fetch all availabilities for these weeks
      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map(w => w.id)
        const { data: availabilities, error: availError } = await supabase
          .from('player_availabilities')
          .select(`
            *,
            player:profiles_tryouts(*)
          `)
          .in('tryout_week_id', weekIds)

        if (availError) throw availError

        // Combine data and calculate stats
        const weeksWithStats = weeks.map(week => {
          const weekAvailabilities = (availabilities || []).filter(
            a => a.tryout_week_id === week.id
          )

          const responded = weekAvailabilities.filter(a => hasResponded(a)).length
          const total = weekAvailabilities.length
          const pending = total - responded

          return {
            ...week,
            availabilities: weekAvailabilities,
            stats: { total, responded, pending }
          }
        })

        setAllTryoutWeeks(weeksWithStats)
      } else {
        setAllTryoutWeeks([])
      }
    } catch (error) {
      console.error('Error fetching tryout weeks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter weeks client-side based on selected team
  const tryoutWeeks = allTryoutWeeks.filter(week => week.team_category === selectedTeam)

  const hasResponded = (availability: PlayerAvailability): boolean => {
    const slots = availability.time_slots || {}
    return Object.keys(slots).length > 0 && 
           Object.values(slots).some(day => Object.values(day || {}).length > 0)
  }

  const getTeamLabel = (team: TeamCategory) => {
    switch (team) {
      case '21L': return '21L'
      case '21GC': return '21GC'
      case '21ACA': return '21 ACA'
      case '21CS2': return '21 CS2'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">{tCommon('loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Calendar className="w-6 h-6 text-primary" />
            {t('tryoutWeeks')}
          </h2>
        </div>
        <Link href="/dashboard/admin/tryouts/new">
          <ActionButton icon={Plus}>
            {t('addTryoutWeek')}
          </ActionButton>
        </Link>
      </div>

      {/* Team Selector */}
      <div className="flex gap-3 flex-wrap">
        {(['21L', '21GC', '21ACA', '21CS2'] as TeamCategory[]).map((team) => (
          <button
            key={team}
            onClick={() => setSelectedTeam(team)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedTeam === team
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                : 'bg-dark-card border border-gray-800 text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {getTeamLabel(team)}
          </button>
        ))}
      </div>

      {/* Tryout Weeks List */}
      {tryoutWeeks.length === 0 ? (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-12 text-center shadow-xl">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{t('noTryoutWeeks')}</h3>
          <p className="text-gray-400 mb-6">{t('createFirstWeek')}</p>
          <Link href="/dashboard/admin/tryouts/new">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all mx-auto shadow-lg hover:shadow-primary/20 font-semibold">
              <Plus className="w-4 h-4" />
              <span>{tCommon('create')}</span>
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {tryoutWeeks.map((week) => (
            <Link
              key={week.id}
              href={`/dashboard/admin/tryouts/${week.id}`}
              className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer block group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {week.week_label || `Session ${formatDateRange(week.week_start, week.week_end)}`}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(week.status)}`}>
                      {week.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDateRange(week.week_start, week.week_end)}
                  </div>
                  {week.notes && (
                    <p className="text-gray-400 text-sm mt-2">{week.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  {week.stats?.total || 0} {t('players')}
                </div>
              </div>

              {/* Availability Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-green-400">{week.stats?.responded || 0}</div>
                    <div className="text-xs text-gray-400">{t('responded')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{week.stats?.pending || 0}</div>
                    <div className="text-xs text-gray-400">{t('pending')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {week.stats?.responded || 0}/{week.stats?.total || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('responseRate')}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

