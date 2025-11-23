'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Copy, CheckCircle, User, Trash2, BarChart3, Clock, RefreshCw, UserPlus, Edit2, Save, X, Search } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TryoutWeek, PlayerAvailability, ProfileTryout, TeamCategory } from '@/lib/types/database'
import AvailabilityHeatmap from '@/components/AvailabilityHeatmap'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'

interface TryoutWeekDetailManagerProps {
  weekId: string
  team: any
  teamCategory: TeamCategory | null
}

export default function TryoutWeekDetailManager({ weekId, team, teamCategory }: TryoutWeekDetailManagerProps) {
  const router = useRouter()
  const [week, setWeek] = useState<TryoutWeek | null>(null)
  const [availabilities, setAvailabilities] = useState<PlayerAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'heatmap' | 'individual'>('heatmap')
  const [showAddPlayersModal, setShowAddPlayersModal] = useState(false)
  const [availablePlayers, setAvailablePlayers] = useState<ProfileTryout[]>([])
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<string[]>([])
  const [addingPlayers, setAddingPlayers] = useState(false)
  const [playerSearchTerm, setPlayerSearchTerm] = useState('')
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)
  const supabase = createClient()

  // Filter players in Add Players modal based on search
  const filteredAvailablePlayers = useMemo(() => {
    if (!playerSearchTerm) return availablePlayers
    
    const search = playerSearchTerm.toLowerCase()
    return availablePlayers.filter(player => 
      player.username.toLowerCase().includes(search) ||
      player.position?.toLowerCase().includes(search) ||
      player.nationality?.toLowerCase().includes(search)
    )
  }, [availablePlayers, playerSearchTerm])

  useEffect(() => {
    if (weekId) {
      fetchTryoutWeek()
    }
  }, [weekId])

  // Cleanup: restore body scroll when component unmounts or modal state changes
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddPlayersModal) {
        handleCloseAddPlayersModal()
      }
    }

    if (showAddPlayersModal) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showAddPlayersModal])

  const fetchTryoutWeek = async () => {
    try {
      const { data: weekData, error: weekError } = await supabase
        .from('tryout_weeks')
        .select('*')
        .eq('id', weekId)
        .single()

      if (weekError) throw weekError

      // Verify this week belongs to manager's team
      if (weekData.team_category !== teamCategory) {
        router.push('/dashboard/manager/teams/tryouts')
        return
      }

      const { data: availData, error: availError} = await supabase
        .from('player_availabilities')
        .select(`
          *,
          player:profiles_tryouts(*)
        `)
        .eq('tryout_week_id', weekId)

      if (availError) throw availError

      setWeek(weekData)
      setAvailabilities(availData || [])
    } catch (error) {
      console.error('Error fetching tryout week:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePlayers = async () => {
    if (!week || !teamCategory) return
    
    try {
      // Get all players from the manager's team category who aren't already in this tryout
      const currentPlayerIds = availabilities.map(a => a.player_id)
      
      let query = supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('team_category', week.team_category)
        .in('status', ['in_tryouts', 'accepted', 'substitute'])
        .order('username')
        
      // Only add the exclusion filter if there are existing players
      if (currentPlayerIds.length > 0) {
        query = query.not('id', 'in', `(${currentPlayerIds.join(',')})`)
      }

      const { data: players, error } = await query

      if (error) throw error
      setAvailablePlayers(players || [])
    } catch (error) {
      console.error('Error fetching available players:', error)
    }
  }

  const handleAddPlayers = async () => {
    if (selectedPlayersToAdd.length === 0 || !week) return
    
    setAddingPlayers(true)
    try {
      // Create player availability records for selected players
      const playerAvailabilities = selectedPlayersToAdd.map(playerId => ({
        tryout_week_id: week.id,
        player_id: playerId,
        token: crypto.randomUUID().replace(/-/g, ''),
        time_slots: {},
        submitted_at: null,
      }))

      const { error } = await supabase
        .from('player_availabilities')
        .insert(playerAvailabilities)

      if (error) throw error

      // Refresh the data
      await fetchTryoutWeek()
      
      // Get added player names for confirmation
      const addedPlayerNames = availablePlayers
        .filter(p => selectedPlayersToAdd.includes(p.id))
        .map(p => p.username)
        .join(', ')
      
      // Reset modal state
      setSelectedPlayersToAdd([])
      setPlayerSearchTerm('')
      setShowAddPlayersModal(false)
      document.body.style.overflow = 'unset' // Restore background scrolling
      
      // Success notification
      const count = selectedPlayersToAdd.length
      alert(`✅ ${count} player${count > 1 ? 's' : ''} added successfully!\n\n${addedPlayerNames}`)
    } catch (error) {
      console.error('Error adding players:', error)
      alert('❌ Error adding players. Please try again.')
    } finally {
      setAddingPlayers(false)
    }
  }

  const handleShowAddPlayersModal = async () => {
    setShowAddPlayersModal(true)
    setPlayerSearchTerm('') // Reset search when opening modal
    document.body.style.overflow = 'hidden' // Prevent background scrolling
    await fetchAvailablePlayers()
  }

  const handleCloseAddPlayersModal = () => {
    setShowAddPlayersModal(false)
    setPlayerSearchTerm('') // Clear search on close
    setSelectedPlayersToAdd([]) // Clear selections on close
    document.body.style.overflow = 'unset' // Restore background scrolling
  }

  const handleStartEdit = () => {
    if (week) {
      setEditedTitle(week.week_label || '')
      setEditedNotes(week.notes || '')
      setIsEditingInfo(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingInfo(false)
    setEditedTitle('')
    setEditedNotes('')
  }

  const handleSaveInfo = async () => {
    if (!week) return
    
    setSavingInfo(true)
    try {
      const { error } = await supabase
        .from('tryout_weeks')
        .update({
          week_label: editedTitle || null,
          notes: editedNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', week.id)

      if (error) throw error

      // Update local state
      setWeek({
        ...week,
        week_label: editedTitle,
        notes: editedNotes,
        updated_at: new Date().toISOString(),
      })

      setIsEditingInfo(false)
      alert('Information updated successfully!')
    } catch (error) {
      console.error('Error updating tryout info:', error)
      alert('Error updating information')
    } finally {
      setSavingInfo(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchTryoutWeek()
    } finally {
      setRefreshing(false)
    }
  }

  const copyTokenLink = (token: string) => {
    const link = `${window.location.origin}/availability/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const hasResponded = (availability: PlayerAvailability): boolean => {
    const slots = availability.time_slots || {}
    return Object.keys(slots).length > 0 && 
           Object.values(slots).some(day => Object.values(day || {}).length > 0)
  }

  const countAvailableSlots = (availability: PlayerAvailability): number => {
    const slots = availability.time_slots || {}
    let count = 0
    Object.values(slots).forEach(day => {
      if (day) {
        Object.values(day).forEach(available => {
          if (available) count++
        })
      }
    })
    return count
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tryout week? This will also delete all player availabilities.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tryout_weeks')
        .delete()
        .eq('id', weekId)

      if (error) throw error

      router.push('/dashboard/manager/teams/tryouts')
    } catch (error) {
      console.error('Error deleting tryout week:', error)
      alert('Failed to delete tryout week')
    }
  }

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
      case 'player': return 'Player'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!week) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Tryout week not found</div>
      </div>
    )
  }

  const stats = {
    total: availabilities.length,
    responded: availabilities.filter(a => hasResponded(a)).length,
    pending: availabilities.filter(a => !hasResponded(a)).length,
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
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {isEditingInfo ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Session Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Ex: January 2025 Tryouts"
                    className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description / Notes</label>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Notes or instructions for this session..."
                    rows={3}
                    className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveInfo}
                    disabled={savingInfo}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingInfo ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingInfo}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                    <Calendar className="w-8 h-8 text-primary" />
                    {week.week_label || `Session ${formatDate(week.week_start)} - ${formatDate(week.week_end)}`}
                  </h1>
                  <button
                    onClick={handleStartEdit}
                    className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-dark-hover"
                    title="Edit information"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-400 mt-2">
                  {formatDate(week.week_start)} - {formatDate(week.week_end)} · {team.name}
                </p>
                {week.notes && (
                  <p className="text-gray-300 mt-2 text-sm bg-dark-card px-4 py-2 rounded-lg border border-gray-800">
                    {week.notes}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isEditingInfo && (
              <>
                <button
                  onClick={handleShowAddPlayersModal}
                  className="flex items-center gap-2 px-4 py-2 border border-green-700 text-green-400 rounded-lg hover:bg-green-500/20 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Players
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div className="text-3xl font-bold text-green-400">{stats.responded}</div>
          </div>
          <div className="text-sm text-gray-400">Responded</div>
        </div>
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-yellow-400" />
            <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            <div className="text-3xl font-bold text-blue-400">{stats.responded}/{stats.total}</div>
          </div>
          <div className="text-sm text-gray-400">Response Rate</div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              viewMode === 'heatmap'
                ? 'bg-primary text-white'
                : 'border border-gray-700 text-gray-300 hover:bg-dark-hover'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Heatmap View
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              viewMode === 'individual'
                ? 'bg-primary text-white'
                : 'border border-gray-700 text-gray-300 hover:bg-dark-hover'
            }`}
          >
            <User className="w-4 h-4" />
            Individual Players
          </button>
        </div>
      </div>

      {/* Heatmap View */}
      {viewMode === 'heatmap' && week && (
        <div>
          <AvailabilityHeatmap availabilities={availabilities} weekStart={week.week_start} />
        </div>
      )}

      {/* Individual Players View */}
      {viewMode === 'individual' && week && (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Individual Player Availability</h2>
          
          <div className="space-y-6">
            {availabilities.map((availability) => {
              const player = (availability as any).player
              const responded = hasResponded(availability)
              const slotsCount = countAvailableSlots(availability)
              
              return (
                <div key={availability.id} className="bg-dark border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <User className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="text-white font-medium">{player?.username || 'Unknown Player'}</div>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${
                            responded 
                              ? 'border-green-400 text-green-400' 
                              : 'border-yellow-400 text-yellow-400'
                          }`}>
                            {responded ? 'Responded' : 'Pending'}
                          </span>
                        </div>
                        {responded && (
                          <div className="text-sm text-gray-400 mt-1">
                            {slotsCount} slot{slotsCount !== 1 ? 's' : ''} selected
                          </div>
                        )}
                        {availability.submitted_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Submitted: {formatDateTime(availability.submitted_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => copyTokenLink(availability.token)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition"
                    >
                      {copiedToken === availability.token ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>

                  {responded && availability.time_slots && (
                    <div className="mt-4">
                      <AvailabilityCalendar
                        weekStart={week.week_start}
                        timeSlots={availability.time_slots}
                        onChange={() => {}} // Read-only
                        readOnly={true}
                      />
                    </div>
                  )}

                  {!responded && (
                    <div className="mt-4 text-center py-8 text-gray-400">
                      Player has not submitted their availability yet
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Players Modal */}
      {showAddPlayersModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Add Players</h3>
                <p className="text-sm text-gray-400">
                  Session: {week?.week_label || 'Untitled'} • {team.name}
                </p>
              </div>
              <button
                onClick={handleCloseAddPlayersModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-hover rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availablePlayers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-dark flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-300 font-medium mb-2">No players available</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    All eligible players from this team are already in this tryout session.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={playerSearchTerm}
                      onChange={(e) => setPlayerSearchTerm(e.target.value)}
                      placeholder="Search by name, role or nationality..."
                      className="w-full pl-11 bg-dark border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  {/* Results Counter */}
                  {playerSearchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      {filteredAvailablePlayers.length} player{filteredAvailablePlayers.length !== 1 ? 's' : ''} found
                    </div>
                  )}
                </div>

                {/* Player List */}
                {filteredAvailablePlayers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-dark flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-300 font-medium mb-2">No results</p>
                      <p className="text-sm text-gray-500">
                        No players match your search
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-3 px-1 py-1">
                      {filteredAvailablePlayers.map((player) => {
                        const isSelected = selectedPlayersToAdd.includes(player.id)
                        
                        return (
                          <div
                            key={player.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-700 bg-dark-hover hover:border-gray-600'
                            }`}
                            onClick={() => {
                              setSelectedPlayersToAdd(prev =>
                                prev.includes(player.id)
                                  ? prev.filter(id => id !== player.id)
                                  : [...prev, player.id]
                              )
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-white text-lg truncate">
                                    {player.username}
                                  </h4>
                                  {isSelected && (
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-gray-400 capitalize">
                                    {player.position || 'Undefined'}
                                  </span>
                                  {player.nationality && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="text-gray-400">{player.nationality}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(player.status)}`}>
                                  {getStatusLabel(player.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-800">
                  <div className="text-sm">
                    <span className="text-gray-400">Selection: </span>
                    <span className="text-white font-semibold">
                      {selectedPlayersToAdd.length} player{selectedPlayersToAdd.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseAddPlayersModal}
                      disabled={addingPlayers}
                      className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-dark-hover transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPlayers}
                      disabled={selectedPlayersToAdd.length === 0 || addingPlayers}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      {addingPlayers ? 'Adding...' : `Add (${selectedPlayersToAdd.length})`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
