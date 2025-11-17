'use client'

import { useState, useEffect } from 'react'
import { Calendar, Map, MessageSquare, Users, Star, Trophy, Clock, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StratMapSelection from '@/app/dashboard/manager/teams/sections/StratMapSelection'
import PraccsReviewSelection from '@/app/dashboard/manager/teams/sections/PraccsReviewSelection'

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

type TabType = 'schedule' | 'roster' | 'strat_map' | 'review_praccs'

export default function PlayerTeamsClient({ 
  teamId, 
  teamName, 
  currentPlayerId,
  teamPlayers,
  staffMembers
}: PlayerTeamsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('roster')
  const [scheduleActivities, setScheduleActivities] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchSchedule()
    }
  }, [activeTab, teamId])

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_activities')
        .select('*')
        .eq('team_id', teamId)
        .order('day_of_week')
        .order('start_hour')

      if (error) throw error
      setScheduleActivities(data || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const mainRoster = teamPlayers.filter(p => !p.is_substitute)
  const substitutes = teamPlayers.filter(p => p.is_substitute)

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

  const PlayerCard = ({ player, isCurrentPlayer }: { player: Player, isCurrentPlayer: boolean }) => {
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

  const getDayActivities = (day: string) => {
    return scheduleActivities.filter(a => a.day_of_week === day.toLowerCase())
  }

  const formatTime = (hour: number) => {
    return `${hour}:00`
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
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
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
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    isCurrentPlayer={player.id === currentPlayerId}
                  />
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
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    isCurrentPlayer={player.id === currentPlayerId}
                  />
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

      {activeTab === 'schedule' && (
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-white">Team Schedule</h2>
              <p className="text-gray-400 text-sm">Weekly team activities and practice sessions</p>
            </div>
          </div>

          {loadingSchedule ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : scheduleActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const dayActivities = getDayActivities(day)
                return (
                  <div key={day} className="bg-dark border border-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">{day}</h3>
                    {dayActivities.length > 0 ? (
                      <div className="space-y-2">
                        {dayActivities.map((activity, idx) => (
                          <div key={idx} className="bg-primary/10 border border-primary/30 rounded p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3 h-3 text-primary" />
                              <span className="text-xs text-primary font-medium">
                                {formatTime(activity.start_hour)} - {formatTime(activity.end_hour)}
                              </span>
                            </div>
                            <p className="text-sm text-white font-medium">{activity.activity_type}</p>
                            {activity.description && (
                              <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No activities</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No schedule available</p>
              <p className="text-gray-500 text-sm">Your team schedule will appear here</p>
            </div>
          )}
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
