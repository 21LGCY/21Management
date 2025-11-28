'use client'

import { memo, useMemo } from 'react'
import { PlayerAvailability, DayOfWeek, HourSlot } from '@/lib/types/database'

interface AvailabilityHeatmapProps {
  availabilities: PlayerAvailability[]
  weekStart: string
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

// Move pure functions outside component
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
  const date = new Date(weekStart)
  date.setDate(date.getDate() + dayIndex)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getHeatmapColor = (count: number): string => {
  if (count === 0) return 'bg-gray-800/50 border-gray-700/50 text-gray-500'
  
  switch (count) {
    case 1: return 'bg-red-500/70 border-red-400/90 text-red-50'
    case 2: return 'bg-orange-500/70 border-orange-400/90 text-orange-50'
    case 3: return 'bg-amber-500/70 border-amber-400/90 text-amber-50'
    case 4: return 'bg-yellow-500/70 border-yellow-400/90 text-yellow-50'
    case 5: return 'bg-lime-500/70 border-lime-400/90 text-lime-50'
    case 6: return 'bg-green-500/70 border-green-400/90 text-green-50'
    case 7: return 'bg-emerald-500/70 border-emerald-400/90 text-emerald-50'
    case 8: return 'bg-teal-500/70 border-teal-400/90 text-teal-50'
    case 9: return 'bg-cyan-500/70 border-cyan-400/90 text-cyan-50'
    case 10: return 'bg-sky-500/70 border-sky-400/90 text-sky-50'
    default: return 'bg-blue-600/80 border-blue-500/90 text-blue-50'
  }
}

// Memoized cell component
const HeatmapCell = memo(function HeatmapCell({ 
  count, 
  playerNames, 
  colorClass 
}: { 
  count: number
  playerNames: string[]
  colorClass: string 
}) {
  return (
    <div
      className={`
        relative h-12 rounded-lg border-2 transition-all group
        ${colorClass}
        cursor-pointer hover:brightness-110
      `}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-lg">
          {count}
        </span>
      </div>
      
      {count > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
          <div className="font-semibold mb-1">
            {count} {count === 1 ? 'player available' : 'players available'}:
          </div>
          <div className="space-y-1">
            {playerNames.map((name, index) => (
              <div key={index} className="text-xs">• {name}</div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
})

function AvailabilityHeatmap({ availabilities, weekStart }: AvailabilityHeatmapProps) {
  // Pre-compute all counts and player names in a single pass
  const heatmapData = useMemo(() => {
    const data: Record<string, { count: number; players: string[] }> = {}
    
    // Initialize all slots
    for (const day of DAYS) {
      for (const hour of HOURS) {
        data[`${day}-${hour}`] = { count: 0, players: [] }
      }
    }
    
    // Count availabilities in a single pass
    for (const avail of availabilities) {
      const timeSlots = avail.time_slots || {}
      const playerName = (avail as { player?: { username?: string } }).player?.username || 'Unknown Player'
      
      for (const day of DAYS) {
        for (const hour of HOURS) {
          if (timeSlots[day]?.[hour] === true) {
            const key = `${day}-${hour}`
            data[key].count++
            data[key].players.push(playerName)
          }
        }
      }
    }
    
    return data
  }, [availabilities])

  // Memoize date labels
  const dateLabels = useMemo(() => 
    DAYS.map((_, index) => getDateForDay(weekStart, index)),
    [weekStart]
  )

  return (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-semibold text-white mb-4">Availability Overview</h3>
        
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] pr-6 pt-20">
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
                    {dateLabels[index]}
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
                    const slotData = heatmapData[`${day}-${hour}`]
                    return (
                      <HeatmapCell
                        key={`${day}-${hour}`}
                        count={slotData.count}
                        playerNames={slotData.players}
                        colorClass={getHeatmapColor(slotData.count)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center rounded-full border border-gray-400 text-gray-400 text-[10px] font-semibold">
                  i
                </div>
                <span className="text-gray-400">Hover over a slot to see available players</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(AvailabilityHeatmap)
