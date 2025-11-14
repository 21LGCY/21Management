'use client'

import { useState } from 'react'
import { Calendar, Search, Map, MessageSquare, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import SchedulePreview from '@/components/SchedulePreview'
import StratMapSelection from './sections/StratMapSelection'
import PraccsReviewSelection from './sections/PraccsReviewSelection'

interface ManagerTeamsClientProps {
  teamId: string
  teamName: string
  playerCount: number
  tryouts: any[]
}

type TabType = 'overview' | 'strat_map' | 'review_praccs'

export default function ManagerTeamsClient({ teamId, teamName, playerCount, tryouts }: ManagerTeamsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Team & Roster Management
        </h1>
        <p className="text-gray-400">Manage {teamName || 'your team'}, schedules, and tryouts</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('strat_map')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
              activeTab === 'strat_map'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Strat Maps
          </button>
          <button
            onClick={() => setActiveTab('review_praccs')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium ${
              activeTab === 'review_praccs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Practice Reviews
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/manager/teams/schedule">
              <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Schedule</p>
                    <p className="text-sm text-gray-400">Manage team schedule</p>
                  </div>
                </div>
              </button>
            </Link>

            <Link href="/dashboard/manager/teams/tryouts">
              <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Manage Tryouts</p>
                    <p className="text-sm text-gray-400">Scout new talent</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Weekly Schedule Preview */}
            {teamId && <SchedulePreview teamId={teamId} />}

            {/* Recent Tryouts */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Tryouts</h2>
                <Link href="/dashboard/manager/teams/tryouts">
                  <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                    Manage Tryouts
                  </button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {tryouts && tryouts.length > 0 ? (
                  tryouts.map((tryout) => (
                    <div
                      key={tryout.id}
                      className="p-4 bg-dark rounded-lg border border-gray-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{tryout.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tryout.status === 'open' 
                            ? 'bg-green-500/20 text-green-400'
                            : tryout.status === 'in_progress'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {tryout.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{tryout.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No tryouts scheduled</p>
                    <Link href="/dashboard/manager/teams/tryouts">
                      <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                        Create Tryout
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'strat_map' && (
        <StratMapSelection teamId={teamId} />
      )}

      {activeTab === 'review_praccs' && (
        <PraccsReviewSelection teamId={teamId} />
      )}
    </div>
  )
}
