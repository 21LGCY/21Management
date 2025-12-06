'use client'

import { useTranslations } from 'next-intl'
import NavbarWrapper from '@/components/NavbarWrapper'
import DashboardSchedulePreview from '@/components/DashboardSchedulePreview'
import Link from 'next/link'
import { Users, Trophy, Calendar, BarChart3, Search, Map } from 'lucide-react'
import { TimezoneOffset } from '@/lib/utils/timezone'
import { UserRole } from '@/lib/types/database'

interface Player {
  id: string
  username: string
  in_game_name?: string
  position?: string
  teams?: { name: string }
}

interface ScheduleActivity {
  id: string
  team_id: string
  type: string
  title: string
  description?: string
  day_of_week: number
  time_slot: string
  duration: number
  activity_date?: string
  teams?: { name: string }
}

interface AdminDashboardClientProps {
  user: {
    role: UserRole
    username: string
    user_id: string
    avatar_url?: string | null
  }
  teamCount: number
  playerCount: number
  tournamentCount: number
  scheduleActivities: ScheduleActivity[]
  players: Player[]
  userTimezone: TimezoneOffset
}

export default function AdminDashboardClient({
  user,
  teamCount,
  playerCount,
  tournamentCount,
  scheduleActivities,
  players,
  userTimezone
}: AdminDashboardClientProps) {
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('welcome')}, <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">{user.username}</span>
          </h1>
          <p className="text-lg text-gray-400">{t('adminSubtitle')}</p>
        </div>

        {/* Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-dark border border-primary/40 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-primary/30 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-primary/70 mb-1">{t('totalTeams')}</p>
            <p className="text-2xl font-bold text-primary">{teamCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-blue-300/70 mb-1">{t('activePlayers')}</p>
            <p className="text-2xl font-bold text-blue-400">{playerCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-300/70 mb-1">{t('scheduledActivities')}</p>
            <p className="text-2xl font-bold text-green-400">{scheduleActivities?.length || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-yellow-300/70 mb-1">{t('tournaments')}</p>
            <p className="text-2xl font-bold text-yellow-400">{tournamentCount || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/admin/users">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-xl text-left transition-all group hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-primary transition">{tNav('players')}</p>
                  <p className="text-xs text-gray-400">{t('managePlayers')}</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/admin/teams">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-xl text-left transition-all group hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Map className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-primary transition">{tNav('teamHub')}</p>
                  <p className="text-xs text-gray-400">{t('stratsSchedules')}</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/admin/statistics">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-xl text-left transition-all group hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-primary transition">{tNav('statistics')}</p>
                  <p className="text-xs text-gray-400">{t('performanceData')}</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/admin/tryouts">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-xl text-left transition-all group hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-primary transition">{tNav('tryouts')}</p>
                  <p className="text-xs text-gray-400">{t('scoutingManagement')}</p>
                </div>
              </div>
            </button>
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Schedule */}
          <DashboardSchedulePreview 
            activities={scheduleActivities || []}
            viewAllLink="/dashboard/admin/teams"
            showTeamName={true}
            userTimezone={userTimezone}
          />

          {/* Players List */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">{t('recentPlayers')}</h2>
                <p className="text-sm text-gray-400">{playerCount || 0} {t('activePlayers').toLowerCase()}</p>
              </div>
              <Link href="/dashboard/admin/users">
                <button className="text-primary hover:text-primary-dark text-sm font-medium">
                  {tCommon('viewAllArrow')}
                </button>
              </Link>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {players && players.length > 0 ? (
                players.slice(0, 5).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-br from-dark to-dark-card rounded-lg border border-gray-800 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{player.in_game_name || player.username}</p>
                        <p className="text-sm text-gray-400">
                          {player.teams?.name || tCommon('noTeam')}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.position && (
                        <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                          {player.position}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">{t('noPlayersYet')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('addPlayersToTeams')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
