'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Send, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import QuickFillButtons from '@/components/QuickFillButtons'
import { TimeSlots } from '@/lib/types/database'

interface AvailabilityFormProps {
  token: string
}

const getTeamLabel = (teamCategory: string): string => {
  switch (teamCategory) {
    case '21L': return '21L'
    case '21GC': return '21GC'
    case '21ACA': return '21 ACA'
    default: return teamCategory.toUpperCase()
  }
}

export default function AvailabilityForm({ token }: AvailabilityFormProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [tryoutWeek, setTryoutWeek] = useState<any>(null)
  const [player, setPlayer] = useState<any>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlots>({})
  const supabase = createClient()

  useEffect(() => {
    if (token) {
      fetchAvailabilityData()
    } else {
      setError('No token provided')
      setLoading(false)
    }
  }, [token])

  const fetchAvailabilityData = async () => {
    try {
      // Fetch availability by token
      const { data: availData, error: availError } = await supabase
        .from('player_availabilities')
        .select(`
          *,
          player:profiles_tryouts(*),
          tryout_week:tryout_weeks(*)
        `)
        .eq('token', token)
        .single()

      if (availError) {
        setError('Invalid or expired token')
        setLoading(false)
        return
      }

      setAvailability(availData)
      setPlayer((availData as any).player)
      setTryoutWeek((availData as any).tryout_week)
      
      // Pre-fill form if already responded
      if ((availData as any).time_slots && Object.keys((availData as any).time_slots).length > 0) {
        setTimeSlots((availData as any).time_slots)
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setError('Failed to load tryout information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least one slot is selected
    const hasSlots = Object.values(timeSlots).some(day => 
      Object.values(day || {}).some(available => available === true)
    )

    if (!hasSlots) {
      alert('Please select at least one time slot when you are available')
      return
    }

    setSubmitting(true)

    try {
      const { error: updateError } = await supabase
        .from('player_availabilities')
        .update({
          time_slots: timeSlots,
          submitted_at: new Date().toISOString(),
        })
        .eq('token', token)

      if (updateError) throw updateError

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting availability:', error)
      alert('Failed to submit availability')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
  }

  const countAvailableSlots = (slots: TimeSlots): number => {
    let count = 0
    Object.values(slots).forEach(day => {
      if (day) {
        Object.values(day).forEach(available => {
          if (available) count++
        })
      }
    })
    return count
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (error || !availability || !tryoutWeek || !player) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400">{error || 'This tryout link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-primary/20 mb-4">
            <Calendar className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">21 Management Tryouts</h1>
          <p className="text-gray-400">VALORANT</p>
        </div>

        {/* Tryout Info Card */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Tryout Information</h2>
          
          {/* Session Title */}
          {tryoutWeek.week_label && (
            <div className="mb-4 pb-4 border-b border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Session:</div>
              <div className="text-2xl font-bold text-white">{tryoutWeek.week_label}</div>
            </div>
          )}
          
          {/* Session Description/Notes */}
          {tryoutWeek.notes && (
            <div className="mb-4 pb-4 border-b border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Description / Instructions:</div>
              <div className="text-gray-300 bg-dark px-4 py-3 rounded-lg text-sm">
                {tryoutWeek.notes}
              </div>
            </div>
          )}
          
          <div className="space-y-2 text-gray-300">
            <div>
              <span className="text-gray-400">Player: </span>
              <span className="font-medium text-white">{player.username}</span>
            </div>
            <div>
              <span className="text-gray-400">Role: </span>
              <span className="font-medium text-white">{player.position ? player.position.charAt(0).toUpperCase() + player.position.slice(1) : 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-400">Team: </span>
              <span className="font-medium text-white">{getTeamLabel(tryoutWeek.team_category)}</span>
            </div>
            <div className="border-t border-gray-800 pt-3 mt-3">
              <div className="text-sm text-gray-400 mb-1">Dates:</div>
              <div className="font-medium">{formatDateRange(tryoutWeek.week_start, tryoutWeek.week_end)}</div>
            </div>
          </div>
        </div>

        {/* Availability Form */}
        {submitted ? (
          <div className="bg-dark-card border border-gray-800 rounded-lg p-8 text-center">
            <div className="inline-block p-4 rounded-full bg-green-500/20 mb-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Availability Submitted!</h2>
            <p className="text-gray-400 mb-6">
              Thank you for providing your availability. Our staff will review your schedule and contact you with more details soon.
            </p>
            
            <div className="bg-dark border border-gray-800 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-400 mb-3">Your Available Slots:</div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {countAvailableSlots(timeSlots)}
              </div>
              <div className="text-sm text-gray-400">time slots selected</div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              You can update your availability below if your schedule changes.
            </p>
            
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition"
            >
              Update Availability
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-dark-card border border-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-2">Select Your Availability</h2>
            <p className="text-gray-400 mb-6">
              Click on the time slots when you're available. You can click and drag to select multiple slots at once.
            </p>
            
            {/* Quick Fill Buttons */}
            <QuickFillButtons onFill={setTimeSlots} />

            {/* Calendar Grid */}
            <AvailabilityCalendar
              weekStart={tryoutWeek.week_start}
              timeSlots={timeSlots}
              onChange={setTimeSlots}
            />

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-6 text-lg px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Availability'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Selected: {countAvailableSlots(timeSlots)} time slots
              </p>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>21 Management</p>
          <p className="mt-1">Questions? Contact our staff on Discord</p>
        </div>
      </div>
    </div>
  )
}
