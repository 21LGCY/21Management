'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { GameType, getGameConfig, DEFAULT_GAME } from '@/lib/types/games'
import { Save, X, Plus, User, Gamepad2, Link as LinkIcon } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'

interface PlayerFormProps {
  teamId: string
  teamName?: string
  playerId?: string
}

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

export default function PlayerForm({ teamId, teamName, playerId }: PlayerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [gameType, setGameType] = useState<GameType>(DEFAULT_GAME)
  const t = useTranslations('forms')
  const tCommon = useTranslations('common')
  
  // Get game configuration based on selected game
  const gameConfig = getGameConfig(gameType)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    in_game_name: '',
    position: '',
    is_igl: false,
    is_substitute: false,
    nationality: '',
    champion_pool: [] as string[], // Legacy field
    character_pool: [] as string[], // New generic field
    rank: '',
    valorant_tracker_url: '', // Legacy field
    tracker_url: '', // New generic field
    twitter_url: '',
    avatar_url: '',
    game: DEFAULT_GAME as GameType,
  })

  const [championInput, setChampionInput] = useState('')

  // Load team's game type on mount
  useEffect(() => {
    loadTeamGame()
  }, [teamId])

  // Load player data when editing
  useEffect(() => {
    if (playerId) {
      loadPlayerData()
    }
  }, [playerId])

  const loadTeamGame = async () => {
    const { data: team } = await supabase
      .from('teams')
      .select('game')
      .eq('id', teamId)
      .single()
    
    if (team?.game) {
      const game = team.game as GameType
      setGameType(game)
      setFormData(prev => ({ ...prev, game }))
    }
  }

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
      character_pool: player.character_pool || player.champion_pool || [],
      rank: player.rank || '',
      valorant_tracker_url: player.valorant_tracker_url || '',
      tracker_url: player.tracker_url || player.valorant_tracker_url || '',
      twitter_url: player.twitter_url || '',
      avatar_url: player.avatar_url || '',
      game: (player.game as GameType) || gameType,
    })
    
    // Update game type from player data
    if (player.game) {
      setGameType(player.game as GameType)
    }
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
          champion_pool: formData.character_pool.length > 0 ? formData.character_pool : null, // Legacy
          character_pool: formData.character_pool.length > 0 ? formData.character_pool : null, // New
          rank: formData.rank || null,
          valorant_tracker_url: formData.tracker_url || null, // Legacy
          tracker_url: formData.tracker_url || null, // New
          twitter_url: formData.twitter_url || null,
          avatar_url: formData.avatar_url || null,
          game: gameType,
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
          alert(t('usernamePasswordRequired'))
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
          champion_pool: formData.character_pool.length > 0 ? formData.character_pool : null, // Legacy
          character_pool: formData.character_pool.length > 0 ? formData.character_pool : null, // New
          rank: formData.rank || null,
          valorant_tracker_url: formData.tracker_url || null, // Legacy
          tracker_url: formData.tracker_url || null, // New
          twitter_url: formData.twitter_url || null,
          avatar_url: formData.avatar_url || null,
          game: gameType,
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', newUserId)

        if (updateError) throw updateError

        alert(t('playerCreated'))
        router.push('/dashboard/manager/players')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error saving player:', error)
      alert(error.message || t('errorSavingPlayer'))
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Information - Only show for new players */}
      {!playerId && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('accountInfo')}</h2>
              <p className="text-xs text-gray-400">{t('accountInfoDesc')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('username')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder={t('enterUsername')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('password')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder={t('enterPassword')}
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
            <h2 className="text-lg font-semibold text-white">{t('basicInfo')}</h2>
            <p className="text-xs text-gray-400">{t('basicInfoDesc')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('inGameName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={t('enterValorantUsername')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('nationality')}</label>
            <SearchableCountrySelect
              value={formData.nationality}
              onChange={(value) => setFormData({ ...formData, nationality: value })}
              countries={EUROPEAN_COUNTRIES}
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
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={t('avatarUrlPlaceholder')}
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
            <h2 className="text-lg font-semibold text-white">{t('gameInfo')}</h2>
            <p className="text-xs text-gray-400">
              {gameType === 'valorant' ? t('gameInfoDesc') : t('gameInfoDescCS2') || t('gameInfoDesc')}
            </p>
          </div>
          {/* Game badge */}
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            gameType === 'valorant' 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {gameConfig.shortName}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('rolePosition')}</label>
            <CustomSelect
              value={formData.position}
              onChange={(value) => setFormData({ ...formData, position: value })}
              placeholder={t('selectRole')}
              options={[
                { value: '', label: t('selectRole') },
                ...gameConfig.roles.map(role => ({ value: role, label: role }))
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('rank')}</label>
            <CustomSelect
              value={formData.rank}
              onChange={(value) => setFormData({ ...formData, rank: value })}
              placeholder={t('selectRank')}
              options={[
                { value: '', label: t('selectRank') },
                ...gameConfig.ranks.map(rank => ({ value: rank, label: rank }))
              ]}
              className="w-full"
            />
          </div>
        </div>

        {/* Character/Weapon Pool */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {gameType === 'valorant' ? t('agentPool') : t('weaponPool')}
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <CustomSelect
                value={championInput}
                onChange={(value) => setChampionInput(value)}
                placeholder={gameType === 'valorant' ? t('selectAgentToAdd') : t('selectWeaponToAdd')}
                options={[
                  { value: '', label: gameType === 'valorant' ? t('selectAgent') : t('selectWeapon') },
                  ...gameConfig.characters.filter(char => !formData.character_pool.includes(char)).map(char => ({ value: char, label: char }))
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
                <p className="text-sm text-gray-500">
                  {gameType === 'valorant' ? t('noAgentsAdded') : t('noWeaponsAdded')}
                </p>
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
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{t('igl')}</span>
              <p className="text-xs text-gray-500">{t('iglDesc')}</p>
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
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{t('substitute')}</span>
              <p className="text-xs text-gray-500">{t('substituteDesc')}</p>
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
            <h2 className="text-lg font-semibold text-white">{t('contactLinks')}</h2>
            <p className="text-xs text-gray-400">{t('contactLinksDesc')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {gameConfig.trackerUrlLabel}
            </label>
            <input
              type="url"
              value={formData.tracker_url}
              onChange={(e) => setFormData({ ...formData, tracker_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={gameConfig.trackerUrlPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('twitterUrl')}</label>
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
              {playerId ? t('updating') : t('creating')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {playerId ? t('updatePlayer') : t('createPlayer')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}