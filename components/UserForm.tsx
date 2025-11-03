'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValorantRole, ValorantRank, UserRole, StaffRole } from '@/lib/types/database'
import { Save, X } from 'lucide-react'

interface UserFormProps {
  userId?: string
}

const VALORANT_ROLES: ValorantRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex']
const STAFF_ROLES: StaffRole[] = ['Coach', 'Manager', 'Analyst']

// All Valorant agents organized by role
const VALORANT_AGENTS = [
  // Duelists
  'Jett', 'Phoenix', 'Reyna', 'Raze', 'Yoru', 'Neon', 'Iso',
  // Initiators
  'Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko',
  // Controllers
  'Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove',
  // Sentinels
  'Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse',
]

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

export default function UserForm({ userId }: UserFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'player' as UserRole,
    in_game_name: '',
    team_id: '',
    position: '' as ValorantRole | '',
    is_igl: false,
    is_substitute: false,
    nationality: '',
    champion_pool: [] as string[],
    rank: '' as ValorantRank | '',
    valorant_tracker_url: '',
    twitter_url: '',
    staff_role: '' as StaffRole | '',
    avatar_url: '',
  })

  const [championInput, setChampionInput] = useState('')

  useEffect(() => {
    fetchTeams()
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('name')
    setTeams(data || [])
  }

  const fetchUser = async () => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data && !error) {
      setFormData({
        username: data.username,
        password: '', // Don't populate password for security
        role: data.role,
        in_game_name: data.in_game_name || '',
        team_id: data.team_id || '',
        position: data.position || '',
        is_igl: data.is_igl || false,
        is_substitute: data.is_substitute || false,
        nationality: data.nationality || '',
        champion_pool: data.champion_pool || [],
        rank: data.rank || '',
        valorant_tracker_url: data.valorant_tracker_url || '',
        twitter_url: data.twitter_url || '',
        staff_role: data.staff_role || '',
        avatar_url: data.avatar_url || '',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (userId) {
        // Update existing user
        const updates: any = {
          updated_at: new Date().toISOString(),
          avatar_url: formData.avatar_url || null,
        }

        // Update additional fields based on role
        if (formData.role === 'player') {
          updates.in_game_name = formData.in_game_name || null
          updates.team_id = formData.team_id || null
          updates.position = formData.position || null
          updates.is_igl = formData.is_igl
          updates.is_substitute = formData.is_substitute
          updates.nationality = formData.nationality || null
          updates.champion_pool = formData.champion_pool.length > 0 ? formData.champion_pool : null
          updates.rank = formData.rank || null
          updates.valorant_tracker_url = formData.valorant_tracker_url || null
          updates.twitter_url = formData.twitter_url || null
        }

        // Include manager-specific fields if user is a manager
        if (formData.role === 'manager') {
          updates.team_id = formData.team_id || null
          updates.staff_role = formData.staff_role || null
          updates.nationality = formData.nationality || null
          updates.valorant_tracker_url = formData.valorant_tracker_url || null
          updates.twitter_url = formData.twitter_url || null
        }

        // Only update password if provided
        if (formData.password) {
          const { data: updateData, error: updateError } = await supabase.rpc('update_password', {
            p_user_id: userId,
            p_old_password: '', // Admin doesn't need old password
            p_new_password: formData.password
          })
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)

        if (error) throw error
      } else {
        // Create new user
        if (!formData.username || !formData.password) {
          alert('Username and password are required')
          setLoading(false)
          return
        }

        console.log('Creating user with role:', formData.role)
        console.log('Form data:', formData)

        const { data, error } = await supabase.rpc('create_user', {
          p_username: formData.username,
          p_password: formData.password,
          p_role: formData.role
        })

        if (error) throw error

        const newUserId = data
        console.log('New user ID:', newUserId)

        // Update additional fields for all users (player-specific fields only set for players)
        const updates: any = {
          avatar_url: formData.avatar_url || null,
        }
        
        if (formData.role === 'player') {
          updates.in_game_name = formData.in_game_name || null
          updates.team_id = formData.team_id || null
          updates.position = formData.position || null
          updates.is_igl = formData.is_igl
          updates.is_substitute = formData.is_substitute
          updates.nationality = formData.nationality || null
          updates.champion_pool = formData.champion_pool.length > 0 ? formData.champion_pool : null
          updates.rank = formData.rank || null
          updates.valorant_tracker_url = formData.valorant_tracker_url || null
          updates.twitter_url = formData.twitter_url || null
        }

        if (formData.role === 'manager') {
          updates.team_id = formData.team_id || null
          updates.staff_role = formData.staff_role || null
          updates.nationality = formData.nationality || null
          updates.valorant_tracker_url = formData.valorant_tracker_url || null
          updates.twitter_url = formData.twitter_url || null
        }

        console.log('Updates to apply:', updates)

        // Only update if there are fields to update
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', newUserId)

          if (updateError) {
            console.error('Update error:', updateError)
            throw updateError
          }
          
          console.log('Update successful')
        } else {
          console.log('No updates to apply (non-player role)')
        }
      }

      router.push('/dashboard/admin/users')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving user:', error)
      alert(error.message || 'Error saving user')
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Account Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username *
            </label>
            <input
              type="text"
              required
              disabled={!!userId}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {userId ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              required={!userId}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
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
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-gray-500">Recommended: Square image, at least 256x256px</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Type *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="player">Player</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Player Information - Only show for players */}
        {formData.role === 'player' && (
        <>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Player Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              In-Game Name
            </label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team
            </label>
            <select
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">No Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as ValorantRole })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Role</option>
              {VALORANT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_igl"
              checked={formData.is_igl}
              onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
              className="w-4 h-4 text-primary bg-dark-card border-gray-800 rounded focus:ring-primary"
            />
            <label htmlFor="is_igl" className="ml-2 text-sm font-medium text-gray-300">
              IGL (In-Game Leader)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_substitute"
              checked={formData.is_substitute}
              onChange={(e) => setFormData({ ...formData, is_substitute: e.target.checked })}
              className="w-4 h-4 text-primary bg-dark-card border-gray-800 rounded focus:ring-primary"
            />
            <label htmlFor="is_substitute" className="ml-2 text-sm font-medium text-gray-300">
              Substitute Player
            </label>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Additional Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nationality
            </label>
            <select
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Country</option>
              {EUROPEAN_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
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
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Rank</option>
              {VALORANT_RANKS.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Pool
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={championInput}
                onChange={(e) => setChampionInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="">Select agent...</option>
                {VALORANT_AGENTS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addChampion}
                disabled={!championInput}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.champion_pool.map((champion) => (
                <span
                  key={champion}
                  className="px-3 py-1 bg-dark border border-gray-800 rounded-full text-sm text-white flex items-center gap-2"
                >
                  {champion}
                  <button
                    type="button"
                    onClick={() => removeChampion(champion)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Links</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valorant Tracker URL
            </label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              placeholder="https://tracker.gg/valorant/profile/..."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter/X URL
            </label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              placeholder="https://x.com/..."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        </>
        )}

        {/* Manager Information - Only show for managers */}
        {formData.role === 'manager' && (
        <>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Manager Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team
            </label>
            <select
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">No Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Staff Role
            </label>
            <select
              value={formData.staff_role}
              onChange={(e) => setFormData({ ...formData, staff_role: e.target.value as StaffRole })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Role</option>
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Details for Managers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Additional Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nationality
            </label>
            <select
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Country</option>
              {EUROPEAN_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Links for Managers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Links</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valorant Tracker URL
            </label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              placeholder="https://tracker.gg/valorant/profile/..."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter/X URL
            </label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              placeholder="https://x.com/..."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        </>
        )}
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
              {userId ? 'Update User' : 'Create User'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
