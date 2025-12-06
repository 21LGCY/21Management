'use client'

import PlayerAvailabilityForm from '@/components/PlayerAvailabilityForm'
import { Calendar } from 'lucide-react'
import { TimezoneOffset } from '@/lib/types/database'
import { ORG_TIMEZONE } from '@/lib/utils/timezone'
import { useTranslations } from 'next-intl'

interface PlayerAvailabilityClientProps {
  profile: any
  userTimezone?: TimezoneOffset
}

export default function PlayerAvailabilityClient({ profile, userTimezone = ORG_TIMEZONE }: PlayerAvailabilityClientProps) {
  const t = useTranslations('availability')
  const tDashboard = useTranslations('dashboard')
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-white">{t('myAvailability')}</h1>
        </div>
        <p className="text-lg text-gray-400">
          {tDashboard('manageWeeklySchedule')} - {profile.teams?.name || ''}
        </p>
      </div>

      {/* Availability Form */}
      <PlayerAvailabilityForm 
        playerId={profile.id} 
        teamId={profile.team_id}
        userTimezone={userTimezone}
      />
    </main>
  )
}
