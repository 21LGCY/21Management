'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ValorantRole, ValorantRank, TryoutStatus } from '@/lib/types/database'
import { Save, X } from 'lucide-react'

interface TryoutFormProps {
  tryoutId?: string
}

const VALORANT_ROLES: ValorantRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex']
const TRYOUT_STATUSES: TryoutStatus[] = [
  'Not Contacted',
  'Contacted/Pending',
  'In Tryouts',
  'Player',
  'Substitute',
  'Rejected',
  'Left'
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
      alert(error.message || 'Error saving tryout profile')
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
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username *
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
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              In-Game Name
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
              Role
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as ValorantRole })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
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
        </div>

        {/* Player Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Player Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nationality
            </label>
            <select
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
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
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans"
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
              Champion Pool
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={championInput}
                onChange={(e) => setChampionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChampion())}
                placeholder="Add agent name..."
                className="flex-1 px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addChampion}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
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

        {/* Recruitment Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recruitment Status</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Status *
            </label>
            <select
              value={formData.contact_status}
              onChange={(e) => setFormData({ ...formData, contact_status: e.target.value as TryoutStatus })}
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              {TRYOUT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Contact Date
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
              Managed By
            </label>
            <input
              type="text"
              value={formData.managed_by}
              onChange={(e) => setFormData({ ...formData, managed_by: e.target.value })}
              placeholder="Staff member name"
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contacted By
            </label>
            <input
              type="text"
              value={formData.contacted_by}
              onChange={(e) => setFormData({ ...formData, contacted_by: e.target.value })}
              placeholder="Staff member name"
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Additional Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Internal notes about the player..."
              className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Links
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
              {tryoutId ? 'Update Tryout' : 'Create Tryout'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
