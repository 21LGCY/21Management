'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, X, Plus, Trash2 } from 'lucide-react'

interface TeamFormProps {
  teamId?: string
}

interface Player {
  id: string
  full_name: string
  in_game_name: string | null
  position: string | null
}

export default function TeamForm({ teamId }: TeamFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [teamPlayers, setTeamPlayers] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    logo_url: '',
  })

  useEffect(() => {
    fetchPlayers()
    if (teamId) {
      fetchTeam()
    }
  }, [teamId])

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, in_game_name, position')
        .eq('role', 'player')
        .order('full_name')

      if (error) throw error
      setAvailablePlayers(data || [])
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const fetchTeam = async () => {
    if (!teamId) return
    
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError

      if (teamData) {
        setFormData({
          name: teamData.name,
          tag: teamData.tag || '',
          logo_url: teamData.logo_url || '',
        })
      }

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('team_id', teamId)

      if (membersError) throw membersError
      setTeamPlayers(membersData?.map(p => p.id) || [])
    } catch (error) {
      console.error('Error fetching team:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (teamId) {
        // Update existing team
        const { error: updateError } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            tag: formData.tag || null,
            logo_url: formData.logo_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teamId)

        if (updateError) throw updateError

        // Update team members
        // First, remove all current members
        await supabase
          .from('profiles')
          .update({ team_id: null })
          .eq('team_id', teamId)

        // Then add selected members
        if (teamPlayers.length > 0) {
          const { error: membersError } = await supabase
            .from('profiles')
            .update({ team_id: teamId })
            .in('id', teamPlayers)

          if (membersError) throw membersError
        }
      } else {
        // Create new team
        if (!formData.name) {
          alert('Team name is required')
          setLoading(false)
          return
        }

        const { data: newTeam, error: createError } = await supabase
          .from('teams')
          .insert({
            name: formData.name,
            tag: formData.tag || null,
            logo_url: formData.logo_url || null,
          })
          .select()
          .single()

        if (createError) throw createError

        // Add team members
        if (teamPlayers.length > 0 && newTeam) {
          const { error: membersError } = await supabase
            .from('profiles')
            .update({ team_id: newTeam.id })
            .in('id', teamPlayers)

          if (membersError) throw membersError
        }
      }

      router.push('/dashboard/admin/teams')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving team:', error)
      alert(error.message || 'Error saving team')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayer = (playerId: string) => {
    setTeamPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Team Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Team Alpha"
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Tag
            </label>
            <input
              type="text"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
              placeholder="e.g., TMA"
              maxLength={5}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary uppercase"
            />
            <p className="mt-1 text-xs text-gray-400">Max 5 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Logo URL
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-gray-400">Enter a URL to an image (PNG, JPG, SVG)</p>
            {formData.logo_url && (
              <div className="mt-3 p-3 bg-dark border border-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Logo Preview:</p>
                <img 
                  src={formData.logo_url} 
                  alt="Team logo preview" 
                  className="w-24 h-24 object-contain bg-dark-card rounded-lg border border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Team Members</h3>
          <p className="text-sm text-gray-400">Select players to add to this team</p>
          
          <div className="max-h-96 overflow-y-auto bg-dark-card border border-gray-800 rounded-lg">
            {availablePlayers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No players available. Create players first.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {availablePlayers.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-3 p-3 hover:bg-dark transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={teamPlayers.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      className="w-4 h-4 text-primary bg-dark-card border-gray-800 rounded focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{player.full_name}</div>
                      <div className="text-sm text-gray-400">
                        {player.in_game_name || 'No IGN'} 
                        {player.position && (
                          <span className="ml-2 text-xs text-gray-500">
                            • {player.position}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {teamPlayers.length > 0 && (
            <div className="mt-4 p-4 bg-dark border border-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Selected: {teamPlayers.length} player(s)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-dark-card border border-gray-800 hover:border-gray-700 text-white rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {teamId ? 'Update Team' : 'Create Team'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
