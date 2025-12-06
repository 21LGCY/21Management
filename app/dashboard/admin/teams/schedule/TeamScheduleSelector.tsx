'use client'

import { useState } from 'react'
import { Shield, Calendar } from 'lucide-react'
import ScheduleManagementClient from './ScheduleManagementClient'
import { TimezoneOffset } from '@/lib/types/database'
import { useTranslations } from 'next-intl'

interface Team {
  id: string
  name: string
  game: string
  [key: string]: any
}

interface TeamScheduleSelectorProps {
  teams: Team[]
  user: any
  userTimezone: TimezoneOffset
}

export default function TeamScheduleSelector({ teams, user, userTimezone }: TeamScheduleSelectorProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const t = useTranslations('schedule')

  return (
    <div className="space-y-6">
      {/* Team Buttons */}
      <div className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">{t('selectATeam')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`p-5 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
                selectedTeam?.id === team.id
                  ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20'
                  : 'bg-dark border-gray-700 hover:border-primary/50 hover:bg-dark-card'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedTeam?.id === team.id
                    ? 'bg-primary/30'
                    : 'bg-primary/20 group-hover:bg-primary/30'
                }`}>
                  <Shield className={`w-6 h-6 transition-all ${
                    selectedTeam?.id === team.id
                      ? 'text-primary'
                      : 'text-primary group-hover:scale-110'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg mb-1 truncate transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'text-primary'
                      : 'text-white group-hover:text-primary'
                  }`}>
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{team.game}</p>
                </div>
              </div>
              {selectedTeam?.id === team.id && (
                <div className="mt-3 pt-3 border-t border-primary/30">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>{t('viewingSchedule')}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Management */}
      {selectedTeam ? (
        <ScheduleManagementClient 
          team={selectedTeam}
          user={user}
          userTimezone={userTimezone}
        />
      ) : (
        <div className="text-center py-12 bg-dark-card border border-gray-800 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">{t('noTeamSelected')}</p>
          <p className="text-gray-500">{t('clickTeamToManage')}</p>
        </div>
      )}
    </div>
  )
}
