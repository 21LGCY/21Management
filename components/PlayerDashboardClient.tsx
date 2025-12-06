'use client'

import { useTranslations } from 'next-intl'
import NavbarWrapper from '@/components/NavbarWrapper'
import Link from 'next/link'
import { Trophy, Calendar, Target, TrendingUp, Users, Activity, Clock } from 'lucide-react'
import { UserRole } from '@/lib/types/database'

interface Match {
  id: string
  opponent: string
  scheduled_at: string
  result?: string
  score?: string
  teams?: { name: string }
  tournaments?: { name: string }
}

interface PlayerData {
  full_name?: string
  teams?: { name: string; game: string }
}

interface PlayerDashboardClientProps {
  user: {
    role: UserRole
    username: string
    user_id: string
    avatar_url?: string | null
  }
  playerData: PlayerData | null
  upcomingMatches: Match[]
  recentMatches: Match[]
  winRate: number
  totalMatches: number
}

export default function PlayerDashboardClient({
  user,
  playerData,
  upcomingMatches,
  recentMatches,
  winRate,
  totalMatches
}: PlayerDashboardClientProps) {
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const tMatches = useTranslations('matches')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('welcome')}, <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">{playerData?.full_name || user.username}</span>
          </h1>
          <p className="text-lg text-gray-400">{t('playerSubtitle', { team: playerData?.teams?.name || tNav('team') })}</p>
        </div>

        {/* Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-dark border border-primary/40 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-primary/30 rounded-lg">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-primary/70 mb-1">{t('yourTeam')}</p>
            <p className="text-2xl font-bold text-primary truncate">{playerData?.teams?.name || tCommon('notAssigned')}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-300/70 mb-1">{t('winRate')}</p>
            <p className="text-2xl font-bold text-green-400">{winRate}%</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-blue-300/70 mb-1">{t('matchesPlayed')}</p>
            <p className="text-2xl font-bold text-blue-400">{totalMatches}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-yellow-300/70 mb-1">{t('upcomingMatches')}</p>
            <p className="text-2xl font-bold text-yellow-400">{upcomingMatches?.length || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/player/stats">
            <button className="w-full p-4 bg-gradient-to-br from-dark-card via-dark-card to-purple-500/5 border border-gray-800 hover:border-purple-500/50 rounded-xl text-left transition-all group hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition border border-purple-500/30">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-purple-300 transition">{t('viewStatistics')}</p>
                  <p className="text-sm text-gray-400">{t('performanceMetrics')}</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/player/teams">
            <button className="w-full p-4 bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 hover:border-blue-500/50 rounded-xl text-left transition-all group hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition border border-blue-500/30">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-blue-300 transition">{tNav('teamHub')}</p>
                  <p className="text-sm text-gray-400">{t('rosterScheduleStrats')}</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/player/availability">
            <button className="w-full p-4 bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 hover:border-green-500/50 rounded-xl text-left transition-all group hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition border border-green-500/30">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-green-300 transition">{t('myAvailability')}</p>
                  <p className="text-sm text-gray-400">{t('manageWeeklySchedule')}</p>
                </div>
              </div>
            </button>
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">{t('upcomingMatches')}</h2>
                <p className="text-sm text-gray-400">{t('scheduledGames')}</p>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-gradient-to-br from-dark to-dark-card rounded-xl border border-gray-800 hover:border-primary transition-all group hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white group-hover:text-primary transition">
                          {match.teams?.name} vs {match.opponent}
                        </p>
                        {match.tournaments && (
                          <p className="text-sm text-primary mt-1">
                            {match.tournaments.name}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                        {t('scheduled')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        {new Date(match.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">{t('noUpcomingMatches')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('scheduleNextGame')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">{t('recentResults')}</h2>
                <p className="text-sm text-gray-400">{t('lastMatches', { count: 5 })}</p>
              </div>
              <Trophy className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentMatches && recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-gradient-to-br from-dark to-dark-card rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-white">
                        {match.teams?.name} vs {match.opponent}
                      </p>
                      {match.result && (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            match.result === 'win'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : match.result === 'loss'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {match.result === 'win' ? tMatches('win').toUpperCase() : 
                           match.result === 'loss' ? tMatches('loss').toUpperCase() : 
                           tMatches('draw').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {new Date(match.scheduled_at).toLocaleDateString()}
                      </p>
                      {match.score && (
                        <p className="text-sm font-medium text-gray-300">{match.score}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">{t('noMatchHistory')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('resultsAppearHere')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
