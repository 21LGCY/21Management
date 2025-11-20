'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, ValorantMap, UserRole, StratType } from '@/lib/types/database'
import { ArrowLeft, Map as MapIcon, Target, Users, X } from 'lucide-react'
import Link from 'next/link'
import TeamCommunication from '@/app/dashboard/admin/teams/view/[id]/TeamCommunication'

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
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  
  const supabase = createClient()

  const VALORANT_AGENTS = [
    // Duelists
    'Jett', 'Reyna', 'Raze', 'Phoenix', 'Yoru', 'Neon', 'Iso',
    // Controllers
    'Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove',
    // Initiators
    'Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko',
    // Sentinels
    'Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse'
  ]

  const AGENT_ROLES: Record<string, string> = {
    'Jett': 'Duelist', 'Reyna': 'Duelist', 'Raze': 'Duelist', 'Phoenix': 'Duelist', 'Yoru': 'Duelist', 'Neon': 'Duelist', 'Iso': 'Duelist',
    'Brimstone': 'Controller', 'Omen': 'Controller', 'Viper': 'Controller', 'Astra': 'Controller', 'Harbor': 'Controller', 'Clove': 'Controller',
    'Sova': 'Initiator', 'Breach': 'Initiator', 'Skye': 'Initiator', 'KAY/O': 'Initiator', 'Fade': 'Initiator', 'Gekko': 'Initiator',
    'Killjoy': 'Sentinel', 'Cypher': 'Sentinel', 'Sage': 'Sentinel', 'Chamber': 'Sentinel', 'Deadlock': 'Sentinel', 'Vyse': 'Sentinel'
  }

  const toggleAgent = (agent: string) => {
    if (selectedAgents.includes(agent)) {
      setSelectedAgents(selectedAgents.filter(a => a !== agent))
    } else {
      setSelectedAgents([...selectedAgents, agent])
    }
  }

  const removeAgent = (agent: string) => {
    setSelectedAgents(selectedAgents.filter(a => a !== agent))
  }

  const composition = selectedAgents.join(', ')

  const handleSaveComposition = async () => {
    if (selectedAgents.length === 0) {
      alert('Please select at least one agent')
      return
    }

    try {
      // Format composition with roles
      const agentsByRole: Record<string, string[]> = {}
      selectedAgents.forEach(agent => {
        const role = AGENT_ROLES[agent] || 'Unknown'
        if (!agentsByRole[role]) {
          agentsByRole[role] = []
        }
        agentsByRole[role].push(agent)
      })

      let compositionText = '**Team Composition**\n\n'
      
      // Add agents by role
      const roleOrder = ['Duelist', 'Controller', 'Initiator', 'Sentinel', 'Unknown']
      roleOrder.forEach(role => {
        if (agentsByRole[role] && agentsByRole[role].length > 0) {
          compositionText += `**${role}**: ${agentsByRole[role].join(', ')}\n`
        }
      })
      
      const insertData: any = {
        team_id: teamId,
        section: 'strat_map',
        message_type: 'text',
        content: compositionText.trim(),
        map_name: mapName,
        strat_type: null, // Composition is shared between attack and defense
        author_id: userId,
        author_name: userName,
        author_role: userRole
      }

      // Add optional fields only if they exist
      if (composition) {
        insertData.composition = composition
      }

      const { error } = await supabase
        .from('team_messages')
        .insert(insertData)

      if (error) {
        console.error('Database error details:', error)
        throw error
      }
      
      // Clear selection after saving
      setSelectedAgents([])
      setShowAgentMenu(false)
    } catch (error: any) {
      console.error('Error saving composition:', error)
      const errorMessage = error?.message || 'Unknown error'
      alert(`Failed to save composition: ${errorMessage}`)
    }
  }

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
          href="/dashboard/manager/teams"
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
          href="/dashboard/manager/teams"
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

      {/* Filters */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strategy Type Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-gray-300">type of Strat</label>
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
                Attack
              </button>
              <button
                onClick={() => setStratType('defense')}
                className={`px-4 py-2 rounded-lg border transition ${
                  stratType === 'defense'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-dark border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                Defense
              </button>
            </div>
          </div>

          {/* Team Composition Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-gray-300">Team Composition</label>
            </div>

            {/* Agent Selection Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-gray-400 hover:border-gray-700 transition text-left"
              >
                {selectedAgents.length > 0 ? selectedAgents.join(', ') : 'Add agents to composition'}
              </button>
              
              {showAgentMenu && (
                <div className="absolute z-10 mt-2 w-full bg-dark-card border border-gray-800 rounded-lg p-4 shadow-xl max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {VALORANT_AGENTS.map((agent) => (
                      <button
                        key={agent}
                        onClick={() => toggleAgent(agent)}
                        className={`px-3 py-2 rounded-lg border text-sm transition ${
                          selectedAgents.includes(agent)
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-dark border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {agent}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              Select agents for this strategy composition
            </p>
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
        stratTypeFilter={stratType}
        compositionFilter={composition}
        onSaveComposition={handleSaveComposition}
      />
    </div>
  )
}
