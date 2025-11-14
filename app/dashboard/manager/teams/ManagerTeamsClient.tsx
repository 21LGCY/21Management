'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Map, MessageSquare, LayoutDashboard, Users, Clock, TrendingUp, Target, Activity, Award } from 'lucide-react'
import Link from 'next/link'
import SchedulePreview from '@/components/SchedulePreview'
import StratMapSelection from './sections/StratMapSelection'
import PraccsReviewSelection from './sections/PraccsReviewSelection'
import { createClient } from '@/lib/supabase/client'
import { TryoutWeek, TeamCategory } from '@/lib/types/database'

interface ManagerTeamsClientProps {
  teamId: string
  teamName: string
  playerCount: number
  tryouts: any[]
  teamCategory: TeamCategory
}

type TabType = 'overview' | 'strat_map' | 'review_praccs'

export default function ManagerTeamsClient({ teamId, teamName, playerCount, tryouts, teamCategory }: ManagerTeamsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [currentTryouts, setCurrentTryouts] = useState<TryoutWeek[]>([])
  const [loadingTryouts, setLoadingTryouts] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentTryouts()
  }, [teamCategory])

  const fetchCurrentTryouts = async () => {
    try {
      const { data, error } = await supabase
        .from('tryout_weeks')
        .select('*')
        .eq('team_category', teamCategory)
        .in('status', ['scheduled', 'in_progress'])
        .order('week_start', { ascending: true })
        .limit(3)

      if (error) throw error
      setCurrentTryouts(data || [])
    } catch (error) {
      console.error('Error fetching tryouts:', error)
    } finally {
      setLoadingTryouts(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Team & Roster Management
        </h1>
        <p className="text-gray-400">Manage {teamName || 'your team'}, schedules, and tryouts</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('strat_map')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
              activeTab === 'strat_map'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Strat Maps
          </button>
          <button
            onClick={() => setActiveTab('review_praccs')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
              activeTab === 'review_praccs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Practice Reviews
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Team Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-dark border border-primary/40 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-primary/30 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-primary/70 mb-1">Total Players</p>
              <p className="text-3xl font-bold text-primary">{playerCount}</p>
              <Link href="/dashboard/manager/players" className="text-xs text-primary/70 hover:text-primary mt-2 inline-block">
                View all →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-sm text-green-300/70 mb-1">Active Tryouts</p>
              <p className="text-3xl font-bold text-green-400">{currentTryouts.length}</p>
              <Link href="/dashboard/manager/teams/tryouts" className="text-xs text-green-300/70 hover:text-green-400 mt-2 inline-block">
                Manage →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-blue-300/70 mb-1">Schedule</p>
              <p className="text-3xl font-bold text-blue-400">Week</p>
              <Link href="/dashboard/manager/teams/schedule" className="text-xs text-blue-300/70 hover:text-blue-400 mt-2 inline-block">
                View schedule →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-dark border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-purple-300/70 mb-1">Team Performance</p>
              <p className="text-3xl font-bold text-purple-400">-</p>
              <Link href="/dashboard/manager/stats" className="text-xs text-purple-300/70 hover:text-purple-400 mt-2 inline-block">
                View stats →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/manager/teams/schedule">
              <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition-all group hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-primary transition">Schedule</p>
                    <p className="text-sm text-gray-400">Manage team schedule</p>
                  </div>
                </div>
              </button>
            </Link>

            <Link href="/dashboard/manager/teams/tryouts">
              <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition-all group hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-primary transition">Manage Tryouts</p>
                    <p className="text-sm text-gray-400">Scout new talent</p>
                  </div>
                </div>
              </button>
            </Link>

            <Link href="/dashboard/manager/players">
              <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition-all group hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-primary transition">Player Roster</p>
                    <p className="text-sm text-gray-400">View team members</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Weekly Schedule Preview */}
            {teamId && <SchedulePreview teamId={teamId} />}

            {/* Recent Tryouts */}
            <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Active Tryout Sessions</h2>
                  <p className="text-sm text-gray-400">Current and upcoming tryout weeks</p>
                </div>
                <Link href="/dashboard/manager/teams/tryouts">
                  <button className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition text-sm shadow-lg shadow-primary/20">
                    View All
                  </button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {loadingTryouts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : currentTryouts && currentTryouts.length > 0 ? (
                  currentTryouts.map((tryout) => (
                    <Link
                      key={tryout.id}
                      href={`/dashboard/manager/teams/tryouts/${tryout.id}`}
                      className="block p-5 bg-gradient-to-br from-dark to-dark-card rounded-xl border border-gray-800 hover:border-primary transition-all group hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-primary transition mb-2">
                            {tryout.week_label}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{formatDateRange(tryout.week_start, tryout.week_end)}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(tryout.status)}`}>
                          {tryout.status === 'in_progress' ? 'In Progress' : tryout.status.charAt(0).toUpperCase() + tryout.status.slice(1)}
                        </span>
                      </div>
                      {tryout.notes && (
                        <p className="text-sm text-gray-400 line-clamp-2 mt-3 pt-3 border-t border-gray-800">{tryout.notes}</p>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No tryouts scheduled</p>
                    <Link href="/dashboard/manager/teams/tryouts">
                      <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                        Create Tryout
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'strat_map' && (
        <StratMapSelection teamId={teamId} />
      )}

      {activeTab === 'review_praccs' && (
        <PraccsReviewSelection teamId={teamId} />
      )}
    </div>
  )
}
