'use client'

import PlayerAvailabilityForm from '@/components/PlayerAvailabilityForm'
import { Calendar } from 'lucide-react'
import { TimezoneOffset } from '@/lib/types/database'
import { ORG_TIMEZONE } from '@/lib/utils/timezone'

interface PlayerAvailabilityClientProps {
  profile: any
  userTimezone?: TimezoneOffset
}

export default function PlayerAvailabilityClient({ profile, userTimezone = ORG_TIMEZONE }: PlayerAvailabilityClientProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-white">My Availability</h1>
        </div>
        <p className="text-lg text-gray-400">
          Manage your weekly availability for {profile.teams?.name || 'your team'}
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
