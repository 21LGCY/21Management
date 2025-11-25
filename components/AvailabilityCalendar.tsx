'use client'

import { useState, useEffect, memo } from 'react'
import { CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react'
import { TimeSlots, DayOfWeek, HourSlot } from '@/lib/types/database'

interface AvailabilityCalendarProps {
  weekStart: string
  timeSlots: TimeSlots
  onChange: (timeSlots: TimeSlots) => void
  readOnly?: boolean
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const HOURS: HourSlot[] = [15, 16, 17, 18, 19, 20, 21, 22, 23]

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

const formatHourSlot = (hour: number): string => {
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  if (hour === 24 || hour === 0) return '12 AM'
  return `${hour - 12} PM`
}

const formatTimeRange = (hour: number): string => {
  const start = formatHourSlot(hour)
  const end = hour === 23 ? '12 AM' : formatHourSlot(hour + 1)
  return `${start} - ${end}`
}

const getDateForDay = (weekStart: string, dayIndex: number): string => {
  // Parse the date string correctly to avoid timezone issues - use UTC like manager
  const [year, month, day] = weekStart.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
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

function AvailabilityCalendar({ weekStart, timeSlots, onChange, readOnly = false }: AvailabilityCalendarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState<boolean | null>(null)

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
        {/* Header with Days */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="text-sm font-medium text-gray-400 flex items-center justify-center">
            Time
          </div>
          {DAYS.map((day, index) => (
            <div key={day} className="text-center">
              <div className="text-sm font-semibold text-white">
                {DAY_LABELS[day]}
              </div>
              <div className="text-xs text-gray-500">
                {getDateForDay(weekStart, index)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots Grid */}
        <div className="space-y-2">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2">
              {/* Time Label */}
              <div className="flex items-center justify-center text-xs text-gray-400 font-medium">
                {formatTimeRange(hour)}
              </div>

              {/* Day Slots */}
              {DAYS.map((day) => {
                const available = isSlotAvailable(day, hour)
                
                return (
                  <TimeSlot
                    key={`${day}-${hour}`}
                    day={day}
                    hour={hour}
                    available={available}
                    readOnly={readOnly}
                    onMouseDown={() => handleMouseDown(day, hour)}
                    onMouseEnter={() => handleMouseEnter(day, hour)}
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
            <span className="text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-dark border-2 border-gray-700"></div>
            <span className="text-gray-400">Not Available</span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              <span>Click to toggle • Drag to select multiple</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(AvailabilityCalendar)
