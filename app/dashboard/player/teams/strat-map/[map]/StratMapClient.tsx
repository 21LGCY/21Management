'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, ValorantMap, UserRole, StratType } from '@/lib/types/database'
import { ArrowLeft, Map as MapIcon, Target, Users, X } from 'lucide-react'
import Link from 'next/link'
import TeamCommunication from '@/app/dashboard/admin/teams/view/[id]/TeamCommunication'
import { useTranslations } from 'next-intl'

interface StratMapClientProps {
  teamId: string
  mapName: ValorantMap
  userId: string
  userName: string
  userRole: UserRole
}

export default function StratMapClient({ 
  teamId, 
  mapName, 
  userId, 
  userName, 
  userRole 
}: StratMapClientProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [stratType, setStratType] = useState<StratType>('attack')
  const t = useTranslations('stratMaps')
  
  const supabase = createClient()

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (error) throw error
      setTeam(data)
    } catch (error) {
      console.error('Error fetching team:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{t('teamNotFound')}</p>
        <Link
          href="/dashboard/player/teams"
          className="text-primary hover:underline"
        >
          {t('backToTeamHub')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard/player/teams"
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3">
          <MapIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">{mapName} {t('strategies')}</h1>
            <p className="text-gray-400">{team.name}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Strategy Type Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-gray-300">{t('typeOfStrat')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStratType('attack')}
                className={`px-4 py-2 rounded-lg border transition ${
                  stratType === 'attack'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-dark border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {t('attack')}
              </button>
              <button
                onClick={() => setStratType('defense')}
                className={`px-4 py-2 rounded-lg border transition ${
                  stratType === 'defense'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-dark border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {t('defense')}
              </button>
            </div>
          </div>
        </div>

        {/* Info Note for Players */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-start gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              <span className="text-gray-300 font-medium">Note:</span> {t('teamCompsManaged')}
            </p>
          </div>
        </div>
      </div>

      {/* Communication Component */}
      <TeamCommunication
        teamId={teamId}
        section="strat_map"
        mapName={mapName}
        stratTypeFilter={stratType}
        userId={userId}
        userName={userName}
        userRole={userRole}
      />
    </div>
  )
}
