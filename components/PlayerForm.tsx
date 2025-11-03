'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValorantRole, ValorantRank } from '@/lib/types/database'
import { Save, X, Plus } from 'lucide-react'

interface PlayerFormProps {
  teamId: string
  teamName?: string
  playerId?: string
}

const VALORANT_ROLES: ValorantRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex']

const VALORANT_RANKS: ValorantRank[] = [
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant'
]

const EUROPEAN_COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
]

const VALORANT_AGENTS = [
  'Jett', 'Reyna', 'Raze', 'Phoenix', 'Yoru', 'Neon', // Duelists
  'Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', // Initiators
  'Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove', // Controllers
  'Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Vyse' // Sentinels
]

export default function PlayerForm({ teamId, teamName, playerId }: PlayerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    in_game_name: '',
    position: '' as ValorantRole | '',
    is_igl: false,
    is_substitute: false,
    nationality: '',
    champion_pool: [] as string[],
    rank: '' as ValorantRank | '',
    valorant_tracker_url: '',
    twitter_url: '',
    avatar_url: '',
  })

  const [championInput, setChampionInput] = useState('')

  // Load player data when editing
  useEffect(() => {
    if (playerId) {
      loadPlayerData()
    }
  }, [playerId])

  const loadPlayerData = async () => {
    if (!playerId) return

    const { data: player, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .single()

    if (error || !player) {
      console.error('Error loading player data:', error)
      return
    }

    setFormData({
      username: player.username || '',
      password: '', // Don't load password for security
      in_game_name: player.in_game_name || '',
      position: player.position || '',
      is_igl: player.is_igl || false,
      is_substitute: player.is_substitute || false,
      nationality: player.nationality || '',
      champion_pool: player.champion_pool || [],
      rank: player.rank || '',
      valorant_tracker_url: player.valorant_tracker_url || '',
      twitter_url: player.twitter_url || '',
      avatar_url: player.avatar_url || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (playerId) {
        // Update existing player
        const updates = {
          in_game_name: formData.in_game_name || null,
          position: formData.position || null,
          is_igl: formData.is_igl,
          is_substitute: formData.is_substitute,
          nationality: formData.nationality || null,
          champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
          rank: formData.rank || null,
          valorant_tracker_url: formData.valorant_tracker_url || null,
          twitter_url: formData.twitter_url || null,
          avatar_url: formData.avatar_url || null,
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', playerId)

        if (updateError) throw updateError

        alert('Player updated successfully!')
        router.push(`/dashboard/manager/players/${playerId}`)
      } else {
        // Create new player
        if (!formData.username || !formData.password) {
          alert('Username and password are required')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.rpc('create_user', {
          p_username: formData.username,
          p_password: formData.password,
          p_role: 'player'
        })

        if (error) throw error

        const newUserId = data

        // Update player profile with additional information
        const updates = {
          in_game_name: formData.in_game_name || null,
          team_id: teamId, // Automatically assign to manager's team
          position: formData.position || null,
          is_igl: formData.is_igl,
          is_substitute: formData.is_substitute,
          nationality: formData.nationality || null,
          champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
          rank: formData.rank || null,
          valorant_tracker_url: formData.valorant_tracker_url || null,
          twitter_url: formData.twitter_url || null,
          avatar_url: formData.avatar_url || null,
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', newUserId)

        if (updateError) throw updateError

        alert('Player created successfully!')
        router.push('/dashboard/manager/players')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error saving player:', error)
      alert(error.message || 'Error saving player')
    } finally {
      setLoading(false)
    }
  }

  const addChampion = () => {
    if (championInput.trim() && !formData.champion_pool.includes(championInput.trim())) {
      setFormData({
        ...formData,
        champion_pool: [...formData.champion_pool, championInput.trim()]
      })
      setChampionInput('')
    }
  }

  const removeChampion = (champion: string) => {
    setFormData({
      ...formData,
      champion_pool: formData.champion_pool.filter(c => c !== champion)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Account Information</h3>
          
          {!playerId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Enter password"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        {/* Gaming Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Gaming Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              In-Game Name *
            </label>
            <input
              type="text"
              required
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Enter Valorant username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role/Position
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as ValorantRole })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select a role</option>
              {VALORANT_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rank
            </label>
            <select
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value as ValorantRank })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select rank</option>
              {VALORANT_RANKS.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nationality
            </label>
            <select
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select nationality</option>
              {EUROPEAN_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={formData.is_igl}
                onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
                className="mr-2"
              />
              In-Game Leader (IGL)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={formData.is_substitute}
                onChange={(e) => setFormData({ ...formData, is_substitute: e.target.checked })}
                className="mr-2"
              />
              Substitute Player
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valorant Tracker URL
            </label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://tracker.gg/valorant/profile/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter URL
            </label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://twitter.com/username"
            />
          </div>
        </div>
      </div>

      {/* Agent Pool */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Agent Pool</h3>
        
        <div className="flex gap-2">
          <select
            value={championInput}
            onChange={(e) => setChampionInput(e.target.value)}
            className="flex-1 px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Select agent to add</option>
            {VALORANT_AGENTS.filter(agent => !formData.champion_pool.includes(agent)).map((agent) => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addChampion}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.champion_pool.map((agent) => (
            <span
              key={agent}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm"
            >
              {agent}
              <button
                type="button"
                onClick={() => removeChampion(agent)}
                className="text-primary hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? (playerId ? 'Updating...' : 'Creating...') : (playerId ? 'Update Player' : 'Create Player')}
        </button>
      </div>
    </form>
  )
}