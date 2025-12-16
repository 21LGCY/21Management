'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, Target, Trophy, Dumbbell, BookOpen, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TimezoneOffset } from '@/lib/types/database'
import { convertTimeSlotToUserTimezone, getTimezoneShort, ORG_TIMEZONE, getDayNumber } from '@/lib/utils/timezone'
import { useTranslations } from 'next-intl'

// Activity types with colors and icons (higher contrast) - names are translation keys
const activityTypeConfig: { [key: string]: { icon: any; color: string; nameKey: string } } = {
  practice: {
    nameKey: 'practice',
    icon: Dumbbell,
    color: 'bg-blue-500/30 text-blue-300 border-blue-400/50'
  },
  individual_training: {
    nameKey: 'individual_training',
    icon: Target,
    color: 'bg-green-500/30 text-green-300 border-green-400/50'
  },
  group_training: {
    nameKey: 'group_training',
    icon: Users,
    color: 'bg-purple-500/30 text-purple-300 border-purple-400/50'
  },
  official_match: {
    nameKey: 'official_match',
    icon: Trophy,
    color: 'bg-yellow-500/30 text-yellow-300 border-yellow-400/50'
  },
  tournament: {
    nameKey: 'tournament',
    icon: Trophy,
    color: 'bg-red-500/30 text-red-300 border-red-400/50'
  },
  meeting: {
    nameKey: 'meeting',
    icon: BookOpen,
    color: 'bg-indigo-500/30 text-indigo-300 border-indigo-400/50'
  }
}

// Generate time slots from 2:00 PM to 11:00 PM (matching player availability)
// These are stored in ORG_TIMEZONE (CET/Paris) - admin creates in CET
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 2; hour < 12; hour++) {
    slots.push(`${hour}:00 PM`)
  }
  return slots
}

// Time slots in ORG_TIMEZONE (CET)
const orgTimeSlots = generateTimeSlots()
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

interface ScheduleActivity {
  id: string
  team_id: string
  type: string
  title: string
  description?: string | null
  day_of_week: number
  time_slot: string
  duration: number
  activity_date?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// Helper functions for date calculations
const getMondayOfWeek = (weekOffset: number = 0): Date => {
  const now = new Date()
  
  // Get the date parts in Europe/Paris timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.format(now).split('-') // YYYY-MM-DD
  
  // Create date in UTC to avoid timezone shifts
  const parisDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  
  const day = parisDate.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Calculate days to subtract to get to Monday
  const monday = new Date(parisDate)
  monday.setUTCDate(parisDate.getUTCDate() + diff + (weekOffset * 7))
  
  return monday
}

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const getDateString = (date: Date): string => {
  // Format as YYYY-MM-DD in UTC
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getWeekDates = (weekOffset: number): string[] => {
  const monday = getMondayOfWeek(weekOffset)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + i)
    dates.push(getDateString(date))
  }
  return dates
}

interface PlayerScheduleClientProps {
  teamId: string
  teamName: string
  userTimezone: TimezoneOffset
}

