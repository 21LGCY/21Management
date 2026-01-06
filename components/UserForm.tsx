'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole, StaffRole } from '@/lib/types/database'
import { GameType, getGameConfig, DEFAULT_GAME } from '@/lib/types/games'
import { Save, X, User, Shield, Award, Link as LinkIcon, Globe, Gamepad2 } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'
import { useTranslations } from 'next-intl'

interface UserFormProps {
  userId?: string
}

const STAFF_ROLES: StaffRole[] = ['Coach', 'Manager', 'Analyst']

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
  const t = useTranslations('forms')
  const tCommon = useTranslations('common')
  const tRoles = useTranslations('roles')
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [gameType, setGameType] = useState<GameType>(DEFAULT_GAME)
  
  // Get game config based on current game
  const gameConfig = getGameConfig(gameType)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'player' as UserRole,
    in_game_name: '',
    team_id: '',
    position: '',
    is_igl: false,
    is_substitute: false,
    nationality: '',
    character_pool: [] as string[],
    rank: '',
    tracker_url: '',
    twitter_url: '',
    staff_role: '' as StaffRole | '',
    avatar_url: '',
    game: DEFAULT_GAME as GameType,
  })

  const [championInput, setChampionInput] = useState('')

  useEffect(() => {
    fetchTeams()
    if (userId) {
      fetchUser()
    }
  }, [userId])

  // Update game type when team changes
  useEffect(() => {
    if (formData.team_id) {
      const selectedTeam = teams.find(t => t.id === formData.team_id)
      if (selectedTeam?.game) {
        setGameType(selectedTeam.game)
        setFormData(prev => ({ ...prev, game: selectedTeam.game }))
      }
    }
  }, [formData.team_id, teams])

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*, game')
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
      const userGame = (data.game as GameType) || DEFAULT_GAME
      setGameType(userGame)
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
        character_pool: data.character_pool || data.champion_pool || [],
        rank: data.rank || '',
        tracker_url: data.tracker_url || data.valorant_tracker_url || '',
        twitter_url: data.twitter_url || '',
        staff_role: data.staff_role || '',
        avatar_url: data.avatar_url || '',
        game: userGame,
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
          updates.character_pool = formData.character_pool.length > 0 ? formData.character_pool : null
          updates.champion_pool = formData.character_pool.length > 0 ? formData.character_pool : null // Legacy
          updates.rank = formData.rank || null
          updates.tracker_url = formData.tracker_url || null
          updates.valorant_tracker_url = formData.tracker_url || null // Legacy
          updates.twitter_url = formData.twitter_url || null
          updates.game = formData.game
        }

        // Include manager-specific fields if user is a manager
        if (formData.role === 'manager') {
          updates.team_id = formData.team_id || null
          updates.staff_role = formData.staff_role || null
          updates.nationality = formData.nationality || null
          updates.tracker_url = formData.tracker_url || null
          updates.valorant_tracker_url = formData.tracker_url || null // Legacy
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
          alert(t('usernamePasswordRequired'))
          setLoading(false)
          return
        }

        const { data, error } = await supabase.rpc('create_user', {
          p_username: formData.username,
          p_password: formData.password,
          p_role: formData.role
        })

        if (error) throw error

        const newUserId = data

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
          updates.character_pool = formData.character_pool.length > 0 ? formData.character_pool : null
          updates.champion_pool = formData.character_pool.length > 0 ? formData.character_pool : null // Legacy
          updates.rank = formData.rank || null
          updates.tracker_url = formData.tracker_url || null
          updates.valorant_tracker_url = formData.tracker_url || null // Legacy
          updates.twitter_url = formData.twitter_url || null
          updates.game = formData.game
        }

        if (formData.role === 'manager') {
          updates.team_id = formData.team_id || null
          updates.staff_role = formData.staff_role || null
          updates.nationality = formData.nationality || null
          updates.tracker_url = formData.tracker_url || null
          updates.valorant_tracker_url = formData.tracker_url || null // Legacy
          updates.twitter_url = formData.twitter_url || null
        }

        // Only update if there are fields to update
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', newUserId)

          if (updateError) {
            throw updateError
          }
        }
      }

      router.push('/dashboard/admin/users')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving user:', error)
      alert(error.message || t('errorSavingUser'))
    } finally {
      setLoading(false)
    }
  }

  const addChampion = () => {
    if (championInput.trim() && !formData.character_pool.includes(championInput.trim())) {
      setFormData({
        ...formData,
        character_pool: [...formData.character_pool, championInput.trim()]
      })
      setChampionInput('')
    }
  }

  const removeChampion = (champion: string) => {
    setFormData({
      ...formData,
      character_pool: formData.character_pool.filter(c => c !== champion)
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
            <h3 className="text-lg font-semibold text-white">{t('accountInfo')}</h3>
            <p className="text-xs text-gray-400">{t('accountInfoDescUser')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('username')} <span className="text-red-400">*</span>
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
              <p className="mt-1.5 text-xs text-gray-500">{t('usernameCannotChange')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {userId ? t('newPassword') : t('password')} {!userId && <span className="text-red-400">*</span>}
            </label>
            <input
              type="password"
              required={!userId}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={userId ? t('leaveBlankToKeep') : ''}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {userId && (
              <p className="mt-1.5 text-xs text-gray-500">{t('leaveBlankToKeep')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('userRole')} <span className="text-red-400">*</span>
            </label>
            <CustomSelect
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              options={[
                { value: 'player', label: tRoles('player') },
                { value: 'manager', label: tRoles('manager') },
                { value: 'admin', label: tRoles('admin') }
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('avatarUrl')}
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder={t('avatarUrlPlaceholder')}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="mt-1.5 text-xs text-gray-500">{t('avatarRecommendation')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('nationality')}
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
              <h3 className="text-lg font-semibold text-white">{t('playerInfo')}</h3>
              <p className="text-xs text-gray-400">{t('playerInfoDesc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('inGameName')}
              </label>
              <input
                type="text"
                value={formData.in_game_name}
                onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
                placeholder={t('enterValorantUsername')}
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
                    label: `${team.name} ${team.game ? `(${team.game.toUpperCase()})` : ''}`
                  }))
                ]}
                className="w-full"
              />
              {formData.team_id && (
                <div className="mt-2 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {t('game')}: <span className="text-primary font-medium">{gameConfig.name}</span>
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('rolePosition')}
              </label>
              <CustomSelect
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value })}
                options={[
                  { value: '', label: t('selectRole') },
                  ...gameConfig.roles.map(role => ({
                    value: role,
                    label: role
                  }))
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('rank')}
              </label>
              <CustomSelect
                value={formData.rank}
                onChange={(value) => setFormData({ ...formData, rank: value })}
                options={[
                  { value: '', label: t('selectRank') },
                  ...gameConfig.ranks.map(rank => ({
                    value: rank,
                    label: rank
                  }))
                ]}
                className="w-full"
              />
            </div>

            {/* Agent/Weapon Pool */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {gameType === 'valorant' ? t('agentPool') : t('weaponPool')}
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <CustomSelect
                    value={championInput}
                    onChange={(value) => setChampionInput(value)}
                    options={[
                      { value: '', label: gameType === 'valorant' ? t('selectAgent') : t('selectWeapon') },
                      ...gameConfig.characters.filter(char => !formData.character_pool.includes(char)).map(char => ({
                        value: char,
                        label: char
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
                    {tCommon('add')}
                  </button>
                </div>
                {formData.character_pool.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-dark/50 border border-gray-800 rounded-lg">
                    {formData.character_pool.map((item) => (
                      <span
                        key={item}
                        className="group px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2 hover:bg-primary/20 transition-all"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChampion(item)}
                          className="opacity-70 group-hover:opacity-100 hover:text-red-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {formData.character_pool.length === 0 && (
                  <div className="p-4 bg-dark/30 border border-gray-800 rounded-lg text-center">
                    <p className="text-sm text-gray-500">{gameType === 'valorant' ? t('noAgentsAdded') : t('noWeaponsAdded')}</p>
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
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{t('igl')}</span>
                  <p className="text-xs text-gray-500">{t('iglDesc')}</p>
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
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{t('substitute')}</span>
                  <p className="text-xs text-gray-500">{t('substituteDesc')}</p>
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
              <h3 className="text-lg font-semibold text-white">{t('linksProfiles')}</h3>
              <p className="text-xs text-gray-400">{t('linksProfilesDesc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {gameType === 'valorant' ? t('valorantTrackerUrl') : t('trackerUrl')}
              </label>
              <input
                type="url"
                value={formData.tracker_url}
                onChange={(e) => setFormData({ ...formData, tracker_url: e.target.value })}
                placeholder={gameType === 'valorant' ? 'https://tracker.gg/valorant/profile/...' : 'https://csstats.gg/player/...'}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('twitterUrl')}
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
              <h3 className="text-lg font-semibold text-white">{t('managerInfo')}</h3>
              <p className="text-xs text-gray-400">{t('managerInfoDesc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('assignedTeam')}
              </label>
              <CustomSelect
                value={formData.team_id}
                onChange={(value) => setFormData({ ...formData, team_id: value })}
                options={[
                  { value: '', label: t('noTeam') },
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
                {t('staffRole')}
              </label>
              <CustomSelect
                value={formData.staff_role}
                onChange={(value) => setFormData({ ...formData, staff_role: value as StaffRole })}
                options={[
                  { value: '', label: t('selectRole') },
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
              <h3 className="text-lg font-semibold text-white">{t('linksProfiles')}</h3>
              <p className="text-xs text-gray-400">{t('linksProfilesDesc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('trackerUrl')}
              </label>
              <input
                type="url"
                value={formData.tracker_url}
                onChange={(e) => setFormData({ ...formData, tracker_url: e.target.value })}
                placeholder="https://tracker.gg/..."
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('twitterUrl')}
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
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg shadow-primary/20"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {userId ? t('updateUser') : t('createUser')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
