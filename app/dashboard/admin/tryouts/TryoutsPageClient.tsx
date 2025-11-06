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
      description: 'Manage player scouting and recruitment pipeline',
    },
    {
      id: 'tryouts' as TabType,
      name: 'Tryout Weeks',
      icon: Calendar,
      description: 'Schedule tryout sessions and track availability',
    },
    {
      id: 'zones' as TabType,
      name: 'Geographic Zones',
      icon: MapPin,
      description: 'Visualize player geographic distribution by VALORANT zones',
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
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-300'}
                  `}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
        <p className="text-gray-400">
          {tabs.find(t => t.id === activeTab)?.description}
        </p>
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

