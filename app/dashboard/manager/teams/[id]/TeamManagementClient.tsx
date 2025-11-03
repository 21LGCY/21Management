'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Trophy, Users, Edit, Eye, Settings, Plus, Shield } from 'lucide-react'
import Link from 'next/link'

interface Player {
  id: string
  username: string
  in_game_name?: string
  position?: string
  is_igl?: boolean
  is_substitute?: boolean
  nationality?: string
  rank?: string
  avatar_url?: string
  created_at: string
}

interface Team {
  id: string
  name: string
  tag?: string
  game: string
  description?: string
  logo_url?: string
  created_at: string
}

interface TeamManagementProps {
  team: Team
  players: Player[]
  user: any
}

export default function TeamManagementClient({ 
  team, 
  players, 
  user 
}: TeamManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')

  const mainRoster = players.filter(p => !p.is_substitute)
  const substitutes = players.filter(p => p.is_substitute)
  const igls = players.filter(p => p.is_igl)

  return (
    <div className="space-y-8">
      {/* Team Information Card */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center overflow-hidden">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {team.name}
                {team.tag && <span className="text-primary ml-2">[{team.tag}]</span>}
              </h2>
              <p className="text-gray-400">{team.game}</p>
              {team.description && (
                <p className="text-gray-300 mt-2">{team.description}</p>
              )}
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
            <Edit className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-lg font-semibold text-white">{players.length}</p>
            <p className="text-sm text-gray-400">Total Players</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-lg font-semibold text-green-400">{mainRoster.length}</p>
            <p className="text-sm text-gray-400">Main Players</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-lg font-semibold text-orange-400">{substitutes.length}</p>
            <p className="text-sm text-gray-400">Substitutes</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg">
            <p className="text-lg font-semibold text-yellow-400">{igls.length}</p>
            <p className="text-sm text-gray-400">IGLs</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/manager/players">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:bg-gray-800/50 transition cursor-pointer">
            <Edit className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Player Management</h3>
            <p className="text-gray-400 text-sm">View and manage player profiles</p>
          </div>
        </Link>

        <div className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:bg-gray-800/50 transition cursor-pointer opacity-50">
          <Calendar className="w-8 h-8 text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Schedule Matches</h3>
          <p className="text-gray-400 text-sm">Plan and schedule team matches</p>
          <span className="text-xs text-yellow-400 mt-2 block">Coming Soon</span>
        </div>
      </div>

    </div>
  )
}