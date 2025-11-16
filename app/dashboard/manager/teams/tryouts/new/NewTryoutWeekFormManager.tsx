'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Calendar, Users, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TeamCategory, ProfileTryout } from '@/lib/types/database'

interface NewTryoutWeekFormManagerProps {
  team: any
  teamCategory: TeamCategory | null
}

export default function NewTryoutWeekFormManager({ team, teamCategory }: NewTryoutWeekFormManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<ProfileTryout[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    team_category: teamCategory as TeamCategory,
    week_label: '',
    week_start: '',
    week_end: '',
    notes: '',
  })

  useEffect(() => {
    if (teamCategory) {
      fetchPlayers()
    }
  }, [teamCategory])

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
    if (!teamCategory) return
    
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('team_category', teamCategory)
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

      router.push(`/dashboard/manager/teams/tryouts/${week.id}`)
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
      case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'Not Contacted'
      case 'contacted': return 'Contacted'
      case 'in_tryouts': return 'In Tryouts'
      case 'accepted': return 'Accepted'
      case 'substitute': return 'Substitute'
      case 'rejected': return 'Rejected'
      case 'left': return 'Left'
      case 'player': return 'Player'
      default: return status
    }
  }

  const getTeamLabel = (teamCat: TeamCategory) => {
    switch (teamCat) {
      case '21L': return '21L'
      case '21GC': return '21GC'
      case '21ACA': return '21 ACA'
    }
  }

  if (!teamCategory) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
        <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-yellow-300 mb-2">Team Category Not Found</h3>
        <p className="text-yellow-400">Unable to determine team category for "{team?.name}". Contact an administrator.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/manager/teams/tryouts"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group mb-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Tryouts</span>
        </Link>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
          <Calendar className="w-8 h-8 text-primary" />
          Create Tryout Week - {getTeamLabel(teamCategory)}
        </h1>
        <p className="text-gray-400 mt-2">Schedule a full week of tryouts for {team.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Week Information</h2>
          
          <div className="space-y-4">
            {/* Team Category - Read Only */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Team
              </label>
              <input
                type="text"
                value={`${team.name} (${getTeamLabel(teamCategory)})`}
                readOnly
                className="w-full rounded-lg px-3 py-2 bg-dark border border-gray-700 text-gray-400 cursor-not-allowed font-sans"
              />
            </div>

            {/* Week Label */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Title (visible to staff and players)
              </label>
              <input
                type="text"
                value={formData.week_label}
                onChange={handleInputChange('week_label')}
                placeholder="e.g., Week 1, January Tryouts"
                className="w-full rounded-lg px-3 py-2 bg-dark border border-gray-700 text-white focus:border-primary focus:ring-1 focus:ring-primary font-sans"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - Helps identify this session easily
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Description (visible to staff and players)
              </label>
              <textarea
                value={formData.notes}
                onChange={handleInputChange('notes')}
                className="w-full rounded-lg px-3 py-2 bg-dark border border-gray-700 text-white focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] font-sans"
                placeholder="e.g., Players present in the session with roles"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Session Start
                </label>
                <input
                  type="date"
                  value={formData.week_start}
                  onChange={handleInputChange('week_start')}
                  required
                  className="w-full rounded-lg px-3 py-2 bg-dark border border-gray-700 text-white focus:border-primary focus:ring-1 focus:ring-primary font-sans"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Session End (automatic week)
                </label>
                <input
                  type="date"
                  value={formData.week_end}
                  onChange={handleInputChange('week_end')}
                  required
                  readOnly
                  className="w-full rounded-lg px-3 py-2 bg-dark border border-gray-700 text-gray-400 cursor-not-allowed font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Player Selection Card */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Users className="w-5 h-5" />
              Select Players ({selectedPlayers.size} selected)
            </h2>
            <button
              type="button"
              onClick={selectAllPlayers}
              className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-dark-hover transition"
              disabled={filteredPlayers.length === 0}
            >
              {selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a player..."
                className="w-full pl-10 rounded-lg px-3 py-2 bg-dark border border-gray-700 text-white focus:border-primary focus:ring-1 focus:ring-primary font-sans"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 rounded-lg px-3 py-2 bg-dark border border-gray-700 text-white focus:border-primary focus:ring-1 focus:ring-primary font-sans"
              >
                <option value="all">All Statuses</option>
                <option value="in_tryouts">In Tryouts</option>
                <option value="contacted">Contacted</option>
                <option value="not_contacted">Not Contacted</option>
                <option value="substitute">Substitute</option>
                <option value="accepted">Accepted</option>
              </select>
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
                      ? 'bg-primary/20 border-primary/50'
                      : 'bg-dark-hover border-gray-700 hover:bg-dark-hover/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.has(player.id)}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-gray-700 bg-dark text-primary"
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Tryout Week'}
          </button>
          <Link href="/dashboard/manager/teams/tryouts">
            <button type="button" className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition">
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