export default function PlayerScheduleClient({ teamId, teamName, userTimezone }: PlayerScheduleClientProps) {
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<string[]>([])
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const t = useTranslations('schedule')

  // Convert time slots to user's timezone for display
  const displayTimeSlots = orgTimeSlots.map(slot => ({
    org: slot, // Original CET time (used for matching activities)
    display: convertTimeSlotToUserTimezone(slot, userTimezone) // Converted for user display
  }))

  // Helper to get translated day name
  const getDayName = (index: number) => t(`days.${dayKeys[index]}`)
  
  // Helper to get translated activity type name
  const getActivityTypeName = (type: string) => {
    const config = activityTypeConfig[type]
    return config ? t(`activityTypes.${config.nameKey}`) : type
  }

  useEffect(() => {
    setWeekDates(getWeekDates(currentWeekOffset))
  }, [currentWeekOffset])

  useEffect(() => {
    fetchActivities()
  }, [teamId])

  const fetchActivities = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('schedule_activities')
      .select('*')
      .eq('team_id', teamId)
    
    if (error) {
      console.error('Error fetching activities:', error)
    } else if (data) {
      console.log('Loaded activities:', data)
      setActivities(data)
    }
    setLoading(false)
  }

  const getActivityForSlot = (dayKey: string, timeSlot: string, date: string): ScheduleActivity | undefined => {
    // Convert day key to English day name for getDayNumber
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayIndex = dayKeys.indexOf(dayKey as typeof dayKeys[number])
    const dayNumber = getDayNumber(dayNames[dayIndex])
    return activities.find(activity => {
      // If activity has a specific date, match by exact date
      if (activity.activity_date) {
        return activity.activity_date === date && activity.time_slot === timeSlot
      }
      // Otherwise, match by day of week (recurring weekly activity)
      return activity.day_of_week === dayNumber && activity.time_slot === timeSlot
    })
  }

  const getActivityConfig = (type: string) => {
    return activityTypeConfig[type] || null
  }

  const goToPreviousWeek = () => {
    if (currentWeekOffset > 0) {
      setCurrentWeekOffset(currentWeekOffset - 1)
    }
  }

  const goToNextWeek = () => {
    if (currentWeekOffset < 2) {
      setCurrentWeekOffset(currentWeekOffset + 1)
    }
  }

  const goToCurrentWeek = () => {
    setCurrentWeekOffset(0)
  }

  const openActivityDetails = (activity: ScheduleActivity) => {
    setSelectedActivity(activity)
    setShowActivityModal(true)
  }

  const closeActivityModal = () => {
    setShowActivityModal(false)
    setTimeout(() => setSelectedActivity(null), 300)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">{t('loadingSchedule')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('teamScheduleTitle', { teamName })}</h1>
          <p className="text-gray-400">{t('description')}</p>
        </div>
        {/* Timezone indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm text-gray-300">
            {userTimezone !== ORG_TIMEZONE ? (
              <>{t('timesShownIn')} <span className="text-primary font-medium">{getTimezoneShort(userTimezone)}</span></>
            ) : (
              <span className="text-gray-400">{t('orgTimezone')}</span>
            )}
          </span>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            disabled={currentWeekOffset === 0}
            className={`p-2 rounded-lg transition-all ${
              currentWeekOffset === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">{t('currentWeek')}</div>
              <div className="text-lg font-semibold text-white">
                {(() => {
                  const monday = getMondayOfWeek(currentWeekOffset)
                  const sunday = new Date(monday)
                  sunday.setUTCDate(monday.getUTCDate() + 6)
                  return `${formatDateShort(monday)} - ${formatDateShort(sunday)}`
                })()}
              </div>
            </div>
            {currentWeekOffset > 0 && (
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium"
              >
                {t('goToCurrentWeek')}
              </button>
            )}
          </div>

          <button
            onClick={goToNextWeek}
            disabled={currentWeekOffset === 2}
            className={`p-2 rounded-lg transition-all ${
              currentWeekOffset === 2
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b border-gray-700">
              <div className="p-3 bg-gray-800/80 sticky left-0 z-10">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t('time')}</span>
                </div>
              </div>
              {dayKeys.map((dayKey, index) => {
                // Parse the date string as UTC to avoid timezone shifts
                const [year, month, dayNum] = weekDates[index].split('-').map(Number)
                const date = new Date(Date.UTC(year, month - 1, dayNum))
                
                return (
                  <div key={dayKey} className="p-3 text-center border-l border-gray-700">
                    <div className="text-sm font-semibold text-white">{getDayName(index)}</div>
                    <div className="text-xs text-gray-300 mt-1">
                      {formatDateShort(date)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Slots */}
            <div>
              {displayTimeSlots.map(({ org: timeSlot, display: displayTime }) => (
                <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                  <div className="p-3 text-sm font-medium text-gray-300 bg-gray-800/60 sticky left-0 z-10 border-r border-gray-700">
                    {displayTime}
                  </div>
                  {dayKeys.map((dayKey, dayIndex) => {
                    const activity = getActivityForSlot(dayKey, timeSlot, weekDates[dayIndex])
                    const activityInfo = activity ? getActivityConfig(activity.type) : null

                    return (
                      <div
                        key={`${dayKey}-${timeSlot}`}
                        className="p-2 min-h-[80px] border-l border-gray-700/50 bg-gray-900/20"
                      >
                        {activity && activityInfo && (
                          <div
                            onClick={() => openActivityDetails(activity)}
                            className={`p-3 rounded-lg border-2 h-full flex flex-col justify-between ${activityInfo.color} shadow-lg hover:shadow-2xl transition-all cursor-pointer hover:scale-105 hover:border-opacity-70`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <activityInfo.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-semibold truncate">
                                  {activity.title}
                                </span>
                              </div>
                            </div>
                            {activity.description && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs opacity-85 line-clamp-2">
                                  {activity.description}
                                </div>
                                {activity.duration > 1 && (
                                  <div className="text-xs font-medium opacity-75">
                                    {activity.duration}h
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-lg">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('activityType')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(activityTypeConfig).map(([key, { icon: Icon, color, nameKey }]) => (
            <div key={key} className={`p-3 rounded-lg border-2 ${color} flex items-center gap-2 shadow-md`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{t(`activityTypes.${nameKey}`)}</span>
            </div>
          ))}
        </div>
      </div>

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
              const activityInfo = getActivityConfig(selectedActivity.type)
              if (!activityInfo) return null
              const Icon = activityInfo.icon
              const iconColor = activityInfo.color.includes('text-blue') ? 'text-blue-400' : 
                               activityInfo.color.includes('text-green') ? 'text-green-400' : 
                               activityInfo.color.includes('text-purple') ? 'text-purple-400' : 
                               activityInfo.color.includes('text-yellow') ? 'text-yellow-400' : 
                               activityInfo.color.includes('text-red') ? 'text-red-400' : 'text-indigo-400'
              const bgColor = activityInfo.color.includes('text-blue') ? 'bg-blue-500/20' : 
                             activityInfo.color.includes('text-green') ? 'bg-green-500/20' : 
                             activityInfo.color.includes('text-purple') ? 'bg-purple-500/20' : 
                             activityInfo.color.includes('text-yellow') ? 'bg-yellow-500/20' : 
                             activityInfo.color.includes('text-red') ? 'bg-red-500/20' : 'bg-indigo-500/20'
              
              // For modal day display
              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              const dayIndex = dayNames.findIndex((_, idx) => getDayNumber(dayNames[idx]) === selectedActivity.day_of_week)
              
              return (
                <>
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
                          <Icon className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold text-white mb-2">{selectedActivity.title}</h2>
                          <span className="inline-block px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                            {getActivityTypeName(selectedActivity.type)}
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
                            ? formatDateShort(new Date(selectedActivity.activity_date))
                            : dayIndex >= 0 ? getDayName(dayIndex) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{convertTimeSlotToUserTimezone(selectedActivity.time_slot, userTimezone)}</span>
                        {userTimezone !== ORG_TIMEZONE && (
                          <span className="text-xs text-gray-500">({getTimezoneShort(userTimezone)})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedActivity.duration} {selectedActivity.duration === 1 ? t('hours').slice(0, -1) : t('hours')}</span>
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
                      {t('close')}
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
