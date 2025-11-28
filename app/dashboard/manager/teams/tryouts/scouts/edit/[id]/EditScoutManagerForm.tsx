'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ValorantRole, ValorantRank, TeamCategory, TryoutStatus, ProfileTryout } from '@/lib/types/database'
import { X, User, Gamepad2, Link as LinkIcon, Settings, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import SearchableCountrySelect from '@/components/SearchableCountrySelect'

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

interface EditScoutManagerFormProps {
  scoutId: string
  teamId: string | null
  team: any | null
  teamCategory: TeamCategory | null
  managerId: string
}

export default function EditScoutManagerForm({ scoutId, teamId, team, teamCategory, managerId }: EditScoutManagerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [championInput, setChampionInput] = useState('')
  const [managerUsers, setManagerUsers] = useState<Array<{ id: string; username: string }>>([])
  const [adminUsernames, setAdminUsernames] = useState<string[]>([]) // Just store admin usernames for checking
  const [isAdminManaged, setIsAdminManaged] = useState(false) // Track if managed by admin
  const [formData, setFormData] = useState({
    username: '',
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
    const loadData = async () => {
      await fetchUsers()
      await fetchScout()
    }
    loadData()
  }, [scoutId])

  const fetchScout = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('id', scoutId)
        .eq('team_category', teamCategory) // Ensure scout belongs to manager's team
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          username: data.username || '',
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

        // Check if managed by an admin after adminUsers is populated
        if (data.managed_by) {
          checkIfAdminManaged(data.managed_by)
        }
      }
    } catch (error) {
      console.error('Error fetching scout:', error)
      alert('Failed to load scout profile')
      router.push('/dashboard/manager/teams/tryouts')
    } finally {
      setLoading(false)
    }
  }

  const checkIfAdminManaged = (managedBy: string) => {
    // Check if the user who manages this scout is an admin
    const isManagedByAdmin = adminUsernames.includes(managedBy)
    setIsAdminManaged(isManagedByAdmin)
  }

  const fetchUsers = async () => {
    try {
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('username')
        .eq('role', 'admin')
        .order('username')

      if (adminError) throw adminError
      setAdminUsernames(admins?.map(a => a.username) || [])

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
      // Prepare update object - exclude locked fields if admin managed
      const updateData: any = {
        username: formData.username,
        in_game_name: formData.in_game_name || null,
        position: formData.position || null,
        is_igl: formData.is_igl,
        nationality: formData.nationality || null,
        champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
        rank: formData.rank || null,
        valorant_tracker_url: formData.valorant_tracker_url || null,
        twitter_url: formData.twitter_url || null,
        notes: formData.notes || null,
        links: formData.links || null,
      }

      // Only include these fields if NOT admin managed
      if (!isAdminManaged) {
        updateData.status = formData.status
        updateData.managed_by = formData.managed_by || null
        updateData.contacted_by = formData.contacted_by || null
        updateData.last_contact_date = formData.contacted_by_date || null
      }

      const { error } = await supabase
        .from('profiles_tryouts')
        .update(updateData)
        .eq('id', scoutId)
        .eq('team_category', teamCategory) // Ensure only updating own team's scouts

      if (error) throw error

      router.push(`/dashboard/manager/teams/tryouts/scouts/view/${scoutId}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating scout profile:', error)
      alert('Failed to update scout profile. Please try again.')
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            <p className="text-sm text-gray-400">Personal details and identity</p>
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
              className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              placeholder="Discord username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team
            </label>
            <input
              type="text"
              value={teamCategory || ''}
              disabled
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed font-sans"
            />
            <p className="text-xs text-gray-500 mt-1">Team assignment cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">In-Game Name</label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              placeholder="IGN"
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
        </div>
      </div>

      {/* Game Information */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-purple-500/5 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Game Information</h2>
            <p className="text-sm text-gray-400">Role, rank, and agent preferences</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
            <CustomSelect
              value={formData.position}
              onChange={(value) => setFormData({ ...formData, position: value as ValorantRole })}
              options={[
                { value: '', label: 'Select' },
                { value: 'Duelist', label: 'Duelist' },
                { value: 'Controller', label: 'Controller' },
                { value: 'Initiator', label: 'Initiator' },
                { value: 'Sentinel', label: 'Sentinel' },
                { value: 'Flex', label: 'Flex' }
              ]}
              className="min-w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rank</label>
            <CustomSelect
              value={formData.rank}
              onChange={(value) => setFormData({ ...formData, rank: value as ValorantRank })}
              options={[
                { value: '', label: 'Select' },
                { value: 'Ascendant 1', label: 'Ascendant 1' },
                { value: 'Ascendant 2', label: 'Ascendant 2' },
                { value: 'Ascendant 3', label: 'Ascendant 3' },
                { value: 'Immortal 1', label: 'Immortal 1' },
                { value: 'Immortal 2', label: 'Immortal 2' },
                { value: 'Immortal 3', label: 'Immortal 3' },
                { value: 'Radiant', label: 'Radiant' }
              ]}
              className="min-w-full"
            />
          </div>
        </div>

        {/* Agent Pool */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent Pool</label>
          
          {formData.champion_pool.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.champion_pool.map((agent) => (
                <span
                  key={agent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium"
                >
                  {agent}
                  <button
                    type="button"
                    onClick={() => removeAgent(agent)}
                    className="hover:text-white transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={championInput}
                onChange={(e) => setChampionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChampion()
                  }
                }}
                list="agent-suggestions"
                className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                placeholder="Type an agent name..."
              />
              <datalist id="agent-suggestions">
                {VALORANT_AGENTS.filter(agent => !formData.champion_pool.includes(agent)).map((agent) => (
                  <option key={agent} value={agent} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={addChampion}
              className="px-4 py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition font-medium"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Type an agent name and press Enter or click Add
          </p>
        </div>

        {/* IGL Checkbox */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.is_igl}
                onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-5 h-5 border-2 border-gray-600 rounded bg-dark-card peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                {formData.is_igl && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-gray-300 group-hover:text-white transition font-sans">Is IGL (In-Game Leader)</span>
          </label>
        </div>
      </div>

      {/* Contact & Links */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-cyan-500/5 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Contact & Links</h2>
            <p className="text-sm text-gray-400">External profiles and resources</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tracker URL</label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              placeholder="https://tracker.gg/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter URL</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Other Links</label>
            <input
              type="text"
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              placeholder="YouTube, portfolio, etc."
            />
          </div>
        </div>
      </div>

      {/* Management */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-orange-500/5 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Management</h2>
            <p className="text-sm text-gray-400">Status and tracking information</p>
          </div>
        </div>
        
        {isAdminManaged && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> This scout is managed by an administrator. Status, Added By, and Contacted By fields are locked and cannot be changed.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            {isAdminManaged ? (
              <div className="w-full px-4 py-2.5 border border-gray-800 rounded-lg bg-gray-900 text-gray-500 cursor-not-allowed font-sans">
                {formData.status === 'not_contacted' ? 'Not Contacted' :
                 formData.status === 'contacted' ? 'Contacted' :
                 formData.status === 'in_tryouts' ? 'In Tryouts' :
                 formData.status === 'substitute' ? 'Substitute' :
                 formData.status === 'rejected' ? 'Rejected' :
                 formData.status === 'left' ? 'Left' : formData.status}
              </div>
            ) : (
              <CustomSelect
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as TryoutStatus })}
                options={[
                  { value: 'not_contacted', label: 'Not Contacted' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'in_tryouts', label: 'In Tryouts' },
                  { value: 'substitute', label: 'Substitute' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'left', label: 'Left' }
                ]}
                className="min-w-full"
              />
            )}
            {isAdminManaged && (
              <p className="text-xs text-gray-500 mt-1">Locked by administrator</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Added By</label>
            <select
              value={formData.managed_by}
              onChange={(e) => setFormData({ ...formData, managed_by: e.target.value })}
              disabled={isAdminManaged}
              className={`w-full px-4 py-2.5 border border-gray-800 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans ${
                isAdminManaged 
                  ? 'bg-gray-900 text-gray-500 cursor-not-allowed' 
                  : 'bg-dark-card text-white'
              }`}
            >
              <option value="">None</option>
              {managerUsers.map((user) => (
                <option key={user.id} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>
            {isAdminManaged && (
              <p className="text-xs text-gray-500 mt-1">Locked by administrator</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contacted By</label>
            <select
              value={formData.contacted_by}
              onChange={(e) => setFormData({ ...formData, contacted_by: e.target.value })}
              disabled={isAdminManaged}
              className={`w-full px-4 py-2.5 border border-gray-800 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans ${
                isAdminManaged 
                  ? 'bg-gray-900 text-gray-500 cursor-not-allowed' 
                  : 'bg-dark-card text-white'
              }`}
            >
              <option value="">None</option>
              {managerUsers.map((user) => (
                <option key={user.id} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>
            {isAdminManaged && (
              <p className="text-xs text-gray-500 mt-1">Locked by administrator</p>
            )}
          </div>
        </div>

        {formData.contacted_by && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Date</label>
            <input
              type="date"
              value={formData.contacted_by_date}
              onChange={(e) => setFormData({ ...formData, contacted_by_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
            />
          </div>
        )}

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-sans"
            placeholder="Internal notes..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Link
          href={`/dashboard/manager/teams/tryouts/scouts/view/${scoutId}`}
          className="px-6 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-600 transition-all font-medium"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}
