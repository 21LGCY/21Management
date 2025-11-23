'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ValorantRole, ValorantRank, TeamCategory, TryoutStatus } from '@/lib/types/database'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'

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

interface Team {
  id: string
  name: string
  category: TeamCategory
  organization_id?: string
}

interface NewScoutManagerFormProps {
  teamId: string | null
  team: Team | null
  teamCategory: TeamCategory | null
  managerId: string
}

export default function NewScoutManagerForm({ teamId, team, teamCategory, managerId }: NewScoutManagerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const agentDropdownRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; username: string }>>([])
  const [managerUsers, setManagerUsers] = useState<Array<{ id: string; username: string }>>([])
  const [currentUsername, setCurrentUsername] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    team_category: teamCategory || '21L' as TeamCategory,
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
    fetchUsers()
    fetchCurrentUsername()
  }, [managerId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setShowAgentDropdown(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAgentDropdown(false)
      }
    }

    if (showAgentDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showAgentDropdown])

  const fetchCurrentUsername = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', managerId)
        .single()

      if (error) throw error
      setCurrentUsername(data.username || '')
      // Auto-set managed_by to current manager
      setFormData(prev => ({ ...prev, managed_by: data.username || '' }))
    } catch (error) {
      console.error('Error fetching current username:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      // Fetch admin users
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('role', 'admin')
        .order('username')

      if (adminError) throw adminError
      setAdminUsers(admins || [])

      // Fetch manager users
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
      const { error } = await supabase
        .from('profiles_tryouts')
        .insert([{
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
        }])

      if (error) throw error

      router.push('/dashboard/manager/teams/tryouts?tab=scouting')
      router.refresh()
    } catch (error) {
      console.error('Error creating scout profile:', error)
      alert('Failed to create scout profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAgent = (agent: string) => {
    if (formData.champion_pool.includes(agent)) {
      setFormData({ 
        ...formData, 
        champion_pool: formData.champion_pool.filter(a => a !== agent) 
      })
    } else {
      setFormData({ 
        ...formData, 
        champion_pool: [...formData.champion_pool, agent] 
      })
    }
  }

  const removeAgent = (agent: string) => {
    setFormData({ 
      ...formData, 
      champion_pool: formData.champion_pool.filter(a => a !== agent) 
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-card border border-gray-800 rounded-lg p-6 space-y-6">
      <Link
        href="/dashboard/manager/teams/tryouts?tab=scouting"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scouting Database
      </Link>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              placeholder="Discord username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.team_category}
              onChange={(value) => setFormData({ ...formData, team_category: value as TeamCategory })}
              options={[
                { value: '21L', label: '21L' },
                { value: '21GC', label: '21GC' },
                { value: '21ACA', label: '21 ACA' }
              ]}
              className={teamCategory ? 'opacity-60 pointer-events-none' : ''}
            />
            {teamCategory && (
              <p className="text-xs text-gray-500 mt-1">Set based on your team assignment</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">In-Game Name</label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              placeholder="IGN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nationality</label>
            <CustomSelect
              value={formData.nationality}
              onChange={(value) => setFormData({ ...formData, nationality: value })}
              placeholder="Select Country"
              options={[
                { value: '', label: 'Select Country' },
                ...EUROPEAN_COUNTRIES.map(country => ({ value: country.code, label: country.name }))
              ]}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Game Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
            <CustomSelect
              value={formData.position}
              onChange={(value) => setFormData({ ...formData, position: value as ValorantRole })}
              placeholder="Select"
              options={[
                { value: '', label: 'Select' },
                { value: 'Duelist', label: 'Duelist' },
                { value: 'Controller', label: 'Controller' },
                { value: 'Initiator', label: 'Initiator' },
                { value: 'Sentinel', label: 'Sentinel' },
                { value: 'Flex', label: 'Flex' },
                { value: 'Staff', label: 'Staff' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rank</label>
            <CustomSelect
              value={formData.rank}
              onChange={(value) => setFormData({ ...formData, rank: value as ValorantRank })}
              placeholder="Select"
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
            />
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_igl}
              onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
              className="w-4 h-4 text-primary bg-dark border-gray-800 rounded focus:ring-primary"
            />
            <span className="font-sans">Is IGL (In-Game Leader)</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent Pool</label>
          
          {/* Selected Agents Display */}
          {formData.champion_pool.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.champion_pool.map((agent) => (
                <span
                  key={agent}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm"
                >
                  {agent}
                  <button
                    type="button"
                    onClick={() => removeAgent(agent)}
                    className="hover:text-white transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Agent Selector Dropdown */}
          <div className="relative" ref={agentDropdownRef}>
            <button
              type="button"
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-left text-gray-400 hover:border-gray-700 focus:outline-none focus:border-primary flex items-center justify-between font-sans"
            >
              <span>{formData.champion_pool.length > 0 ? `${formData.champion_pool.length} agent(s) selected` : 'Select agents...'}</span>
              <Plus className="w-4 h-4" />
            </button>

            {showAgentDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-dark-card border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {VALORANT_AGENTS.map((agent) => (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => {
                      toggleAgent(agent)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-800 transition font-sans ${
                      formData.champion_pool.includes(agent)
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-300'
                    }`}
                  >
                    {agent}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Click to add/remove agents from the pool
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Contact & Links</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tracker URL</label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              placeholder="https://tracker.gg/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter URL</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Other Links</label>
            <input
              type="text"
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
              placeholder="YouTube, portfolio, etc."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <CustomSelect
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as TryoutStatus })}
              options={[
                { value: 'not_contacted', label: 'Not Contacted' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'in_tryouts', label: 'In Tryouts' },
                { value: 'substitute', label: 'Substitute' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'left', label: 'Left' },
                { value: 'player', label: 'Player' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Added By</label>
            <CustomSelect
              value={formData.managed_by}
              onChange={(value) => setFormData({ ...formData, managed_by: value })}
              placeholder="None"
              options={[
                { value: '', label: 'None' },
                ...adminUsers.map(user => ({ value: user.username, label: `${user.username} (Admin)` })),
                ...managerUsers.map(user => ({ value: user.username, label: `${user.username} (Manager)` }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contacted By</label>
            <CustomSelect
              value={formData.contacted_by}
              onChange={(value) => setFormData({ ...formData, contacted_by: value })}
              placeholder="None"
              options={[
                { value: '', label: 'None' },
                ...adminUsers.map(user => ({ value: user.username, label: `${user.username} (Admin)` })),
                ...managerUsers.map(user => ({ value: user.username, label: `${user.username} (Manager)` }))
              ]}
            />
          </div>
        </div>

        {/* Conditional Contact Date Field */}
        {formData.contacted_by && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Date</label>
            <input
              type="date"
              value={formData.contacted_by_date}
              onChange={(e) => setFormData({ ...formData, contacted_by_date: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
            placeholder="Internal notes..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
        <Link
          href="/dashboard/manager/teams/tryouts?tab=scouting"
          className="px-6 py-2 border border-gray-800 text-gray-300 rounded-lg hover:bg-gray-800 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Scout Profile'}
        </button>
      </div>
    </form>
  )
}