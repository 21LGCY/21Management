'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TeamCategory, TryoutStatus } from '@/lib/types/database'
import { 
  GameType, 
  GAME_CONFIGS, 
  getGameConfig,
  CS2_FACEIT_LEVELS,
  FaceitLevel,
  getFaceitLevelImage
} from '@/lib/types/games'
import { ArrowLeft, Plus, X, User, Gamepad2, Link as LinkIcon, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'
import { useTranslations } from 'next-intl'

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

// Helper function to determine game from team category
export const getGameFromTeamCategory = (teamCategory: TeamCategory): GameType => {
  return teamCategory === '21CS2' ? 'cs2' : 'valorant'
}

export default function NewScoutForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; username: string }>>([])
  const [managerUsers, setManagerUsers] = useState<Array<{ id: string; username: string }>>([])
  const t = useTranslations('tryouts')
  const tForm = useTranslations('tryouts.form')
  const tCommon = useTranslations('common')
  const tRoles = useTranslations('roles')
  
  const [formData, setFormData] = useState({
    username: '',
    team_category: '21L' as TeamCategory,
    game: 'valorant' as GameType,
    in_game_name: '',
    position: '',
    is_igl: false,
    nationality: '',
    champion_pool: [] as string[],
    rank: '',
    // Valorant specific
    valorant_tracker_url: '',
    // CS2 specific
    faceit_level: '' as string,
    steam_url: '',
    faceit_url: '',
    // Common
    twitter_url: '',
    status: 'not_contacted' as TryoutStatus,
    managed_by: '',
    contacted_by: '',
    contacted_by_date: '',
    notes: '',
    links: '',
  })
  const [characterInput, setCharacterInput] = useState('')

  // Get current game config based on selected team
  const currentGame = useMemo(() => getGameFromTeamCategory(formData.team_category), [formData.team_category])
  const gameConfig = useMemo(() => getGameConfig(currentGame), [currentGame])

  // Update game when team changes and reset game-specific fields
  useEffect(() => {
    const newGame = getGameFromTeamCategory(formData.team_category)
    if (newGame !== formData.game) {
      setFormData(prev => ({
        ...prev,
        game: newGame,
        // Reset game-specific fields
        position: '',
        rank: '',
        champion_pool: [],
        valorant_tracker_url: '',
        faceit_level: '',
        steam_url: '',
        faceit_url: '',
      }))
      setCharacterInput('')
    }
  }, [formData.team_category, formData.game])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('role', 'admin')
        .order('username')

      if (adminError) throw adminError
      setAdminUsers(admins || [])

      const { data: managers, error: managerError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('role', 'manager')
        .order('username')

      if (managerError) throw managerError
      setManagerUsers(managers || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const insertData: Record<string, unknown> = {
        username: formData.username,
        team_category: formData.team_category,
        game: currentGame,
        in_game_name: formData.in_game_name || null,
        position: formData.position || null,
        is_igl: formData.is_igl,
        nationality: formData.nationality || null,
        champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
        rank: formData.rank || null,
        twitter_url: formData.twitter_url || null,
        status: formData.status,
        managed_by: formData.managed_by || null,
        contacted_by: formData.contacted_by || null,
        last_contact_date: formData.contacted_by_date || null,
        notes: formData.notes || null,
        links: formData.links || null,
      }

      // Add game-specific fields
      if (currentGame === 'valorant') {
        insertData.valorant_tracker_url = formData.valorant_tracker_url || null
      } else if (currentGame === 'cs2') {
        insertData.faceit_level = formData.faceit_level ? parseInt(formData.faceit_level) : null
        insertData.steam_url = formData.steam_url || null
        insertData.faceit_url = formData.faceit_url || null
      }

      console.log('Inserting data:', JSON.stringify(insertData, null, 2))
      
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .insert([insertData])
        .select()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Insert successful:', data)
      router.push('/dashboard/admin/tryouts?tab=scouting')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating scout profile:', error)
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      alert(`${tForm('errorCreating')} ${error?.message || ''}`)
    } finally {
      setLoading(false)
    }
  }

  const addCharacter = () => {
    if (characterInput.trim() && !formData.champion_pool.includes(characterInput.trim())) {
      setFormData({
        ...formData,
        champion_pool: [...formData.champion_pool, characterInput.trim()]
      })
      setCharacterInput('')
    }
  }

  const removeCharacter = (character: string) => {
    setFormData({ 
      ...formData, 
      champion_pool: formData.champion_pool.filter(c => c !== character) 
    })
  }

  // Get role options based on current game
  const getRoleOptions = () => {
    const roles = gameConfig.roles
    return [
      { value: '', label: tForm('select') },
      ...roles.map(role => ({
        value: role,
        label: role
      })),
      { value: 'Staff', label: tRoles('staff') }
    ]
  }

  // Get rank options based on current game
  const getRankOptions = () => {
    const ranks = gameConfig.ranks
    return [
      { value: '', label: tForm('select') },
      ...ranks.map(rank => ({
        value: rank,
        label: rank
      }))
    ]
  }

  // Get character options based on current game
  const getCharacterOptions = () => {
    const characters = gameConfig.characters
    return [
      { value: '', label: `${tForm('select')} ${gameConfig.characterLabel}` },
      ...characters.map(char => ({
        value: char,
        label: char
      }))
    ]
  }

  // Get Faceit level options
  const getFaceitLevelOptions = () => {
    return [
      { value: '', label: tForm('select') },
      ...CS2_FACEIT_LEVELS.map(level => ({
        value: level.toString(),
        label: `Level ${level}`
      }))
    ]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header with game indicator */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/admin/tryouts?tab=scouting" 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {tCommon('back')}
        </Link>
        
        {/* Game Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
          currentGame === 'valorant' 
            ? 'bg-[#ff4655]/10 border-[#ff4655]/30 text-[#ff4655]' 
            : 'bg-[#de9b35]/10 border-[#de9b35]/30 text-[#de9b35]'
        }`}>
          <Gamepad2 className="w-4 h-4" />
          <span className="font-semibold">{gameConfig.name}</span>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{tForm('basicInfo')}</h2>
            <p className="text-xs text-gray-400">{tForm('basicInfoDesc')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tForm('username')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={tForm('discordUsername')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tForm('team')} <span className="text-red-400">*</span>
            </label>
            <CustomSelect
              value={formData.team_category}
              onChange={(value) => setFormData({ ...formData, team_category: value as TeamCategory })}
              options={[
                { value: '21L', label: '21L' },
                { value: '21GC', label: '21GC' },
                { value: '21ACA', label: '21 ACA' },
                { value: '21CS2', label: '21 CS2' }
              ]}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {currentGame === 'cs2' ? '🎮 Counter-Strike 2' : '🎮 Valorant'} mode
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('inGameName')}</label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={gameConfig.usernamePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('nationality')}</label>
            <SearchableCountrySelect
              value={formData.nationality}
              onChange={(value) => setFormData({ ...formData, nationality: value })}
              countries={EUROPEAN_COUNTRIES}
            />
          </div>
        </div>
      </div>

      {/* Game Information Section */}
      <div className={`bg-gradient-to-br from-dark-card via-dark-card border border-gray-800 rounded-xl p-6 shadow-xl ${
        currentGame === 'valorant' ? 'to-[#ff4655]/5' : 'to-[#de9b35]/5'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${
            currentGame === 'valorant' ? 'bg-[#ff4655]/10' : 'bg-[#de9b35]/10'
          }`}>
            <Gamepad2 className={`w-5 h-5 ${
              currentGame === 'valorant' ? 'text-[#ff4655]' : 'text-[#de9b35]'
            }`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{tForm('gameInfo')}</h2>
            <p className="text-xs text-gray-400">{gameConfig.name} - {tForm('gameInfoDesc')}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Position/Role */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('position')}</label>
              <CustomSelect
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value })}
                options={getRoleOptions()}
                className="w-full"
              />
            </div>

            {/* Rank - Valorant only shows rank, CS2 shows Faceit level */}
            {currentGame === 'valorant' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('rank')}</label>
                <CustomSelect
                  value={formData.rank}
                  onChange={(value) => setFormData({ ...formData, rank: value })}
                  options={getRankOptions()}
                  className="w-full"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Faceit Level</label>
                <div className="flex items-center gap-3">
                  <CustomSelect
                    value={formData.faceit_level}
                    onChange={(value) => setFormData({ ...formData, faceit_level: value })}
                    options={getFaceitLevelOptions()}
                    className="flex-1"
                  />
                  {formData.faceit_level && (
                    <div className="w-12 h-12 flex-shrink-0">
                      <Image
                        src={getFaceitLevelImage(parseInt(formData.faceit_level) as FaceitLevel)}
                        alt={`Faceit Level ${formData.faceit_level}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CS2: Also show MM Rank */}
          {currentGame === 'cs2' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('rank')} (Premier/MM)</label>
                <CustomSelect
                  value={formData.rank}
                  onChange={(value) => setFormData({ ...formData, rank: value })}
                  options={getRankOptions()}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* IGL Checkbox */}
          <label className="flex items-center gap-3 p-3 bg-dark/50 border border-gray-800 rounded-lg cursor-pointer hover:border-primary/50 transition-all group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.is_igl}
                onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
                className="w-5 h-5 text-primary bg-dark border-gray-700 rounded focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{tForm('inGameLeader')}</span>
              <p className="text-xs text-gray-500">{tForm('iglMarked')}</p>
            </div>
          </label>

          {/* Character Pool - Only for Valorant */}
          {gameConfig.hasCharacterPool && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {gameConfig.characterLabel} Pool
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <CustomSelect
                    value={characterInput}
                    onChange={(value) => setCharacterInput(value)}
                    options={getCharacterOptions()}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={addCharacter}
                    disabled={!characterInput}
                    className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  >
                    {tCommon('add')}
                  </button>
                </div>
                {formData.champion_pool.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-dark/50 border border-gray-800 rounded-lg">
                    {formData.champion_pool.map((char) => (
                      <span
                        key={char}
                        className="group px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2 hover:bg-primary/20 transition-all"
                      >
                        {char}
                        <button
                          type="button"
                          onClick={() => removeCharacter(char)}
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
                    <p className="text-sm text-gray-500">{tForm('noAgentsAdded')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact & Links Section */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <LinkIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{tForm('contactLinks')}</h2>
            <p className="text-xs text-gray-400">{tForm('contactLinksDesc')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game-specific tracker URLs */}
          {currentGame === 'valorant' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{gameConfig.trackerUrlLabel}</label>
              <input
                type="url"
                value={formData.valorant_tracker_url}
                onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder={gameConfig.trackerUrlPlaceholder}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{gameConfig.steamUrlLabel}</label>
                <input
                  type="url"
                  value={formData.steam_url}
                  onChange={(e) => setFormData({ ...formData, steam_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="https://steamcommunity.com/id/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{gameConfig.faceitUrlLabel}</label>
                <input
                  type="url"
                  value={formData.faceit_url}
                  onChange={(e) => setFormData({ ...formData, faceit_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder={gameConfig.trackerUrlPlaceholder}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('twitterUrl')}</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div className={currentGame === 'valorant' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('otherLinks')}</label>
            <input
              type="text"
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={tForm('otherLinksPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Management Section */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-orange-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Settings className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{tForm('management')}</h2>
            <p className="text-xs text-gray-400">{tForm('managementDesc')}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('status')}</label>
              <CustomSelect
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as TryoutStatus })}
                options={[
                  { value: 'not_contacted', label: t('notContacted') },
                  { value: 'contacted', label: t('contacted') },
                  { value: 'in_tryouts', label: t('inTryouts') },
                  { value: 'substitute', label: t('substitute') },
                  { value: 'rejected', label: t('rejected') },
                  { value: 'left', label: t('left') },
                  { value: 'accepted', label: t('player') }
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('addedBy')}</label>
              <CustomSelect
                value={formData.managed_by}
                onChange={(value) => setFormData({ ...formData, managed_by: value })}
                options={[
                  { value: '', label: tForm('none') },
                  ...adminUsers.map(user => ({
                    value: user.username,
                    label: `Admin: ${user.username}`
                  })),
                  ...managerUsers.map(user => ({
                    value: user.username,
                    label: `Manager: ${user.username}`
                  }))
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('contactedBy')}</label>
              <CustomSelect
                value={formData.contacted_by}
                onChange={(value) => setFormData({ ...formData, contacted_by: value })}
                options={[
                  { value: '', label: tForm('none') },
                  ...adminUsers.map(user => ({
                    value: user.username,
                    label: `Admin: ${user.username}`
                  })),
                  ...managerUsers.map(user => ({
                    value: user.username,
                    label: `Manager: ${user.username}`
                  }))
                ]}
                className="w-full"
              />
            </div>
          </div>

          {/* Conditional Contact Date Field */}
          {formData.contacted_by && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('contactDate')}</label>
              <input
                type="date"
                value={formData.contacted_by_date}
                onChange={(e) => setFormData({ ...formData, contacted_by_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder={tForm('internalNotes')}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Link
          href="/dashboard/admin/tryouts?tab=scouting"
          className="px-6 py-2.5 bg-dark border border-gray-800 hover:border-gray-700 text-white rounded-lg transition-all font-medium"
        >
          {tCommon('cancel')}
        </Link>
        <button
          type="submit"
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg ${
            currentGame === 'valorant'
              ? 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-primary/20'
              : 'bg-gradient-to-r from-[#de9b35] to-[#b8802a] hover:from-[#b8802a] hover:to-[#de9b35] shadow-[#de9b35]/20'
          }`}
        >
          {loading ? tForm('creatingProfile') : tForm('createProfile')}
        </button>
      </div>
    </form>
  )
}
