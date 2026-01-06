'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { TryoutStatus } from '@/lib/types/database'
import { GameType, getGameConfig, DEFAULT_GAME, getFaceitLevelImage, CS2_FACEIT_LEVELS } from '@/lib/types/games'
import { Save, X, Gamepad2 } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'

interface TryoutFormProps {
  tryoutId?: string
  teamGame?: GameType // Pass the team's game
}

const TRYOUT_STATUSES: TryoutStatus[] = [
  'not_contacted',
  'contacted',
  'in_tryouts',
  'accepted',
  'substitute',
  'rejected',
  'left'
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

export default function TryoutForm({ tryoutId, teamGame = DEFAULT_GAME }: TryoutFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [gameType, setGameType] = useState<GameType>(teamGame)
  const t = useTranslations('forms')
  const tCommon = useTranslations('common')
  const tTryouts = useTranslations('tryouts')
  const tPlayers = useTranslations('players')
  
  // Get game configuration
  const gameConfig = getGameConfig(gameType)
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    in_game_name: '',
    position: '',
    is_igl: false,
    nationality: '',
    champion_pool: [] as string[], // Legacy
    character_pool: [] as string[], // New
    rank: '',
    faceit_level: '' as string | number, // CS2 specific
    valorant_tracker_url: '', // Legacy
    tracker_url: '', // New
    steam_url: '', // CS2 specific
    faceit_url: '', // CS2 specific
    twitter_url: '',
    contact_status: 'not_contacted' as TryoutStatus,
    last_contact_date: '',
    managed_by: '',
    contacted_by: '',
    notes: '',
    links: '',
    game: teamGame,
  })

  const [championInput, setChampionInput] = useState('')

  useEffect(() => {
    if (tryoutId) {
      fetchTryout()
    }
  }, [tryoutId])

  const fetchTryout = async () => {
    if (!tryoutId) return
    
    const { data, error } = await supabase
      .from('profiles_tryouts')
      .select('*')
      .eq('id', tryoutId)
      .single()

    if (data && !error) {
      const loadedGame = (data.game as GameType) || teamGame
      setGameType(loadedGame)
      setFormData({
        username: data.username,
        full_name: data.full_name || '',
        in_game_name: data.in_game_name || '',
        position: data.position || '',
        is_igl: data.is_igl || false,
        nationality: data.nationality || '',
        champion_pool: data.champion_pool || [],
        character_pool: data.character_pool || data.champion_pool || [],
        rank: data.rank || '',
        faceit_level: data.faceit_level || '',
        valorant_tracker_url: data.valorant_tracker_url || '',
        tracker_url: data.tracker_url || data.valorant_tracker_url || '',
        steam_url: data.steam_url || '',
        faceit_url: data.faceit_url || '',
        twitter_url: data.twitter_url || '',
        contact_status: data.status || 'not_contacted',
        last_contact_date: data.last_contact_date ? new Date(data.last_contact_date).toISOString().split('T')[0] : '',
        managed_by: data.managed_by || '',
        contacted_by: data.contacted_by || '',
        notes: data.notes || '',
        links: data.links || '',
        game: loadedGame,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        username: formData.username,
        full_name: formData.full_name || null,
        in_game_name: formData.in_game_name || null,
        position: formData.position || null,
        is_igl: formData.is_igl,
        nationality: formData.nationality || null,
        champion_pool: formData.character_pool.length > 0 ? formData.character_pool : null, // Legacy
        character_pool: formData.character_pool.length > 0 ? formData.character_pool : null, // New
        rank: gameType === 'valorant' ? (formData.rank || null) : null,
        faceit_level: gameType === 'cs2' ? (formData.faceit_level ? Number(formData.faceit_level) : null) : null,
        valorant_tracker_url: gameType === 'valorant' ? (formData.tracker_url || null) : null, // Legacy
        tracker_url: gameType === 'valorant' ? (formData.tracker_url || null) : null, // New
        steam_url: gameType === 'cs2' ? (formData.steam_url || null) : null,
        faceit_url: gameType === 'cs2' ? (formData.faceit_url || null) : null,
        twitter_url: formData.twitter_url || null,
        status: formData.contact_status,
        last_contact_date: formData.last_contact_date || null,
        managed_by: formData.managed_by || null,
        contacted_by: formData.contacted_by || null,
        notes: formData.notes || null,
        links: formData.links || null,
        game: gameType,
        updated_at: new Date().toISOString(),
      }

      if (tryoutId) {
        // Update existing tryout
        const { error } = await supabase
          .from('profiles_tryouts')
          .update(payload)
          .eq('id', tryoutId)

        if (error) throw error
      } else {
        // Create new tryout
        const { error } = await supabase
          .from('profiles_tryouts')
          .insert(payload)

        if (error) throw error
      }

      router.push('/dashboard/admin/tryouts')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving tryout:', error)
      alert(error.message || t('errorSavingTryout'))
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
      {/* Game Badge */}
      <div className="flex items-center gap-3 p-3 bg-dark-card border border-gray-800 rounded-lg">
        <Gamepad2 className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-300">{t('game')}:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          gameType === 'valorant' 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        }`}>
          {gameConfig.name}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('basicInfo')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('username')} *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('inGameName')}
            </label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('rolePosition')}
            </label>
            <CustomSelect
              value={formData.position}
              onChange={(value) => setFormData({ ...formData, position: value })}
              placeholder={t('selectRole')}
              options={[
                { value: '', label: t('selectRole') },
                ...gameConfig.roles.map(role => ({ value: role, label: role }))
              ]}
            />
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
              {t('igl')}
            </label>
          </div>
        </div>

        {/* Player Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('playerDetails')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('nationality')}
            </label>
            <CustomSelect
              value={formData.nationality}
              onChange={(value) => setFormData({ ...formData, nationality: value })}
              placeholder={t('nationality')}
              options={[
                { value: '', label: t('nationality') },
                ...EUROPEAN_COUNTRIES.map(country => ({ value: country.code, label: country.name }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {gameType === 'cs2' ? t('faceitLevel') : t('rank')}
            </label>
            {gameType === 'cs2' ? (
              <div className="flex items-center gap-4">
                <CustomSelect
                  value={String(formData.faceit_level)}
                  onChange={(value) => setFormData({ ...formData, faceit_level: value })}
                  placeholder={t('selectFaceitLevel')}
                  options={[
                    { value: '', label: t('selectFaceitLevel') },
                    ...CS2_FACEIT_LEVELS.map(level => ({ value: String(level), label: `Level ${level}` }))
                  ]}
                />
                {formData.faceit_level && Number(formData.faceit_level) >= 8 && (
                  <div className="flex-shrink-0">
                    <Image
                      src={getFaceitLevelImage(Number(formData.faceit_level))}
                      alt={`Faceit Level ${formData.faceit_level}`}
                      width={64}
                      height={64}
                      className="rounded"
                    />
                  </div>
                )}
              </div>
            ) : (
              <CustomSelect
                value={formData.rank}
                onChange={(value) => setFormData({ ...formData, rank: value })}
                placeholder={t('selectRank')}
                options={[
                  { value: '', label: t('selectRank') },
                  ...gameConfig.ranks.map(rank => ({ value: rank, label: rank }))
                ]}
              />
            )}
          </div>

          {/* Agent Pool - Only for Valorant */}
          {gameConfig.hasCharacterPool && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('agentPool')}
            </label>
            <div className="flex gap-2 mb-2">
              <CustomSelect
                value={championInput}
                onChange={(value) => setChampionInput(value)}
                placeholder={t('selectAgent')}
                options={[
                  { value: '', label: t('selectAgent') },
                  ...gameConfig.characters.filter(char => !formData.character_pool.includes(char)).map(char => ({ value: char, label: char }))
                ]}
                className="flex-1"
              />
              <button
                type="button"
                onClick={addChampion}
                disabled={!championInput}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
              >
                {tCommon('add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.character_pool.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-dark border border-gray-800 rounded-full text-sm text-white flex items-center gap-2"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeChampion(item)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          )}

          {/* Valorant Tracker - Only for Valorant */}
          {gameType === 'valorant' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('valorantTrackerUrl')}
            </label>
            <input
              type="url"
              value={formData.tracker_url}
              onChange={(e) => setFormData({ ...formData, tracker_url: e.target.value })}
              placeholder="https://tracker.gg/valorant/profile/..."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
          )}

          {/* CS2 Links - Only for CS2 */}
          {gameType === 'cs2' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('steamUrl')}
              </label>
              <input
                type="url"
                value={formData.steam_url}
                onChange={(e) => setFormData({ ...formData, steam_url: e.target.value })}
                placeholder="https://steamcommunity.com/id/..."
                className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('faceitUrl')}
              </label>
              <input
                type="url"
                value={formData.faceit_url}
                onChange={(e) => setFormData({ ...formData, faceit_url: e.target.value })}
                placeholder="https://www.faceit.com/en/players/..."
                className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
          </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('twitterUrl')}
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

        {/* Recruitment Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('recruitmentStatus')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('status')} *
            </label>
            <CustomSelect
              value={formData.contact_status}
              onChange={(value) => setFormData({ ...formData, contact_status: value as TryoutStatus })}
              options={[
                { value: 'not_contacted', label: tTryouts('notContacted') },
                { value: 'contacted', label: tTryouts('contacted') },
                { value: 'in_tryouts', label: tTryouts('inTryouts') },
                { value: 'accepted', label: tTryouts('accepted') },
                { value: 'substitute', label: tTryouts('substitute') },
                { value: 'rejected', label: tTryouts('rejected') },
                { value: 'left', label: tTryouts('left') }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('lastContactDate')}
            </label>
            <input
              type="date"
              value={formData.last_contact_date}
              onChange={(e) => setFormData({ ...formData, last_contact_date: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('managedBy')}
            </label>
            <input
              type="text"
              value={formData.managed_by}
              onChange={(e) => setFormData({ ...formData, managed_by: e.target.value })}
              placeholder={t('selectManager')}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tTryouts('contactedBy')}
            </label>
            <input
              type="text"
              value={formData.contacted_by}
              onChange={(e) => setFormData({ ...formData, contacted_by: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{t('additionalInfo')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder={t('notesPlaceholder')}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tTryouts('links')}
            </label>
            <textarea
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              rows={3}
              placeholder="Discord, Twitch, YouTube, etc."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-dark-card border border-gray-800 hover:border-gray-700 text-white rounded-lg transition"
        >
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {tryoutId ? t('updateTryout') : t('createTryout')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
