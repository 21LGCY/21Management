'use client'

import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { TimezoneOffset, DEFAULT_TIMEZONE, convertTimeSlotToUserTimezone, getTimezoneShort, getDayName } from '@/lib/utils/timezone'

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

interface DashboardSchedulePreviewProps {
  activities: ScheduleActivity[]
  viewAllLink: string
  showTeamName?: boolean
  emptyMessage?: string
  emptySubMessage?: string
  userTimezone?: TimezoneOffset
}

const getActivityTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    practice: 'bg-blue-500/20 text-blue-400',
    individual_training: 'bg-green-500/20 text-green-400',
    group_training: 'bg-purple-500/20 text-purple-400',
    official_match: 'bg-yellow-500/20 text-yellow-400',
    tournament: 'bg-red-500/20 text-red-400',
    meeting: 'bg-indigo-500/20 text-indigo-400'
  }
  return colors[type] || 'bg-gray-500/20 text-gray-400'
}

export default function DashboardSchedulePreview({ 
  activities, 
  viewAllLink, 
  showTeamName = false,
  emptyMessage,
  emptySubMessage,
  userTimezone = DEFAULT_TIMEZONE
}: DashboardSchedulePreviewProps) {
  const t = useTranslations('schedule')
  const tDays = useTranslations('days')
  const tCommon = useTranslations('common')
  
  // Translate activity type
  const getActivityTypeLabel = (type: string) => {
    const typeKey = type as 'practice' | 'individual_training' | 'group_training' | 'official_match' | 'tournament' | 'meeting'
    return t(`activityTypes.${typeKey}`) || type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }
  
  // Translate day names
  const getTranslatedDayName = (dayOfWeek: number) => {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return tDays(dayKeys[dayOfWeek] as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')
  }

  return (
    <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">{t('title')}</h2>
          <p className="text-sm text-gray-400">
            {showTeamName ? t('plannedActivitiesAllTeams') : t('yourPlannedActivities')}
          </p>
        </div>
        <Link href={viewAllLink} className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-sm font-medium">
          {tCommon('viewAll')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities && activities.length > 0 ? (
          activities.slice(0, 3).map((activity) => (
            <div
              key={activity.id}
              className="p-4 bg-gradient-to-br from-dark to-dark-card rounded-xl border border-gray-800 hover:border-primary transition-all group hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-primary transition">
                    {activity.title}
                  </p>
                  {showTeamName && activity.teams?.name && (
                    <p className="text-xs text-gray-500 mt-0.5">{activity.teams.name}</p>
                  )}
                  {activity.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{activity.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      {activity.activity_date 
                        ? new Date(activity.activity_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : getTranslatedDayName(activity.day_of_week)} at {convertTimeSlotToUserTimezone(activity.time_slot, userTimezone)}
                      <span className="text-xs text-gray-500 ml-1">({getTimezoneShort(userTimezone)})</span>
                      {activity.duration > 1 && ` • ${activity.duration}h`}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 ${getActivityTypeColor(activity.type)} text-xs rounded-lg font-medium whitespace-nowrap`}>
                  {getActivityTypeLabel(activity.type)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">{emptyMessage || t('noActivities')}</p>
            <p className="text-sm text-gray-500 mt-1">{emptySubMessage || t('planSchedule')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
