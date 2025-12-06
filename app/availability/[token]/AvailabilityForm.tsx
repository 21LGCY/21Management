'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Send, AlertCircle, Globe, Languages } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import QuickFillButtons from '@/components/QuickFillButtons'
import { TimeSlots, TimezoneOffset } from '@/lib/types/database'
import { ORG_TIMEZONE, getTimezoneShort } from '@/lib/utils/timezone'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface AvailabilityFormProps {
  token: string
}

const TIMEZONE_OPTIONS: { value: TimezoneOffset; label: string; description: string }[] = [
  { value: 'UTC+0', label: 'GMT / UTC+0', description: 'UK, Portugal, Iceland' },
  { value: 'UTC+1', label: 'CET / UTC+1', description: 'France, Germany, Spain, Italy' },
  { value: 'UTC+2', label: 'EET / UTC+2', description: 'Finland, Greece, Romania, Ukraine' },
  { value: 'UTC+3', label: 'MSK / UTC+3', description: 'Russia (Moscow), Turkey' },
]

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
  const [userTimezone, setUserTimezone] = useState<TimezoneOffset>(ORG_TIMEZONE)
  const [currentLocale, setCurrentLocale] = useState<'en' | 'fr'>('en')
  const supabase = createClient()
  
  const t = useTranslations('publicAvailability')
  const tCommon = useTranslations('common')

  // Initialize locale from cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
      if (match && (match[1] === 'en' || match[1] === 'fr')) {
        setCurrentLocale(match[1])
      }
    }
  }, [])

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
      alert(t('selectAtLeastOneSlot'))
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
      alert(t('failedToSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const locale = currentLocale === 'fr' ? 'fr-FR' : 'en-US'
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
    return `${startDate.toLocaleDateString(locale, options)} - ${endDate.toLocaleDateString(locale, options)}`
  }

  const handleLocaleChange = (locale: 'en' | 'fr') => {
    setCurrentLocale(locale)
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', locale)
    }
    // Set cookie for next-intl
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
    // Reload the page to apply new locale
    window.location.reload()
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
        <div className="text-white text-lg">{tCommon('loading')}</div>
      </div>
    )
  }

  if (error || !availability || !tryoutWeek || !player) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('invalidLink')}</h1>
          <p className="text-gray-400">{error || t('linkExpiredOrInvalid')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2 bg-dark-card border border-gray-800 rounded-lg p-1">
            <Languages className="w-4 h-4 text-gray-400 ml-2" />
            <button
              onClick={() => handleLocaleChange('en')}
              className={`px-3 py-1 rounded text-sm transition ${
                currentLocale === 'en'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLocaleChange('fr')}
              className={`px-3 py-1 rounded text-sm transition ${
                currentLocale === 'fr'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              FR
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-primary/20 mb-4">
            <Calendar className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('pageTitle')}</h1>
          <p className="text-gray-400">{t('valorant')}</p>
        </div>

        {/* Tryout Info Card */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('tryoutInformation')}</h2>
          
          {/* Session Title */}
          {tryoutWeek.week_label && (
            <div className="mb-4 pb-4 border-b border-gray-800">
              <div className="text-sm text-gray-400 mb-1">{t('session')}:</div>
              <div className="text-2xl font-bold text-white">{tryoutWeek.week_label}</div>
            </div>
          )}
          
          {/* Session Description/Notes */}
          {tryoutWeek.notes && (
            <div className="mb-4 pb-4 border-b border-gray-800">
              <div className="text-sm text-gray-400 mb-2">{t('descriptionInstructions')}:</div>
              <div className="text-gray-300 bg-dark px-4 py-3 rounded-lg text-sm">
                {tryoutWeek.notes}
              </div>
            </div>
          )}
          
          <div className="space-y-2 text-gray-300">
            <div>
              <span className="text-gray-400">{t('player')}: </span>
              <span className="font-medium text-white">{player.username}</span>
            </div>
            <div>
              <span className="text-gray-400">{t('role')}: </span>
              <span className="font-medium text-white">{player.position ? player.position.charAt(0).toUpperCase() + player.position.slice(1) : t('notSpecified')}</span>
            </div>
            <div>
              <span className="text-gray-400">{t('team')}: </span>
              <span className="font-medium text-white">{getTeamLabel(tryoutWeek.team_category)}</span>
            </div>
            <div className="border-t border-gray-800 pt-3 mt-3">
              <div className="text-sm text-gray-400 mb-1">{t('dates')}:</div>
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
            <h2 className="text-2xl font-bold text-white mb-2">{t('availabilitySubmitted')}</h2>
            <p className="text-gray-400 mb-6">
              {t('thankYouMessage')}
            </p>
            
            <div className="bg-dark border border-gray-800 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-400 mb-3">{t('yourAvailableSlots')}:</div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                {countAvailableSlots(timeSlots)}
              </div>
              <div className="text-sm text-gray-400">{t('timeSlotsSelected')}</div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {t('canUpdateAvailability')}
            </p>
            
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition"
            >
              {t('updateAvailability')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-dark-card border border-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-2">{t('selectYourAvailability')}</h2>
            <p className="text-gray-400 mb-6">
              {t('selectInstructions')}
            </p>

            {/* Timezone Selector */}
            <div className="mb-4 p-3 bg-dark border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-white font-medium text-sm">{t('selectYourTimezone')}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {TIMEZONE_OPTIONS.map((tz) => (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => setUserTimezone(tz.value)}
                    className={`p-2 rounded-lg border text-left transition ${
                      userTimezone === tz.value
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-gray-700 bg-dark-card text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-xs">{tz.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{tz.description}</div>
                  </button>
                ))}
              </div>
              {userTimezone !== ORG_TIMEZONE && (
                <p className="text-xs text-primary mt-2">
                  {t('timesShownInTimezone', { timezone: getTimezoneShort(userTimezone) })}
                </p>
              )}
            </div>
            
            {/* Quick Fill Buttons */}
            <QuickFillButtons onFill={setTimeSlots} />

            {/* Calendar Grid */}
            <AvailabilityCalendar
              weekStart={tryoutWeek.week_start}
              timeSlots={timeSlots}
              onChange={setTimeSlots}
              userTimezone={userTimezone}
            />

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 text-base px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {submitting ? t('submitting') : t('submitAvailability')}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                {t('selectedSlots', { count: countAvailableSlots(timeSlots) })}
              </p>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>{t('footer')}</p>
          <p className="mt-1">{t('contactDiscord')}</p>
        </div>
      </div>
    </div>
  )
}
