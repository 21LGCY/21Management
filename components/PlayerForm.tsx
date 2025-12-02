'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValorantRole, ValorantRank } from '@/lib/types/database'
import { Save, X, Plus, User, Gamepad2, Link as LinkIcon } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'

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
  { code: 'AL', name: 'Albania' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AT', name: 'Austria' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SM', name: 'San Marino' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'VA', name: 'Vatican City' },
]

const VALORANT_AGENTS = [
  'Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher', 
  'Deadlock', 'Fade', 'Gekko', 'Harbor', 'Iso', 'Jett', 
  'KAY/O', 'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze', 
  'Reyna', 'Sage', 'Skye', 'Sova', 'Viper', 'Vyse', 'Yoru'
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Information - Only show for new players */}
      {!playerId && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account Information</h2>
              <p className="text-xs text-gray-400">Login credentials for the player</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Enter password"
              />
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            <p className="text-xs text-gray-400">Player identity and profile</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              In-Game Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Enter Valorant username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nationality</label>
            <SearchableCountrySelect
              value={formData.nationality}
              onChange={(value) => setFormData({ ...formData, nationality: value })}
              countries={EUROPEAN_COUNTRIES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>
      </div>

      {/* Game Information */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-purple-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Game Information</h2>
            <p className="text-xs text-gray-400">Role, rank, and agent preferences</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role/Position</label>
            <CustomSelect
              value={formData.position}
              onChange={(value) => setFormData({ ...formData, position: value as ValorantRole })}
              placeholder="Select a role"
              options={[
                { value: '', label: 'Select a role' },
                ...VALORANT_ROLES.map(role => ({ value: role, label: role }))
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rank</label>
            <CustomSelect
              value={formData.rank}
              onChange={(value) => setFormData({ ...formData, rank: value as ValorantRank })}
              placeholder="Select rank"
              options={[
                { value: '', label: 'Select rank' },
                ...VALORANT_RANKS.map(rank => ({ value: rank, label: rank }))
              ]}
              className="w-full"
            />
          </div>
        </div>

        {/* Agent Pool */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent Pool</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <CustomSelect
                value={championInput}
                onChange={(value) => setChampionInput(value)}
                placeholder="Select agent to add"
                options={[
                  { value: '', label: 'Select agent...' },
                  ...VALORANT_AGENTS.filter(agent => !formData.champion_pool.includes(agent)).map(agent => ({ value: agent, label: agent }))
                ]}
                className="flex-1"
              />
              <button
                type="button"
                onClick={addChampion}
                disabled={!championInput}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.champion_pool.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-dark/50 border border-gray-800 rounded-lg">
                {formData.champion_pool.map((agent) => (
                  <span
                    key={agent}
                    className="group px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2 hover:bg-primary/20 transition-all"
                  >
                    {agent}
                    <button
                      type="button"
                      onClick={() => removeChampion(agent)}
                      className="opacity-70 group-hover:opacity-100 hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {formData.champion_pool.length === 0 && (
              <div className="p-4 bg-dark/30 border border-gray-800 rounded-lg text-center">
                <p className="text-sm text-gray-500">No agents added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* IGL and Substitute Checkboxes */}
        <div className="mt-6 pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 bg-dark/50 border border-gray-800 rounded-lg cursor-pointer hover:border-primary/50 transition-all group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.is_igl}
                onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-5 h-5 border-2 border-gray-600 rounded bg-dark peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                {formData.is_igl && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">In-Game Leader (IGL)</span>
              <p className="text-xs text-gray-500">This player leads the team strategy</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-dark/50 border border-gray-800 rounded-lg cursor-pointer hover:border-primary/50 transition-all group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.is_substitute}
                onChange={(e) => setFormData({ ...formData, is_substitute: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-5 h-5 border-2 border-gray-600 rounded bg-dark peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                {formData.is_substitute && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Substitute Player</span>
              <p className="text-xs text-gray-500">Available as backup for the team</p>
            </div>
          </label>
        </div>
      </div>

      {/* Contact & Links */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <LinkIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Contact & Links</h2>
            <p className="text-xs text-gray-400">External profiles and social links</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valorant Tracker URL</label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="https://tracker.gg/valorant/profile/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter URL</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="https://twitter.com/username"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-dark border border-gray-800 hover:border-gray-700 text-white rounded-lg transition-all font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg shadow-primary/20"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              {playerId ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {playerId ? 'Update Player' : 'Create Player'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}