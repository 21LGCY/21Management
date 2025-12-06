'use client'

import { useState } from 'react'
import { Users, Calendar, MapPin } from 'lucide-react'
import { TeamCategory } from '@/lib/types/database'
import ScoutingDatabaseManager from './sections/ScoutingDatabaseManager'
import TryoutWeeksManager from './sections/TryoutWeeksManager'
import ZonesInterfaceManager from './sections/ZonesInterfaceManager'
import { useTranslations } from 'next-intl'

type TabType = 'scouting' | 'tryouts' | 'zones'

interface TryoutsManagerClientProps {
  teamId: string | null
  team: any | null
  teamCategory: TeamCategory | null
}

export default function TryoutsManagerClient({ teamId, team, teamCategory }: TryoutsManagerClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('scouting')
  const t = useTranslations('tryouts')

  const tabs = [
    {
      id: 'scouting' as TabType,
      name: t('scoutingDatabase'),
      icon: Users,
    },
    {
      id: 'tryouts' as TabType,
      name: t('tryoutWeeks'),
      icon: Calendar,
    },
    {
      id: 'zones' as TabType,
      name: t('geographicZones'),
      icon: MapPin,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'scouting' && <ScoutingDatabaseManager teamId={teamId} team={team} teamCategory={teamCategory} />}
        {activeTab === 'tryouts' && <TryoutWeeksManager teamId={teamId} team={team} teamCategory={teamCategory} />}
        {activeTab === 'zones' && <ZonesInterfaceManager teamId={teamId} team={team} teamCategory={teamCategory} />}
      </div>
    </div>
  )
}