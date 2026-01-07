'use client'

import { useState } from 'react'
import { Users, Calendar, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GameSelectorWithLogo } from '@/components/GameSelector'
import { GameType } from '@/lib/types/games'
import ScoutingDatabase from './sections/ScoutingDatabase'
import TryoutWeeks from './sections/TryoutWeeks'
import ZonesInterface from './sections/ZonesInterface'

type TabType = 'scouting' | 'tryouts' | 'zones'

export default function TryoutsPageClient() {
  const [activeTab, setActiveTab] = useState<TabType>('scouting')
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all')
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
      {/* Game Selector - Show for Scouting Database and Zones */}
      {(activeTab === 'scouting' || activeTab === 'zones') && (
        <div className="flex items-center justify-between mb-6">
          <GameSelectorWithLogo 
            value={selectedGame} 
            onChange={setSelectedGame}
            showAllOption={true}
          />
        </div>
      )}

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
        {activeTab === 'scouting' && <ScoutingDatabase gameFilter={selectedGame} onGameFilterChange={setSelectedGame} />}
        {activeTab === 'tryouts' && <TryoutWeeks />}
        {activeTab === 'zones' && <ZonesInterface gameFilter={selectedGame} onGameFilterChange={setSelectedGame} />}
      </div>
    </div>
  )
}

