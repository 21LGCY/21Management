'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ValorantRole, ValorantRank, TeamCategory, TryoutStatus, ProfileTryout } from '@/lib/types/database'
import { X, User, Gamepad2, Link as LinkIcon, Settings, Save } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'
import { useTranslations } from 'next-intl'

const VALORANT_AGENTS = [
  'Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher', 
  'Deadlock', 'Fade', 'Gekko', 'Harbor', 'Iso', 'Jett', 
  'KAY/O', 'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze', 
  'Reyna', 'Sage', 'Skye', 'Sova', 'Viper', 'Vyse', 'Yoru'
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

interface EditScoutFormProps {
  scoutId: string
}

export default function EditScoutForm({ scoutId }: EditScoutFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [championInput, setChampionInput] = useState('')
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; username: string }>>([])
  const [managerUsers, setManagerUsers] = useState<Array<{ id: string; username: string }>>([])
  const t = useTranslations('tryouts')
  const tForm = useTranslations('tryouts.form')
  const tCommon = useTranslations('common')
  const tRoles = useTranslations('roles')
  const [formData, setFormData] = useState({
    username: '',
    team_category: '21L' as TeamCategory,
    in_game_name: '',
    position: '' as ValorantRole | '',
    is_igl: false,
    nationality: '',
    champion_pool: [] as string[],
    rank: '' as ValorantRank | '',
    valorant_tracker_url: '',
    twitter_url: '',
    status: 'not_contacted' as TryoutStatus,
    managed_by: '',
    contacted_by: '',
    contacted_by_date: '',
    notes: '',
    links: '',
  })

  useEffect(() => {
    fetchScout()
    fetchUsers()
  }, [scoutId])

  const fetchScout = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('id', scoutId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          username: data.username || '',
          team_category: data.team_category || '21L',
          in_game_name: data.in_game_name || '',
          position: data.position || '',
          is_igl: data.is_igl || false,
          nationality: data.nationality || '',
          champion_pool: data.champion_pool || [],
          rank: data.rank || '',
          valorant_tracker_url: data.valorant_tracker_url || '',
          twitter_url: data.twitter_url || '',
          status: data.status || 'not_contacted',
          managed_by: data.managed_by || '',
          contacted_by: data.contacted_by || '',
          contacted_by_date: data.last_contact_date || '',
          notes: data.notes || '',
          links: data.links || '',
        })
      }
    } catch (error) {
      console.error('Error fetching scout:', error)
      alert(tForm('errorLoading'))
    } finally {
      setLoading(false)
    }
  }

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
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .update({
          username: formData.username,
          team_category: formData.team_category,
          in_game_name: formData.in_game_name || null,
          position: formData.position || null,
          is_igl: formData.is_igl,
          nationality: formData.nationality || null,
          champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
          rank: formData.rank || null,
          valorant_tracker_url: formData.valorant_tracker_url || null,
          twitter_url: formData.twitter_url || null,
          status: formData.status,
          managed_by: formData.managed_by || null,
          contacted_by: formData.contacted_by || null,
          last_contact_date: formData.contacted_by_date || null,
          notes: formData.notes || null,
          links: formData.links || null,
        })
        .eq('id', scoutId)

      if (error) throw error

      router.push(`/dashboard/admin/tryouts/scouts/view/${scoutId}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating scout profile:', error)
      alert(tForm('errorUpdating'))
    } finally {
      setSaving(false)
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

  const removeAgent = (agent: string) => {
    setFormData({ 
      ...formData, 
      champion_pool: formData.champion_pool.filter(a => a !== agent) 
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
                { value: '21ACA', label: '21 ACA' }
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('inGameName')}</label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={tForm('ign')}
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
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{tForm('gameInfo')}</h2>
            <p className="text-xs text-gray-400">{tForm('gameInfoDesc')}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('position')}</label>
              <CustomSelect
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value as ValorantRole })}
                options={[
                  { value: '', label: tForm('select') },
                  { value: 'Duelist', label: tRoles('duelist') },
                  { value: 'Controller', label: tRoles('controller') },
                  { value: 'Initiator', label: tRoles('initiator') },
                  { value: 'Sentinel', label: tRoles('sentinel') },
                  { value: 'Flex', label: tRoles('flex') },
                  { value: 'Staff', label: tRoles('staff') }
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('rank')}</label>
              <CustomSelect
                value={formData.rank}
                onChange={(value) => setFormData({ ...formData, rank: value as ValorantRank })}
                options={[
                  { value: '', label: tForm('select') },
                  { value: 'Ascendant 1', label: 'Ascendant 1' },
                  { value: 'Ascendant 2', label: 'Ascendant 2' },
                  { value: 'Ascendant 3', label: 'Ascendant 3' },
                  { value: 'Immortal 1', label: 'Immortal 1' },
                  { value: 'Immortal 2', label: 'Immortal 2' },
                  { value: 'Immortal 3', label: 'Immortal 3' },
                  { value: 'Radiant', label: 'Radiant' }
                ]}
                className="w-full"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('agentPool')}</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <CustomSelect
                  value={championInput}
                  onChange={(value) => setChampionInput(value)}
                  options={[
                    { value: '', label: tForm('selectAgent') },
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
                  {tCommon('add')}
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
                        onClick={() => removeAgent(agent)}
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
                  <p className="text-sm text-gray-500">{t('noAgentsAdded')}</p>
                </div>
              )}
            </div>
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{tForm('trackerUrl')}</label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="https://tracker.gg/..."
            />
          </div>

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

          <div className="md:col-span-2">
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
          href={`/dashboard/admin/tryouts/scouts/view/${scoutId}`}
          className="px-6 py-2.5 bg-dark border border-gray-800 hover:border-gray-700 text-white rounded-lg transition-all font-medium"
        >
          {tCommon('cancel')}
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg shadow-primary/20"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {tCommon('saveChanges')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
