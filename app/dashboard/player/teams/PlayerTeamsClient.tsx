'use client'

import { useState, useEffect } from 'react'
import { Calendar, Map, MessageSquare, Users, Shield, Star, Trophy, Clock, Activity } from 'lucide-react'
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

  const PlayerCard = ({ player, isCurrentPlayer }: { player: Player, isCurrentPlayer: boolean }) => (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        isCurrentPlayer 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 shadow-lg shadow-primary/10' 
          : 'bg-dark border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {player.avatar_url ? (
            <img 
              src={player.avatar_url} 
              alt={player.in_game_name || player.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCurrentPlayer ? 'bg-primary/30' : 'bg-gray-700'
            }`}>
              <Users className={`w-5 h-5 ${isCurrentPlayer ? 'text-primary' : 'text-gray-400'}`} />
            </div>
          )}
          {isCurrentPlayer && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white" fill="currentColor" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isCurrentPlayer ? 'text-primary' : 'text-white'}`}>
              {player.in_game_name || player.username}
            </p>
            {player.is_igl && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-medium">
                IGL
              </span>
            )}
            {isCurrentPlayer && (
              <span className="px-2 py-0.5 bg-primary/30 text-primary text-xs rounded font-medium">
                You
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{player.full_name}</p>
        </div>
      </div>
      <div className="text-right">
        {player.position && (
          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
            isCurrentPlayer 
              ? 'bg-primary/20 text-primary' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {player.position}
          </span>
        )}
        {player.rank && (
          <p className="text-xs text-gray-400 mt-1">{player.rank}</p>
        )}
      </div>
    </div>
  )

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
          {/* Main Roster */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-green-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">Main Roster</h2>
                <p className="text-sm text-gray-400">{mainRoster.length} players</p>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mainRoster.length > 0 ? (
                mainRoster.map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    isCurrentPlayer={player.id === currentPlayerId}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No main roster players</p>
                </div>
              )}
            </div>
          </div>

          {/* Substitutes & Staff */}
          <div className="space-y-6">
            {/* Substitutes */}
            <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-orange-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Substitutes</h2>
                  <p className="text-sm text-gray-400">{substitutes.length} players</p>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {substitutes.length > 0 ? (
                  substitutes.map(player => (
                    <PlayerCard 
                      key={player.id} 
                      player={player} 
                      isCurrentPlayer={player.id === currentPlayerId}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No substitute players</p>
                  </div>
                )}
              </div>
            </div>

            {/* Staff */}
            <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-purple-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Staff</h2>
                  <p className="text-sm text-gray-400">{staffMembers.length} members</p>
                </div>
              </div>
              <div className="space-y-2">
                {staffMembers.length > 0 ? (
                  staffMembers.map(staff => (
                    <div 
                      key={staff.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-dark border-gray-800 hover:border-gray-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{staff.username}</p>
                          <p className="text-sm text-gray-400">{staff.full_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
                          {staff.staff_role || 'Manager'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No staff members</p>
                  </div>
                )}
              </div>
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
