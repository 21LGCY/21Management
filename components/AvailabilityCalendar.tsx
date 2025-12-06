'use client'

import { useState, useEffect, memo } from 'react'
import { CheckCircle, XCircle, Calendar as CalendarIcon, Globe } from 'lucide-react'
import { TimeSlots, DayOfWeek, TimezoneOffset } from '@/lib/types/database'
import { 
  getHourOffset, 
  getTimezoneShort, 
  ORG_TIMEZONE, 
  DAYS, 
  DAY_LABELS, 
  ORG_HOURS,
  formatHourRange,
  getDateForDay
} from '@/lib/utils/timezone'
import { useTranslations } from 'next-intl'

interface AvailabilityCalendarProps {
  weekStart: string
  timeSlots: TimeSlots
  onChange: (timeSlots: TimeSlots) => void
  readOnly?: boolean
  userTimezone?: TimezoneOffset
}

// Memoized slot component to prevent unnecessary re-renders
const TimeSlot = memo(({ 
  day, 
  hour, 
  available, 
  readOnly, 
  onMouseDown, 
  onMouseEnter 
}: {
  day: DayOfWeek
  hour: number
  available: boolean
  readOnly: boolean
  onMouseDown: () => void
  onMouseEnter: () => void
}) => {
  const getSlotClass = (): string => {
    if (readOnly) {
      return available
        ? 'bg-green-500/30 border-green-500/50 cursor-default'
        : 'bg-dark border-gray-700 cursor-default'
    }
    
    return available
      ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30 cursor-pointer'
      : 'bg-dark border-gray-700 hover:bg-dark-hover cursor-pointer'
  }

  return (
    <div
      className={`
        relative h-12 rounded-lg border-2 transition-all duration-150 select-none
        ${getSlotClass()}
      `}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-150">
        {available ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100" />
        )}
      </div>
    </div>
  )
})

TimeSlot.displayName = 'TimeSlot'

function AvailabilityCalendar({ weekStart, timeSlots, onChange, readOnly = false, userTimezone = ORG_TIMEZONE }: AvailabilityCalendarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState<boolean | null>(null)
  const t = useTranslations('availability')
  const tDays = useTranslations('days')

  // Day keys for translation
  const dayKeys: Record<DayOfWeek, string> = {
    monday: 'mon',
    tuesday: 'tue',
    wednesday: 'wed',
    thursday: 'thu',
    friday: 'fri',
    saturday: 'sat',
    sunday: 'sun'
  }

  // Calculate display hours based on user timezone
  // ORG hours are 15-23 (3PM-11PM CET), shift for user's timezone
  const offset = getHourOffset(userTimezone)
  const displayHours = ORG_HOURS.map(orgHour => {
    const userHour = (orgHour + offset + 24) % 24
    return { orgHour, userHour }
  })

  const toggleSlot = (day: DayOfWeek, hour: number) => {
    if (readOnly) return

    const newTimeSlots = { ...timeSlots }
    if (!newTimeSlots[day]) {
      newTimeSlots[day] = {}
    }
    
    const currentValue = newTimeSlots[day]![hour]
    newTimeSlots[day]![hour] = !currentValue
    
    onChange(newTimeSlots)
  }

  const handleMouseDown = (day: DayOfWeek, hour: number) => {
    if (readOnly) return
    
    const currentValue = timeSlots[day]?.[hour] || false
    setDragValue(!currentValue)
    setIsDragging(true)
    
    // Toggle the initial cell
    toggleSlot(day, hour)
  }

  const handleMouseEnter = (day: DayOfWeek, hour: number) => {
    if (!isDragging || readOnly || dragValue === null) return
    
    const newTimeSlots = { ...timeSlots }
    if (!newTimeSlots[day]) {
      newTimeSlots[day] = {}
    }
    newTimeSlots[day]![hour] = dragValue
    onChange(newTimeSlots)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragValue(null)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp)
      return () => window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const isSlotAvailable = (day: DayOfWeek, hour: number): boolean => {
    return timeSlots[day]?.[hour] || false
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] pr-2 transition-opacity duration-200">
        {/* Timezone indicator */}
        {userTimezone !== ORG_TIMEZONE && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm text-gray-300">
              {t('timesShownIn')} <span className="text-primary font-medium">{getTimezoneShort(userTimezone)}</span> {t('yourTimezone')}
            </span>
          </div>
        )}

        {/* Header with Days */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="text-sm font-medium text-gray-400 flex items-center justify-center">
            {t('time')}
          </div>
          {DAYS.map((day, index) => (
            <div key={day} className="text-center">
              <div className="text-sm font-semibold text-white">
                {tDays(dayKeys[day] as any)}
              </div>
              <div className="text-xs text-gray-500">
                {getDateForDay(weekStart, index)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots Grid - uses displayHours for visual, orgHour for data */}
        <div className="space-y-2">
          {displayHours.map(({ orgHour, userHour }) => (
            <div key={orgHour} className="grid grid-cols-8 gap-2">
              {/* Time Label - show user's timezone hour */}
              <div className="flex items-center justify-center text-xs text-gray-400 font-medium">
                {formatHourRange(userHour)}
              </div>

              {/* Day Slots - store using orgHour */}
              {DAYS.map((day) => {
                const available = isSlotAvailable(day, orgHour)
                
                return (
                  <TimeSlot
                    key={`${day}-${orgHour}`}
                    day={day}
                    hour={orgHour}
                    available={available}
                    readOnly={readOnly}
                    onMouseDown={() => handleMouseDown(day, orgHour)}
                    onMouseEnter={() => handleMouseEnter(day, orgHour)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/50"></div>
            <span className="text-gray-400">{t('available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-dark border-2 border-gray-700"></div>
            <span className="text-gray-400">{t('notAvailable')}</span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              <span>{t('clickToToggle')} • {t('dragToSelect')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(AvailabilityCalendar)
