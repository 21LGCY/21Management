'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, UserProfile, MatchType } from '@/lib/types/database'
import { X, Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

interface RecordMatchModalProps {
  teams: Team[]
  onClose: () => void
  onSuccess: () => void
}

interface PlayerStats {
  playerId: string
  playerName: string
  kills: number
  deaths: number
  assists: number
  acs: number
  firstKills: number
  plants: number
  defuses: number
  agentPlayed: string
}

export default function RecordMatchModal({ teams, onClose, onSuccess }: RecordMatchModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  // Match details
  const [selectedTeam, setSelectedTeam] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 16))
  const [ourScore, setOurScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [mapName, setMapName] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('Scrim')
  const [notes, setNotes] = useState('')

  // Player statistics
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (selectedTeam) {
      fetchPlayers(selectedTeam)
    } else {
      setPlayers([])
      setPlayerStats([])
    }
  }, [selectedTeam])

  const fetchPlayers = async (teamId: string) => {
    setLoadingPlayers(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', 'player')
        .order('username')

      if (error) throw error
      setPlayers(data || [])
      setPlayerStats([]) // Reset player stats when team changes
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const addPlayerStat = () => {
    if (playerStats.length >= players.length) {
      alert('All players have been added')
      return
    }

    setPlayerStats([
      ...playerStats,
      {
        playerId: '',
        playerName: '',
        kills: 0,
        deaths: 0,
        assists: 0,
        acs: 0,
        firstKills: 0,
        plants: 0,
        defuses: 0,
        agentPlayed: ''
      }
    ])
  }

  const removePlayerStat = (index: number) => {
    setPlayerStats(playerStats.filter((_, i) => i !== index))
  }

  const updatePlayerStat = (index: number, field: keyof PlayerStats, value: any) => {
    const updated = [...playerStats]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'playerId') {
      const player = players.find(p => p.id === value)
      if (player) {
        updated[index].playerName = player.username
      }
    }
    
    setPlayerStats(updated)
  }

  const calculateResult = (): 'win' | 'loss' | 'draw' => {
    if (ourScore > opponentScore) return 'win'
    if (ourScore < opponentScore) return 'loss'
    return 'draw'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeam) {
      alert('Please select a team')
      return
    }

    if (!opponentName.trim()) {
      alert('Please enter opponent name')
      return
    }

    if (playerStats.length === 0) {
      alert('Please add at least one player')
      return
    }

    for (let i = 0; i < playerStats.length; i++) {
      const stat = playerStats[i]
      if (!stat.playerId) {
        alert(`Please select a player for entry ${i + 1}`)
        return
      }
      if (!stat.agentPlayed.trim()) {
        alert(`Please enter agent for ${stat.playerName}`)
        return
      }
    }

    const playerIds = playerStats.map(s => s.playerId)
    const uniqueIds = new Set(playerIds)
    if (playerIds.length !== uniqueIds.size) {
      alert('Cannot add the same player multiple times')
      return
    }

    setLoading(true)

    try {
      const { data: match, error: matchError } = await supabase
        .from('match_history')
        .insert({
          team_id: selectedTeam,
          opponent_name: opponentName.trim(),
          match_date: matchDate,
          our_score: ourScore,
          opponent_score: opponentScore,
          result: calculateResult(),
          map_name: mapName.trim() || null,
          match_type: matchType,
          notes: notes.trim() || null
        })
        .select()
        .single()

      if (matchError) throw matchError

      const statsToInsert = playerStats.map(stat => ({
        match_id: match.id,
        player_id: stat.playerId,
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        acs: stat.acs,
        first_kills: stat.firstKills,
        plants: stat.plants,
        defuses: stat.defuses,
        agent_played: stat.agentPlayed.trim()
      }))

      const { error: statsError } = await supabase
        .from('player_match_stats')
        .insert(statsToInsert)

      if (statsError) throw statsError

      onSuccess()
    } catch (error) {
      console.error('Error saving match:', error)
      alert('Failed to save match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-dark-card border border-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Record Match</h2>
            <p className="text-gray-400 text-sm mt-1">Record match results and player statistics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Team Selection */}
          <div className="bg-dark border border-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Team *
            </label>
            <CustomSelect
              value={selectedTeam}
              onChange={(value) => setSelectedTeam(value)}
              options={[
                { value: '', label: 'Choose a team...' },
                ...teams.map(team => ({
                  value: team.id,
                  label: team.name
                }))
              ]}
              className="w-full"
            />
            {loadingPlayers && (
              <p className="text-sm text-gray-400 mt-2">Loading players...</p>
            )}
            {selectedTeam && !loadingPlayers && players.length === 0 && (
              <p className="text-sm text-yellow-400 mt-2">No players found in this team.</p>
            )}
          </div>

          {/* Match Details */}
          {selectedTeam && players.length > 0 && (
            <>
              <div className="bg-dark border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Match Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Opponent Name *
                    </label>
                    <input
                      type="text"
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                      className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Match Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Our Score *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="26"
                      value={ourScore}
                      onChange={(e) => setOurScore(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Opponent Score *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="26"
                      value={opponentScore}
                      onChange={(e) => setOpponentScore(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Map Name
                    </label>
                    <input
                      type="text"
                      value={mapName}
                      onChange={(e) => setMapName(e.target.value)}
                      placeholder="e.g., Ascent, Haven"
                      className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Match Type *
                    </label>
                    <CustomSelect
                      value={matchType}
                      onChange={(value) => setMatchType(value as MatchType)}
                      options={[
                        { value: 'Scrim', label: 'Scrim' },
                        { value: 'Tournament', label: 'Tournament' },
                        { value: 'Qualifier', label: 'Qualifier' },
                        { value: 'League', label: 'League' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Additional notes..."
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="mt-4 p-3 bg-dark rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">
                    Result: <span className={`font-bold ${
                      calculateResult() === 'win' ? 'text-green-400' :
                      calculateResult() === 'loss' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {calculateResult().toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Player Statistics */}
              <div className="bg-dark border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Player Statistics</h3>
                  <button
                    type="button"
                    onClick={addPlayerStat}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition"
                    disabled={playerStats.length >= players.length}
                  >
                    <Plus className="w-4 h-4" />
                    Add Player
                  </button>
                </div>

                {playerStats.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <p>No player statistics added yet.</p>
                    <p className="mt-1">Click "Add Player" to record player performance.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playerStats.map((stat, index) => {
                      const isExpanded = expandedPlayers.has(index)
                      const playerName = players.find(p => p.id === stat.playerId)?.username || `Player ${index + 1}`
                      
                      return (
                        <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                          {/* Header - Always visible */}
                          <div className="bg-dark-card p-3 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                const newExpanded = new Set(expandedPlayers)
                                if (isExpanded) {
                                  newExpanded.delete(index)
                                } else {
                                  newExpanded.add(index)
                                }
                                setExpandedPlayers(newExpanded)
                              }}
                              className="flex items-center gap-2 flex-1 text-left hover:text-primary transition"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <span className="font-semibold text-white">{playerName}</span>
                                {stat.agentPlayed && (
                                  <span className="ml-2 text-sm text-gray-400">• {stat.agentPlayed}</span>
                                )}
                                {!isExpanded && (
                                  <span className="ml-3 text-xs text-gray-500">
                                    K: {stat.kills} / D: {stat.deaths} / A: {stat.assists} / ACS: {stat.acs}
                                  </span>
                                )}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => removePlayerStat(index)}
                              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition ml-2"
                              title="Remove player"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Expandable content */}
                          {isExpanded && (
                            <div className="p-3 bg-dark">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Player *</label>
                                  <CustomSelect
                                    value={stat.playerId}
                                    onChange={(value) => updatePlayerStat(index, 'playerId', value)}
                                    options={[
                                      { value: '', label: 'Select Player' },
                                      ...players
                                        .filter(p => !playerStats.some((s, i) => i !== index && s.playerId === p.id))
                                        .map(player => ({
                                          value: player.id,
                                          label: `${player.username}${player.in_game_name ? ` (${player.in_game_name})` : ''}`
                                        }))
                                    ]}
                                    className="w-full"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-gray-400 mb-1">Agent *</label>
                                  <input
                                    type="text"
                                    value={stat.agentPlayed}
                                    onChange={(e) => updatePlayerStat(index, 'agentPlayed', e.target.value)}
                                    placeholder="e.g., Jett"
                                    className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none"
                                    required
                                  />
                                </div>

                                <div><label className="block text-xs font-medium text-gray-400 mb-1">K</label><input type="number" min="0" value={stat.kills} onChange={(e) => updatePlayerStat(index, 'kills', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">D</label><input type="number" min="0" value={stat.deaths} onChange={(e) => updatePlayerStat(index, 'deaths', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">A</label><input type="number" min="0" value={stat.assists} onChange={(e) => updatePlayerStat(index, 'assists', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">AVG CS</label><input type="number" min="0" value={stat.acs} onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">Econ Rating</label><input type="number" min="0" value={stat.acs} onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">First Bloods</label><input type="number" min="0" value={stat.firstKills} onChange={(e) => updatePlayerStat(index, 'firstKills', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">Plants</label><input type="number" min="0" value={stat.plants} onChange={(e) => updatePlayerStat(index, 'plants', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                                <div><label className="block text-xs font-medium text-gray-400 mb-1">Defuses</label><input type="number" min="0" value={stat.defuses} onChange={(e) => updatePlayerStat(index, 'defuses', parseInt(e.target.value) || 0)} className="w-full px-3 py-1.5 bg-dark border border-gray-700 rounded text-white text-sm focus:border-primary focus:outline-none" /></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
              disabled={loading || !selectedTeam || playerStats.length === 0}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
