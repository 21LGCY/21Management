'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Calendar, Users, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TeamCategory, ProfileTryout } from '@/lib/types/database'
import CustomSelect from '@/components/CustomSelect'

export default function NewTryoutWeekForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<ProfileTryout[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    team_category: '21L' as TeamCategory,
    week_label: '',
    week_start: '',
    week_end: '',
    notes: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
    // Reset search and filter when team changes
    setSearchTerm('')
    setStatusFilter('all')
  }, [formData.team_category])

  // Filter and search players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [players, searchTerm, statusFilter])

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('team_category', formData.team_category)
        .not('status', 'in', '(rejected,left)')
        .order('username')

      if (error) throw error

      setPlayers(data || [])
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const togglePlayer = (playerId: string) => {
    const newSet = new Set(selectedPlayers)
    if (newSet.has(playerId)) {
      newSet.delete(playerId)
    } else {
      newSet.add(playerId)
    }
    setSelectedPlayers(newSet)
  }

  const selectAllPlayers = () => {
    if (selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0) {
      // Remove all filtered players from selection
      const newSet = new Set(selectedPlayers)
      filteredPlayers.forEach(p => newSet.delete(p.id))
      setSelectedPlayers(newSet)
    } else {
      // Add all filtered players to selection
      const newSet = new Set(selectedPlayers)
      filteredPlayers.forEach(p => newSet.add(p.id))
      setSelectedPlayers(newSet)
    }
  }

  const generateToken = () => {
    return crypto.randomUUID().replace(/-/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedPlayers.size === 0) {
      alert('Please select at least one player')
      return
    }

    if (!formData.week_start || !formData.week_end) {
      alert('Please select start and end dates')
      return
    }

    setLoading(true)

    try {
      // Create tryout week
      const { data: week, error: weekError } = await supabase
        .from('tryout_weeks')
        .insert([{
          team_category: formData.team_category,
          week_label: formData.week_label || null,
          week_start: formData.week_start,
          week_end: formData.week_end,
          notes: formData.notes || null,
          status: 'scheduled',
        }])
        .select()
        .single()

      if (weekError) throw weekError

      // Create player availabilities with unique tokens
      const availabilities = Array.from(selectedPlayers).map(playerId => ({
        tryout_week_id: week.id,
        player_id: playerId,
        token: generateToken(),
        time_slots: {},
      }))

      const { error: availError } = await supabase
        .from('player_availabilities')
        .insert(availabilities)

      if (availError) throw availError

      router.push(`/dashboard/admin/tryouts/${week.id}`)
    } catch (error) {
      console.error('Error creating tryout week:', error)
      alert('Failed to create tryout week')
    } finally {
      setLoading(false)
    }
  }

  // Auto-calculate week end (6 days after start)
  useEffect(() => {
    if (formData.week_start) {
      const startDate = new Date(formData.week_start)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      
      const endString = endDate.toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, week_end: endString }))
    }
  }, [formData.week_start])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'contacted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'in_tryouts': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'player': return 'bg-primary/20 text-primary border-primary/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'Not Contacted'
      case 'contacted': return 'Contacted'
      case 'in_tryouts': return 'In Tryouts'
      case 'substitute': return 'Substitute'
      case 'rejected': return 'Rejected'
      case 'left': return 'Left'
      case 'player': return 'Player'
      default: return status
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/admin/tryouts">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Tryouts
          </button>
        </Link>
        <div className="border-l-4 border-primary pl-4">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <Calendar className="w-8 h-8 text-primary" />
            Create Tryout Week
          </h1>
          <p className="text-gray-400 mt-2">Schedule a full week of tryouts for your team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Card */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Week Information</h2>
              <p className="text-xs text-gray-400">Schedule details and description</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Team Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team
              </label>
              <CustomSelect
                value={formData.team_category}
                onChange={(value) => setFormData(prev => ({ ...prev, team_category: value as TeamCategory }))}
                options={[
                  { value: '21L', label: '21L' },
                  { value: '21GC', label: '21GC' },
                  { value: '21ACA', label: '21 ACA' }
                ]}
                className="w-full"
              />
            </div>

            {/* Week Label */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title (visible to staff and players)
              </label>
              <input
                type="text"
                value={formData.week_label}
                onChange={handleInputChange('week_label')}
                placeholder="e.g., Week 1, January Tryouts"
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Optional - Helps identify this session easily
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (visible to staff and players)
              </label>
              <textarea
                value={formData.notes}
                onChange={handleInputChange('notes')}
                className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none"
                placeholder="e.g., Players present in the session with roles"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Start
                </label>
                <input
                  type="date"
                  value={formData.week_start}
                  onChange={handleInputChange('week_start')}
                  required
                  className="w-full px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session End (automatic week)
                </label>
                <input
                  type="date"
                  value={formData.week_end}
                  onChange={handleInputChange('week_end')}
                  required
                  readOnly
                  className="w-full px-4 py-2.5 bg-dark border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Player Selection Card */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Select Players</h2>
              <p className="text-xs text-gray-400">{selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''} selected</p>
            </div>
            <button
              type="button"
              onClick={selectAllPlayers}
              className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all"
              disabled={filteredPlayers.length === 0}
            >
              {selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a player..."
                className="w-full pl-10 px-4 py-2.5 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <CustomSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'in_tryouts', label: 'In Tryouts' },
                  { value: 'substitute', label: 'Substitute' },
                  { value: 'player', label: 'Player / Accepted' }
                ]}
                className="w-full pl-7"
              />
            </div>
          </div>

          {/* Results Summary */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mb-4 text-sm text-gray-400">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
              {statusFilter !== 'all' && ` with status "${getStatusLabel(statusFilter)}"`}
            </div>
          )}

          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              {players.length === 0 ? (
                <>
                  <p>No players available for this team</p>
                  <p className="text-sm mt-1">Players with "Rejected" or "Left" status are excluded</p>
                </>
              ) : (
                <>
                  <p>No players found</p>
                  <p className="text-sm mt-1">Try modifying your search criteria</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPlayers.has(player.id)
                      ? 'bg-primary/20 border-primary/50 shadow-sm shadow-primary/10'
                      : 'bg-dark/30 border-gray-800 hover:bg-dark/50 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.has(player.id)}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-gray-700 bg-dark text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{player.username}</span>
                        {player.full_name && (
                          <span className="text-sm text-gray-400">({player.full_name})</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(player.status)}`}>
                          {getStatusLabel(player.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 capitalize">{player.position}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || selectedPlayers.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Tryout Week'}
          </button>
          <Link href="/dashboard/admin/tryouts">
            <button type="button" className="px-6 py-3 border border-gray-800 text-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-700 transition-all">
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}


