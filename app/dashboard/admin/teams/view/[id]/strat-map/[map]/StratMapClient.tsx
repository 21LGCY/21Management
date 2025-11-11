'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, ValorantMap, UserRole } from '@/lib/types/database'
import { ArrowLeft, Map as MapIcon } from 'lucide-react'
import Link from 'next/link'
import TeamCommunication from '../../TeamCommunication'

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
        <p className="text-gray-400 mb-4">Team not found</p>
        <Link
          href="/dashboard/admin/teams"
          className="text-primary hover:underline"
        >
          Back to Teams
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Link
          href={`/dashboard/admin/teams/view/${teamId}`}
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3">
          <MapIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">{mapName} Strategies</h1>
            <p className="text-gray-400">{team.name}</p>
          </div>
        </div>
      </div>

      {/* Communication Component */}
      <TeamCommunication
        teamId={teamId}
        section="strat_map"
        mapName={mapName}
        userId={userId}
        userName={userName}
        userRole={userRole}
      />
    </div>
  )
}
