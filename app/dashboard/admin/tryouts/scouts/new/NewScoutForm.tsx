'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ValorantRole, ValorantRank, TeamCategory, TryoutStatus } from '@/lib/types/database'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewScoutForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    team_category: '21L' as TeamCategory,
    full_name: '',
    in_game_name: '',
    position: '' as ValorantRole | '',
    is_igl: false,
    nationality: '',
    champion_pool: [] as string[],
    rank: '' as ValorantRank | '',
    valorant_tracker_url: '',
    twitter_url: '',
    discord: '',
    status: 'not_contacted' as TryoutStatus,
    managed_by: '',
    contacted_by: '',
    notes: '',
    links: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .insert([{
          ...formData,
          position: formData.position || null,
          rank: formData.rank || null,
          champion_pool: formData.champion_pool.length > 0 ? formData.champion_pool : null,
        }])

      if (error) throw error

      router.push('/dashboard/admin/tryouts?tab=scouting')
      router.refresh()
    } catch (error) {
      console.error('Error creating scout profile:', error)
      alert('Failed to create scout profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChampionPoolChange = (value: string) => {
    const agents = value.split(',').map(a => a.trim()).filter(Boolean)
    setFormData({ ...formData, champion_pool: agents })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-dark-card border border-gray-800 rounded-lg p-6 space-y-6">
      <Link
        href="/dashboard/admin/tryouts?tab=scouting"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scouting Database
      </Link>

      {/* Basic Info */}
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
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Discord username or in-game name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.team_category}
              onChange={(e) => setFormData({ ...formData, team_category: e.target.value as TeamCategory })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="21L">21L</option>
              <option value="21GC">21GC</option>
              <option value="21ACA">21 ACA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Player's real name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">In-Game Name</label>
            <input
              type="text"
              value={formData.in_game_name}
              onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Alternative IGN"
            />
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Game Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as ValorantRole })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Position</option>
              <option value="duelist">Duelist</option>
              <option value="controller">Controller</option>
              <option value="initiator">Initiator</option>
              <option value="sentinel">Sentinel</option>
              <option value="flex">Flex</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rank</label>
            <select
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value as ValorantRank })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="">Select Rank</option>
              <option value="iron1">Iron 1</option>
              <option value="iron2">Iron 2</option>
              <option value="iron3">Iron 3</option>
              <option value="bronze1">Bronze 1</option>
              <option value="bronze2">Bronze 2</option>
              <option value="bronze3">Bronze 3</option>
              <option value="silver1">Silver 1</option>
              <option value="silver2">Silver 2</option>
              <option value="silver3">Silver 3</option>
              <option value="gold1">Gold 1</option>
              <option value="gold2">Gold 2</option>
              <option value="gold3">Gold 3</option>
              <option value="platinum1">Platinum 1</option>
              <option value="platinum2">Platinum 2</option>
              <option value="platinum3">Platinum 3</option>
              <option value="diamond1">Diamond 1</option>
              <option value="diamond2">Diamond 2</option>
              <option value="diamond3">Diamond 3</option>
              <option value="ascendant1">Ascendant 1</option>
              <option value="ascendant2">Ascendant 2</option>
              <option value="ascendant3">Ascendant 3</option>
              <option value="immortal1">Immortal 1</option>
              <option value="immortal2">Immortal 2</option>
              <option value="immortal3">Immortal 3</option>
              <option value="radiant">Radiant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nationality</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="ISO country code (e.g., FR, UK, DE)"
              maxLength={2}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_igl}
                onChange={(e) => setFormData({ ...formData, is_igl: e.target.checked })}
                className="w-4 h-4 text-primary bg-dark border-gray-800 rounded focus:ring-primary"
              />
              Is IGL (In-Game Leader)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent Pool</label>
          <input
            type="text"
            value={formData.champion_pool.join(', ')}
            onChange={(e) => handleChampionPoolChange(e.target.value)}
            className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            placeholder="Comma-separated agent names (e.g., Jett, Raze, Omen)"
          />
          <p className="text-xs text-gray-500 mt-1">Enter agent names separated by commas</p>
        </div>
      </div>

      {/* Contact & Links */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Contact & Links</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Discord</label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Discord username or ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">VALORANT Tracker URL</label>
            <input
              type="url"
              value={formData.valorant_tracker_url}
              onChange={(e) => setFormData({ ...formData, valorant_tracker_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://tracker.gg/valorant/profile/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X URL</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Other Links</label>
            <input
              type="text"
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Additional links (YouTube, portfolio, etc.)"
            />
          </div>
        </div>
      </div>

      {/* Scout Management */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-2">Scout Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TryoutStatus })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="not_contacted">Not Contacted</option>
              <option value="contacted">Contacted</option>
              <option value="in_tryouts">In Tryouts</option>
              <option value="accepted">Accepted</option>
              <option value="substitute">Substitute</option>
              <option value="rejected">Rejected</option>
              <option value="left">Left</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Managed By</label>
            <input
              type="text"
              value={formData.managed_by}
              onChange={(e) => setFormData({ ...formData, managed_by: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Staff member managing this scout"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contacted By</label>
            <input
              type="text"
              value={formData.contacted_by}
              onChange={(e) => setFormData({ ...formData, contacted_by: e.target.value })}
              className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Staff member who first contacted"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            placeholder="Internal notes about this player..."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
        <Link
          href="/dashboard/admin/tryouts?tab=scouting"
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
