'use client'

import { useState, useEffect } from 'react'
import { Calendar, Map, MessageSquare, Users, Star, Trophy, Clock, Briefcase, ArrowRight, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StratMapSelection from './sections/StratMapSelection'
import PraccsReviewSelection from './sections/PraccsReviewSelection'
import ActionButton from '@/components/ActionButton'

interface Player {
  id: string
  username: string
  in_game_name?: string
  full_name?: string
  position?: string
  is_igl?: boolean
  is_substitute?: boolean
  avatar_url?: string
  rank?: string
  staff_role?: string
}

interface PlayerTeamsClientProps {
  teamId: string
  teamName: string
  currentPlayerId: string
  teamPlayers: Player[]
  staffMembers: Player[]
}

type TabType = 'overview' | 'roster' | 'strat_map' | 'review_praccs'

export default function PlayerTeamsClient({ 
  teamId, 
  teamName, 
  currentPlayerId,
  teamPlayers,
  staffMembers
}: PlayerTeamsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  
  const supabase = createClient()

  // Fetch upcoming activities for preview
  useEffect(() => {
    fetchUpcomingActivities()
  }, [teamId])

  const fetchUpcomingActivities = async () => {
    try {
      setLoadingActivities(true)
      
      // Get current date and time
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      // Get next 3 weeks of dates
      const dateRange: string[] = []
      for (let i = 0; i < 21; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dateRange.push(date.toISOString().split('T')[0])
      }

      // Fetch all activities for the team
      const { data, error } = await supabase
        .from('schedule_activities')
        .select('*')
        .eq('team_id', teamId)

      if (error) {
        console.error('Error fetching activities:', error)
        throw error
      }
      
      console.log('Fetched activities:', data)
      
      // Filter and sort activities
      const upcomingActivities = (data || [])
        .filter(activity => {
          // If activity has specific date, check if it's in the next 3 weeks
          if (activity.activity_date) {
            return dateRange.includes(activity.activity_date)
          }
          // For recurring activities, include all
          return true
        })
        .sort((a, b) => {
          // Sort by date if available, otherwise by day of week
          if (a.activity_date && b.activity_date) {
            return a.activity_date.localeCompare(b.activity_date)
          }
          if (a.activity_date) return -1
          if (b.activity_date) return 1
          return a.day_of_week - b.day_of_week
        })
        .slice(0, 3)
      
      console.log('Upcoming activities:', upcomingActivities)
      setUpcomingActivities(upcomingActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const mainRoster = teamPlayers.filter(p => !p.is_substitute)
  const substitutes = teamPlayers.filter(p => p.is_substitute)

  const getDayName = (dayNumber: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayNumber]
  }

  const formatDateShort = (dateStr: string): string => {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      practice: Trophy,
      individual_training: Users,
      group_training: Users,
      official_match: Trophy,
      tournament: Trophy,
      meeting: MessageSquare
    }
    return icons[type] || Calendar
  }

  const getActivityColor = (type: string) => {
    const colors: { [key: string]: string } = {
      practice: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      individual_training: 'bg-green-500/20 text-green-400 border-green-500/30',
      group_training: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      official_match: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      tournament: 'bg-red-500/20 text-red-400 border-red-500/30',
      meeting: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getRankImage = (rank?: string) => {
    if (!rank) return null
    const rankMap: { [key: string]: string } = {
      'Ascendant 1': '/images/asc_1_rank.webp',
      'Ascendant 2': '/images/asc_2_rank.webp',
      'Ascendant 3': '/images/asc_3_rank.webp',
      'Immortal 1': '/images/immo_1_rank.webp',
      'Immortal 2': '/images/immo_2_rank.webp',
      'Immortal 3': '/images/immo_3_rank.webp',
      'Radiant': '/images/rad_rank.webp'
    }
    return rankMap[rank] || null
  }

  const openActivityDetails = (activity: any) => {
    setSelectedActivity(activity)
    setShowActivityModal(true)
  }

  const closeActivityModal = () => {
    setShowActivityModal(false)
    setTimeout(() => setSelectedActivity(null), 300)
  }

  // Player Card Component
  const renderPlayerCard = (player: Player, isCurrentPlayer: boolean) => {
    const rankImage = getRankImage(player.rank)
    
    return (
      <div 
        className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
          isCurrentPlayer 
            ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/40 shadow-lg shadow-primary/10' 
            : 'bg-dark/50 border-gray-800 hover:border-gray-700 hover:bg-dark/70'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            {player.avatar_url ? (
              <img 
                src={player.avatar_url} 
                alt={player.in_game_name || player.username}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-gray-700/50"
              />
            ) : (
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ring-2 ring-gray-700/50 ${
                isCurrentPlayer ? 'bg-primary/30' : 'bg-gray-700'
              }`}>
                <Users className={`w-6 h-6 ${isCurrentPlayer ? 'text-primary' : 'text-gray-400'}`} />
              </div>
            )}
            {isCurrentPlayer && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-dark-card">
                <Star className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-bold text-base truncate ${
                isCurrentPlayer ? 'text-primary' : 'text-white'
              }`}>
                {player.in_game_name || player.username}
              </p>
              {player.is_igl && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-md font-bold border border-yellow-500/30 flex-shrink-0">
                  IGL
                </span>
              )}
              {isCurrentPlayer && (
                <span className="px-2 py-0.5 bg-primary/30 text-primary text-xs rounded-md font-bold border border-primary/30 flex-shrink-0">
                  You
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">{player.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
          {player.position && (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
              isCurrentPlayer 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-gray-800 text-gray-300 border border-gray-700'
            }`}>
              {player.position}
            </span>
          )}
          {rankImage && (
            <div className="flex items-center gap-2 bg-gray-900/50 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <img 
                src={rankImage} 
                alt={player.rank} 
                className="w-6 h-6 object-contain"
              />
              <span className="text-xs font-semibold text-gray-300 hidden sm:inline">{player.rank}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-gradient">{teamName}</span> Team Hub
        </h1>
        <p className="text-gray-400">Schedule, roster, strategies, and practice reviews</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium whitespace-nowrap ${
              activeTab === 'roster'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Roster
          </button>
          <button
            onClick={() => setActiveTab('strat_map')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium whitespace-nowrap ${
              activeTab === 'strat_map'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Strategy Maps
          </button>
          <button
            onClick={() => setActiveTab('review_praccs')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium whitespace-nowrap ${
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
          {/* Schedule Preview Section */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Weekly Schedule</h2>
                <p className="text-sm text-gray-400">Your team's upcoming activities</p>
              </div>
              <Link href="/dashboard/player/teams/schedule">
                <ActionButton icon={ArrowRight}>
                  View Schedule
                </ActionButton>
              </Link>
            </div>

            {loadingActivities ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : upcomingActivities.length > 0 ? (
              <div className="space-y-3">
                {upcomingActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type)
                  const activityColor = getActivityColor(activity.type)
                  
                  return (
                    <div
                      key={activity.id}
                      onClick={() => openActivityDetails(activity)}
                      className="p-4 bg-dark rounded-lg border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            <ActivityIcon className={`w-5 h-5 ${activityColor.includes('text-blue') ? 'text-blue-400' : activityColor.includes('text-green') ? 'text-green-400' : activityColor.includes('text-purple') ? 'text-purple-400' : activityColor.includes('text-yellow') ? 'text-yellow-400' : activityColor.includes('text-red') ? 'text-red-400' : 'text-indigo-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white truncate group-hover:text-primary transition-colors">{activity.title}</h3>
                              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded flex-shrink-0">
                                {activity.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-400 mb-2 line-clamp-1">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {activity.activity_date 
                                    ? formatDateShort(activity.activity_date)
                                    : getDayName(activity.day_of_week)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{activity.time_slot}</span>
                                {activity.duration > 1 && (
                                  <span className="text-xs">({activity.duration}h)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No activities scheduled</p>
                <Link href="/dashboard/player/teams/schedule">
                  <ActionButton icon={Calendar}>
                    View Schedule
                  </ActionButton>
                </Link>
              </div>
            )}

            {upcomingActivities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <p className="text-sm text-gray-500">
                  Showing {upcomingActivities.length} upcoming {upcomingActivities.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-blue-400">{mainRoster.length}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Main Roster</h3>
              <p className="text-gray-400 text-sm">Active players</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-3xl font-bold text-orange-400">{substitutes.length}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Substitutes</h3>
              <p className="text-gray-400 text-sm">Backup players</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-3xl font-bold text-purple-400">{staffMembers.length}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Staff</h3>
              <p className="text-gray-400 text-sm">Coaches & managers</p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Roster - Takes full width on mobile, half on desktop */}
          <div className="lg:col-span-2 bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-7 shadow-xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Main Roster</h2>
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                  {mainRoster.length} Players
                </span>
              </div>
              <p className="text-sm text-gray-500">Active team members</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {mainRoster.length > 0 ? (
                mainRoster.map(player => (
                  <div key={player.id}>
                    {renderPlayerCard(player, player.id === currentPlayerId)}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500 font-medium">No main roster players</p>
                  <p className="text-gray-600 text-sm mt-1">Players will appear here once added</p>
                </div>
              )}
            </div>
          </div>

          {/* Substitutes */}
          <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-7 shadow-xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Substitutes</h2>
                <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-sm font-semibold">
                  {substitutes.length} Players
                </span>
              </div>
              <p className="text-sm text-gray-500">Backup team members</p>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {substitutes.length > 0 ? (
                substitutes.map(player => (
                  <div key={player.id}>
                    {renderPlayerCard(player, player.id === currentPlayerId)}
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500 text-sm font-medium">No substitute players</p>
                  <p className="text-gray-600 text-xs mt-1">Subs will appear here once added</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff */}
          <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-7 shadow-xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Staff</h2>
                <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-semibold">
                  {staffMembers.length} Members
                </span>
              </div>
              <p className="text-sm text-gray-500">Coaching and management team</p>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {staffMembers.length > 0 ? (
                staffMembers.map(staff => (
                  <div 
                    key={staff.id}
                    className="group flex items-center justify-between p-4 rounded-xl border bg-dark/50 border-gray-800 hover:border-gray-700 hover:bg-dark/70 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors ring-2 ring-gray-700/50">
                        <Briefcase className="w-7 h-7 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base">{staff.username}</p>
                        <p className="text-sm text-gray-400">{staff.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold border border-purple-500/30">
                        {staff.staff_role || 'Manager'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500 text-sm font-medium">No staff members</p>
                  <p className="text-gray-600 text-xs mt-1">Staff will appear here once added</p>
                </div>
              )}
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

      {/* Activity Details Modal */}
      {showActivityModal && selectedActivity && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeActivityModal}
        >
          <div 
            className="bg-dark-card border border-gray-700 rounded-xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const ActivityIcon = getActivityIcon(selectedActivity.type)
              const activityColor = getActivityColor(selectedActivity.type)
              
              return (
                <>
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${activityColor.includes('text-blue') ? 'bg-blue-500/20' : activityColor.includes('text-green') ? 'bg-green-500/20' : activityColor.includes('text-purple') ? 'bg-purple-500/20' : activityColor.includes('text-yellow') ? 'bg-yellow-500/20' : activityColor.includes('text-red') ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
                          <ActivityIcon className={`w-6 h-6 ${activityColor.includes('text-blue') ? 'text-blue-400' : activityColor.includes('text-green') ? 'text-green-400' : activityColor.includes('text-purple') ? 'text-purple-400' : activityColor.includes('text-yellow') ? 'text-yellow-400' : activityColor.includes('text-red') ? 'text-red-400' : 'text-indigo-400'}`} />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold text-white mb-2">{selectedActivity.title}</h2>
                          <span className="inline-block px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                            {selectedActivity.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={closeActivityModal}
                        className="text-gray-400 hover:text-white transition-colors ml-4"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4">
                    {/* Time and Date Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {selectedActivity.activity_date 
                            ? formatDateShort(selectedActivity.activity_date)
                            : getDayName(selectedActivity.day_of_week)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{selectedActivity.time_slot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        <span>{selectedActivity.duration} {selectedActivity.duration === 1 ? 'hour' : 'hours'}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedActivity.description && (
                      <div className="pt-4 border-t border-gray-800">
                        <p className="text-gray-300 leading-relaxed">{selectedActivity.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-800">
                    <button
                      onClick={closeActivityModal}
                      className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
