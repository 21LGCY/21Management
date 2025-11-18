'use client'

import { useState, useEffect } from 'react'
import { Calendar, Save, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import QuickFillButtons from '@/components/QuickFillButtons'
import { TimeSlots } from '@/lib/types/database'

interface PlayerAvailabilityFormProps {
  playerId: string
  teamId: string
  onSaved?: () => void
  userRole?: string // Add role to determine access restrictions
}

// Helper to get Monday of current week in Europe/Paris timezone
const getMonday = (date: Date): Date => {
  // Get the date parts in Europe/Paris timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.format(date).split('-') // YYYY-MM-DD
  
  // Create date in UTC to avoid timezone shifts
  const parisDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  
  const day = parisDate.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Calculate days to subtract to get to Monday
  const monday = new Date(parisDate)
  monday.setUTCDate(parisDate.getUTCDate() + diff)
  return monday
}

// Helper to get Sunday of current week
const getSunday = (monday: Date): Date => {
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return sunday
}

// Helper to check if a week is accessible for players (current week + 3 future weeks = 4 weeks total)
const isWeekAccessibleForPlayer = (weekStart: Date): boolean => {
  const today = new Date()
  const currentMonday = getMonday(today)
  
  // Allow current week + 3 future weeks (4 weeks total)
  const maxWeek = new Date(currentMonday)
  maxWeek.setUTCDate(maxWeek.getUTCDate() + 21) // 3 weeks ahead
  
  return weekStart >= currentMonday && weekStart <= maxWeek
}

// Helper to check if a week is in the past
const isWeekInPast = (weekStart: Date): boolean => {
  const today = new Date()
  const currentMonday = getMonday(today)
  
  return weekStart < currentMonday
}

export default function PlayerAvailabilityForm({ playerId, teamId, onSaved, userRole = 'player' }: PlayerAvailabilityFormProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlots>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize with current week in Paris timezone
  const getInitialWeek = () => {
    return getMonday(new Date())
  }
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getInitialWeek())
  const [currentWeekEnd, setCurrentWeekEnd] = useState<Date>(getSunday(getInitialWeek()))

  useEffect(() => {
    fetchAvailability()
  }, [playerId, teamId, currentWeekStart])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const weekStartStr = currentWeekStart.toISOString().split('T')[0]
      const response = await fetch(
        `/api/player-availability?player_id=${playerId}&team_id=${teamId}&week_start=${weekStartStr}`
      )
      
      if (response.ok) {
        const { availabilities } = await response.json()
        if (availabilities && availabilities.length > 0) {
          const availability = availabilities[0]
          setTimeSlots(availability.time_slots || {})
          setNotes(availability.notes || '')
        } else {
          // Reset for new week
          setTimeSlots({})
          setNotes('')
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setError('Failed to load your availability')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Check if at least one slot is selected
    const hasSlots = Object.values(timeSlots).some(day => 
      Object.values(day || {}).some(available => available === true)
    )

    if (!hasSlots) {
      setError('Please select at least one time slot when you are available')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/player-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          team_id: teamId,
          week_start: currentWeekStart.toISOString().split('T')[0],
          week_end: currentWeekEnd.toISOString().split('T')[0],
          time_slots: timeSlots,
          notes: notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save availability')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      if (onSaved) {
        onSaved()
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      setError('Failed to save your availability. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const changeWeek = (direction: 'prev' | 'next') => {
    const newMonday = new Date(currentWeekStart)
    if (direction === 'prev') {
      newMonday.setUTCDate(newMonday.getUTCDate() - 7)
    } else {
      newMonday.setUTCDate(newMonday.getUTCDate() + 7)
    }
    
    // For players, restrict access to current + 2 future weeks
    if (userRole === 'player') {
      if (!isWeekAccessibleForPlayer(newMonday)) {
        return // Don't allow navigation outside allowed range
      }
    }
    
    setCurrentWeekStart(newMonday)
    setCurrentWeekEnd(getSunday(newMonday))
  }

  const formatWeekRange = (): string => {
    const startStr = currentWeekStart.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    })
    const endStr = currentWeekEnd.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC'
    })
    return `${startStr} - ${endStr}`
  }
  
  // Check if current week is in the past (read-only for players)
  const isReadOnly = userRole === 'player' && isWeekInPast(currentWeekStart)
  
  // Check if navigation buttons should be disabled
  const canGoPrev = userRole !== 'player' || isWeekAccessibleForPlayer(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000))
  const canGoNext = userRole !== 'player' || isWeekAccessibleForPlayer(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Weekly Availability</h3>
              <p className="text-sm text-gray-400">Fill in your availability for the week</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeWeek('prev')}
              disabled={!canGoPrev}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="text-center min-w-[200px]">
              <p className="text-sm text-gray-400">Week of</p>
              <p className="text-white font-medium">{formatWeekRange()}</p>
            </div>
            <button
              onClick={() => changeWeek('next')}
              disabled={!canGoNext}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-300 text-sm font-medium">How it works</p>
              <p className="text-blue-300/70 text-sm mt-1">
                {isReadOnly 
                  ? 'This week is in the past and cannot be edited. You can view it for reference.'
                  : userRole === 'player'
                  ? 'Click and drag to select the time slots when you are available. You can fill availability for the current week and up to 3 weeks ahead.'
                  : 'Click and drag to select the time slots when you are available. Your manager will use this to schedule team activities.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Fill Buttons - Hide for read-only */}
      {!isReadOnly && (
        <QuickFillButtons 
          onFill={setTimeSlots}
        />
      )}

      {/* Calendar */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <AvailabilityCalendar
          weekStart={currentWeekStart.toISOString().split('T')[0]}
          timeSlots={timeSlots}
          onChange={setTimeSlots}
          readOnly={isReadOnly}
        />
      </div>

      {/* Notes */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isReadOnly}
          placeholder="Any additional information about your availability..."
          className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          rows={3}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm">Availability saved successfully!</p>
          </div>
        </div>
      )}

      {/* Submit Button - Hide for read-only */}
      {!isReadOnly && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-primary via-purple-600 to-primary-dark hover:shadow-lg hover:shadow-primary/50 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Availability
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
