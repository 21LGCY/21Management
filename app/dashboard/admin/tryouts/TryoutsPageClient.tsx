'use client'

import { useState } from 'react'
import { Users, Calendar, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import ScoutingDatabase from './sections/ScoutingDatabase'
import TryoutWeeks from './sections/TryoutWeeks'
import ZonesInterface from './sections/ZonesInterface'

type TabType = 'scouting' | 'tryouts' | 'zones'

export default function TryoutsPageClient() {
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
        {activeTab === 'scouting' && <ScoutingDatabase />}
        {activeTab === 'tryouts' && <TryoutWeeks />}
        {activeTab === 'zones' && <ZonesInterface />}
      </div>
    </div>
  )
}

