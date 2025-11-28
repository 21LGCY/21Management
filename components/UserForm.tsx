'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValorantRole, ValorantRank, UserRole, StaffRole } from '@/lib/types/database'
import { Save, X, User, Shield, Award, Link as LinkIcon, Globe } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Account Information Section */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Account Information</h3>
            <p className="text-xs text-gray-400">Basic account credentials and settings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!userId}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {userId && (
              <p className="mt-1.5 text-xs text-gray-500">Username cannot be changed</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {userId ? 'New Password' : 'Password'} {!userId && <span className="text-red-400">*</span>}
            </label>
            <input
              type="password"
              required={!userId}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={userId ? 'Leave blank to keep current' : ''}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {userId && (
              <p className="mt-1.5 text-xs text-gray-500">Leave blank to keep current password</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Type <span className="text-red-400">*</span>
            </label>
            <CustomSelect
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              options={[
                { value: 'player', label: 'Player' },
                { value: 'manager', label: 'Manager' },
                { value: 'admin', label: 'Admin' }
              ]}
              className="w-full"
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
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="mt-1.5 text-xs text-gray-500">Square image, at least 256x256px recommended</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nationality
            </label>
            <SearchableCountrySelect
              value={formData.nationality}
              onChange={(value) => setFormData({ ...formData, nationality: value })}
              countries={EUROPEAN_COUNTRIES}
            />
          </div>
        </div>
      </div>

        {/* Player Information - Only show for players */}
        {formData.role === 'player' && (
        <>
        {/* Player Details Section */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Player Information</h3>
              <p className="text-xs text-gray-400">In-game details and team assignment</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                In-Game Name
              </label>
              <input
                type="text"
                value={formData.in_game_name}
                onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
                placeholder="IGN"
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team
              </label>
              <CustomSelect
                value={formData.team_id}
                onChange={(value) => setFormData({ ...formData, team_id: value })}
                options={[
                  { value: '', label: 'No Team' },
                  ...teams.map(team => ({
                    value: team.id,
                    label: team.name
                  }))
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position
              </label>
              <CustomSelect
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value as ValorantRole })}
                options={[
                  { value: '', label: 'Select Position' },
                  ...VALORANT_ROLES.map(role => ({
                    value: role,
                    label: role
                  }))
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rank
              </label>
              <CustomSelect
                value={formData.rank}
                onChange={(value) => setFormData({ ...formData, rank: value as ValorantRank })}
                options={[
                  { value: '', label: 'Select Rank' },
                  ...VALORANT_RANKS.map(rank => ({
                    value: rank,
                    label: rank
                  }))
                ]}
                className="w-full"
              />
            </div>

            {/* Agent Pool */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Agent Pool
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <CustomSelect
                    value={championInput}
                    onChange={(value) => setChampionInput(value)}
                    options={[
                      { value: '', label: 'Select agent...' },
                      ...VALORANT_AGENTS.map(agent => ({
                        value: agent,
                        label: agent
                      }))
                    ]}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={addChampion}
                    disabled={!championInput}
                    className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  >
                    Add
                  </button>
                </div>
                {formData.champion_pool.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-dark/50 border border-gray-800 rounded-lg">
                    {formData.champion_pool.map((champion) => (
                      <span
                        key={champion}
                        className="group px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2 hover:bg-primary/20 transition-all"
                      >
                        {champion}
                        <button
                          type="button"
                          onClick={() => removeChampion(champion)}
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

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-3 p-3 bg-dark/50 border border-gray-800 rounded-lg cursor-pointer hover:border-primary/50 transition-all group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="is_igl"
                    checked={formData.is_igl}
                    onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
                    className="w-5 h-5 text-primary bg-dark border-gray-700 rounded focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">IGL (In-Game Leader)</span>
                  <p className="text-xs text-gray-500">This player leads the team strategy</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-dark/50 border border-gray-800 rounded-lg cursor-pointer hover:border-primary/50 transition-all group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="is_substitute"
                    checked={formData.is_substitute}
                    onChange={(e) => setFormData({ ...formData, is_substitute: e.target.checked })}
                    className="w-5 h-5 text-primary bg-dark border-gray-700 rounded focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Substitute Player</span>
                  <p className="text-xs text-gray-500">Backup roster member</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <LinkIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Links & Profiles</h3>
              <p className="text-xs text-gray-400">External profile links</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valorant Tracker URL
              </label>
              <input
                type="url"
                value={formData.valorant_tracker_url}
                onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
                placeholder="https://tracker.gg/valorant/profile/..."
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>
        </>
        )}

        {/* Manager Information - Only show for managers */}
        {formData.role === 'manager' && (
        <>
        {/* Manager Details Section */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Manager Information</h3>
              <p className="text-xs text-gray-400">Team assignment and staff role</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team
              </label>
              <CustomSelect
                value={formData.team_id}
                onChange={(value) => setFormData({ ...formData, team_id: value })}
                options={[
                  { value: '', label: 'No Team' },
                  ...teams.map(team => ({
                    value: team.id,
                    label: team.name
                  }))
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Staff Role
              </label>
              <CustomSelect
                value={formData.staff_role}
                onChange={(value) => setFormData({ ...formData, staff_role: value as StaffRole })}
                options={[
                  { value: '', label: 'Select Role' },
                  ...STAFF_ROLES.map(role => ({
                    value: role,
                    label: role
                  }))
                ]}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Links for Managers */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <LinkIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Links & Profiles</h3>
              <p className="text-xs text-gray-400">External profile links</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valorant Tracker URL
              </label>
              <input
                type="url"
                value={formData.valorant_tracker_url}
                onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
                placeholder="https://tracker.gg/valorant/profile/..."
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>
        </>
        )}

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
