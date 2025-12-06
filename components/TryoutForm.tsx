'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValorantRole, ValorantRank, TryoutStatus } from '@/lib/types/database'
import { Save, X } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'

interface TryoutFormProps {
  tryoutId?: string
}

const VALORANT_ROLES: ValorantRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex']
const TRYOUT_STATUSES: TryoutStatus[] = [
  'not_contacted',
  'contacted',
  'in_tryouts',
  'accepted',
  'substitute',
  'rejected',
  'left'
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

export default function TryoutForm({ tryoutId }: TryoutFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const t = useTranslations('forms')
  const tCommon = useTranslations('common')
  const tTryouts = useTranslations('tryouts')
  const tPlayers = useTranslations('players')
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    in_game_name: '',
    position: '' as ValorantRole | '',
    is_igl: false,
    nationality: '',
    champion_pool: [] as string[],
    rank: '' as ValorantRank | '',
    valorant_tracker_url: '',
    twitter_url: '',
    contact_status: 'Not Contacted' as TryoutStatus,
    last_contact_date: '',
    managed_by: '',
    contacted_by: '',
    notes: '',
    links: '',
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
      setFormData({
        username: data.username,
        full_name: data.full_name || '',
        in_game_name: data.in_game_name || '',
        position: data.position || '',
        is_igl: data.is_igl || false,
        nationality: data.nationality || '',
        champion_pool: data.champion_pool || [],
        rank: data.rank || '',
        valorant_tracker_url: data.valorant_tracker_url || '',
        twitter_url: data.twitter_url || '',
        contact_status: data.contact_status,
        last_contact_date: data.last_contact_date ? new Date(data.last_contact_date).toISOString().split('T')[0] : '',
        managed_by: data.managed_by || '',
        contacted_by: data.contacted_by || '',
        notes: data.notes || '',
        links: data.links || '',
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
        champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
        rank: formData.rank || null,
        valorant_tracker_url: formData.valorant_tracker_url || null,
        twitter_url: formData.twitter_url || null,
        contact_status: formData.contact_status,
        last_contact_date: formData.last_contact_date || null,
        managed_by: formData.managed_by || null,
        contacted_by: formData.contacted_by || null,
        notes: formData.notes || null,
        links: formData.links || null,
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
              onChange={(value) => setFormData({ ...formData, position: value as ValorantRole })}
              placeholder={t('selectRole')}
              options={[
                { value: '', label: t('selectRole') },
                ...VALORANT_ROLES.map(role => ({ value: role, label: role }))
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
              {t('rank')}
            </label>
            <CustomSelect
              value={formData.rank}
              onChange={(value) => setFormData({ ...formData, rank: value as ValorantRank })}
              placeholder={t('selectRank')}
              options={[
                { value: '', label: t('selectRank') },
                ...VALORANT_RANKS.map(rank => ({ value: rank, label: rank }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('agentPool')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={championInput}
                onChange={(e) => setChampionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChampion())}
                placeholder={t('selectAgent')}
                className="flex-1 px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addChampion}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              >
                {tCommon('add')}
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('valorantTrackerUrl')}
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
