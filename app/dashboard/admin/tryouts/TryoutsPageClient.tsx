'use client'

import { useState } from 'react'
import { Users, Calendar, MapPin } from 'lucide-react'
import ScoutingDatabase from './sections/ScoutingDatabase'
import TryoutWeeks from './sections/TryoutWeeks'
import ZonesInterface from './sections/ZonesInterface'

type TabType = 'scouting' | 'tryouts' | 'zones'

export default function TryoutsPageClient() {
  const [activeTab, setActiveTab] = useState<TabType>('scouting')

  const tabs = [
    {
      id: 'scouting' as TabType,
      name: 'Scouting Database',
      icon: Users,
    },
    {
      id: 'tryouts' as TabType,
      name: 'Tryout Weeks',
      icon: Calendar,
    },
    {
      id: 'zones' as TabType,
      name: 'Geographic Zones',
      icon: MapPin,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-semibold text-sm transition-all
                  ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-all
                    ${
                      isActive 
                        ? 'text-primary scale-110' 
                        : 'text-gray-400 group-hover:text-gray-300 group-hover:scale-110'
                    }
                  `}
                  aria-hidden="true"
                />
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

