'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, MatchType } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, X, Plus, Trash2, ArrowLeft } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'

interface RecordMatchClientProps {
  teamId: string
  teamName: string
}

interface PlayerStats {
  playerId: string
  playerName: string
  championPool: string[]
  kills: number
  deaths: number
  assists: number
  acs: number
  firstKills: number
  plants: number
  defuses: number
  agentPlayed: string
}

export default function RecordMatchClient({ teamId, teamName }: RecordMatchClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  // Match details
  const [opponentName, setOpponentName] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 16))
  const [ourScore, setOurScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [mapName, setMapName] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('Scrim')
  const [notes, setNotes] = useState('')

  // Player statistics
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])

  useEffect(() => {
    fetchPlayers()
  }, [teamId])

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', 'player')
        .order('username')

      if (error) throw error
      setPlayers(data || [])
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
        championPool: [],
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
        updated[index].championPool = player.champion_pool || []
        // Auto-select first agent if only one in pool
        if (player.champion_pool && player.champion_pool.length === 1) {
          updated[index].agentPlayed = player.champion_pool[0]
        } else {
          updated[index].agentPlayed = ''
        }
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
          team_id: teamId,
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

      router.push('/dashboard/manager/stats')
    } catch (error) {
      console.error('Error saving match:', error)
      alert('Failed to save match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPlayers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="bg-dark-card border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400 mb-4">No players found in this team roster.</p>
        <p className="text-gray-500">Add players to the team before recording matches.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/manager/stats">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Statistics
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Record Match</h1>
          <p className="text-gray-400">{teamName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Details */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Match Details</h2>
          
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
                placeholder="e.g., Ascent, Haven, Bind"
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
              rows={3}
              placeholder="Additional notes about the match..."
              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mt-4 p-4 bg-dark rounded-lg border border-gray-700">
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
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Player Statistics</h2>
            <button
              type="button"
              onClick={addPlayerStat}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              disabled={playerStats.length >= players.length}
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>

          {playerStats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No player statistics added yet.</p>
              <p className="text-sm mt-2">Click "Add Player" to record player performance.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {playerStats.map((stat, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => removePlayerStat(index)}
                    className="absolute top-4 right-4 p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <h3 className="text-lg font-semibold text-white mb-4">
                    Player {index + 1}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Player *
                      </label>
                      <CustomSelect
                        value={stat.playerId}
                        onChange={(value) => updatePlayerStat(index, 'playerId', value)}
                        placeholder="Select Player"
                        options={[
                          { value: '', label: 'Select Player' },
                          ...players
                            .filter(p => !playerStats.some((s, i) => i !== index && s.playerId === p.id))
                            .map(player => ({
                              value: player.id,
                              label: `${player.username}${player.in_game_name ? ` (${player.in_game_name})` : ''}`
                            }))
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Agent Played *
                      </label>
                      {stat.championPool && stat.championPool.length > 0 ? (
                        <>
                          <CustomSelect
                            value={stat.championPool.includes(stat.agentPlayed) ? stat.agentPlayed : 'other'}
                            onChange={(value) => {
                              if (value !== 'other') {
                                updatePlayerStat(index, 'agentPlayed', value)
                              }
                            }}
                            placeholder="Select Agent"
                            options={[
                              { value: '', label: 'Select Agent' },
                              ...stat.championPool.map(agent => ({ value: agent, label: agent })),
                              { value: 'other', label: 'Other (Custom)' }
                            ]}
                          />
                          {!stat.championPool.includes(stat.agentPlayed) && (
                            <input
                              type="text"
                              value={stat.agentPlayed}
                              onChange={(e) => updatePlayerStat(index, 'agentPlayed', e.target.value)}
                              placeholder="Enter agent name"
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none mt-2"
                              required
                            />
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={stat.agentPlayed}
                          onChange={(e) => updatePlayerStat(index, 'agentPlayed', e.target.value)}
                          placeholder="e.g., Jett, Sage"
                          className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                          required
                        />
                      )}
                      {stat.playerId && stat.championPool.length === 0 && (
                        <p className="text-xs text-yellow-400 mt-1">No agent pool set for this player</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Kills</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.kills}
                        onChange={(e) => updatePlayerStat(index, 'kills', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Deaths</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.deaths}
                        onChange={(e) => updatePlayerStat(index, 'deaths', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Assists</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.assists}
                        onChange={(e) => updatePlayerStat(index, 'assists', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">AVG CS</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.acs}
                        onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Bloods</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.firstKills}
                        onChange={(e) => updatePlayerStat(index, 'firstKills', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Econ Rating</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.acs}
                        onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Plants</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.plants}
                        onChange={(e) => updatePlayerStat(index, 'plants', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Defuses</label>
                      <input
                        type="number"
                        min="0"
                        value={stat.defuses}
                        onChange={(e) => updatePlayerStat(index, 'defuses', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link href="/dashboard/manager/stats">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50"
            disabled={loading || playerStats.length === 0}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Match'}
          </button>
        </div>
      </form>
    </div>
  )
}