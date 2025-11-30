'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Target, Trophy, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { TimezoneOffset, DEFAULT_TIMEZONE, convertTimeSlotToUserTimezone, getTimezoneShort, getDayName } from '@/lib/utils/timezone'

// Activity types with their icons and colors
const activityTypes = {
  practice: { name: 'Practice', icon: Trophy, color: 'text-blue-400' },
  individual_training: { name: 'Individual Training', icon: Users, color: 'text-green-400' },
  group_training: { name: 'Group Training', icon: Users, color: 'text-purple-400' },
  official_match: { name: 'Official Match', icon: Trophy, color: 'text-yellow-400' },
  tournament: { name: 'Tournament', icon: Trophy, color: 'text-red-400' },
  meeting: { name: 'Team Meeting', icon: MessageSquare, color: 'text-indigo-400' }
}

interface ScheduleActivity {
  id: string
  team_id: string
  type: keyof typeof activityTypes
  title: string
  description?: string
  day_of_week: number
  time_slot: string
  duration: number
  created_at: string
}

interface SchedulePreviewProps {
  teamId: string
  userTimezone?: TimezoneOffset
}

export default function SchedulePreview({ teamId, userTimezone = DEFAULT_TIMEZONE }: SchedulePreviewProps) {
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/schedule?team_id=${teamId}`)
        if (response.ok) {
          const data = await response.json()
          // Sort activities by day and time for better display
          const sortedActivities = (data.activities || []).sort((a: ScheduleActivity, b: ScheduleActivity) => {
            if (a.day_of_week !== b.day_of_week) {
              return a.day_of_week - b.day_of_week
            }
            return a.time_slot.localeCompare(b.time_slot)
          })
          setActivities(sortedActivities.slice(0, 5)) // Show only first 5 for preview
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (teamId) {
      fetchActivities()
    }
  }, [teamId])

  if (isLoading) {
    return (
      <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Weekly Schedule</h2>
            <p className="text-sm text-gray-400">Your team's upcoming activities</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Weekly Schedule</h2>
          <p className="text-sm text-gray-400">Your team's upcoming activities</p>
        </div>
        <Link 
          href="/dashboard/manager/teams/schedule"
          className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          Manage Schedule
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const activityType = activityTypes[activity.type]
            const Icon = activityType?.icon || Calendar
            
            return (
              <div
                key={activity.id}
                className="p-4 bg-dark rounded-lg border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <Icon className={`w-5 h-5 ${activityType?.color || 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate group-hover:text-primary transition-colors">{activity.title}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded flex-shrink-0">
                          {activityType?.name || activity.type}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-400 mb-2 line-clamp-1">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{getDayName(activity.day_of_week)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{convertTimeSlotToUserTimezone(activity.time_slot, userTimezone)}</span>
                          <span className="text-xs text-gray-500">({getTimezoneShort(userTimezone)})</span>
                          {activity.duration > 1 && (
                            <span className="text-xs">• {activity.duration}h</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No activities scheduled</p>
            <Link href="/dashboard/manager/teams/schedule">
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                Create Schedule
              </button>
            </Link>
          </div>
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <Link href="/dashboard/manager/teams/schedule">
            <button className="w-full text-center text-sm text-gray-400 hover:text-primary transition-colors">
              View full schedule →
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}