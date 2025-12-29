'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, MatchType } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, X, Plus, Trash2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface EditMatchClientProps {
  matchId: string
  teamId: string
}

interface PlayerStats {
  id?: string
  playerId: string
  playerName: string
  kills: number
  deaths: number
  assists: number
  acs: number
  econRating: number
  firstKills: number
  plants: number
  defuses: number
  agentPlayed: string
}

export default function EditMatchClient({ matchId, teamId }: EditMatchClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('matches')
  const tCommon = useTranslations('common')
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [players, setPlayers] = useState<UserProfile[]>([])

  const [opponentName, setOpponentName] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [ourScore, setOurScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [mapName, setMapName] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('Scrim')
  const [notes, setNotes] = useState('')
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchData()
  }, [matchId, teamId])

  const fetchData = async () => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('match_history')
        .select('*')
        .eq('id', matchId)
        .eq('team_id', teamId)
        .single()

      if (matchError) throw matchError

      setOpponentName(matchData.opponent_name)
      setMatchDate(new Date(matchData.match_date).toISOString().slice(0, 16))
      setOurScore(matchData.our_score)
      setOpponentScore(matchData.opponent_score)
      setMapName(matchData.map_name || '')
      setMatchType(matchData.match_type || 'Scrim')
      setNotes(matchData.notes || '')

      const { data: statsData, error: statsError } = await supabase
        .from('player_match_stats')
        .select(`
          *,
          player:profiles(*)
        `)
        .eq('match_id', matchId)

      if (statsError) throw statsError

      const formattedStats: PlayerStats[] = (statsData || []).map((stat: any) => ({
        id: stat.id,
        playerId: stat.player_id,
        playerName: stat.player.username,
        kills: stat.kills,
        deaths: stat.deaths,
        assists: stat.assists,
        acs: stat.acs,
        econRating: stat.econ_rating || 0,
        firstKills: stat.first_kills,
        plants: stat.plants,
        defuses: stat.defuses,
        agentPlayed: stat.agent_played || ''
      }))

      setPlayerStats(formattedStats)

      const { data: playersData, error: playersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', 'player')
        .order('username')

      if (playersError) throw playersError
      setPlayers(playersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load match data')
    } finally {
      setLoadingData(false)
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
        econRating: 0,
        firstKills: 0,
        plants: 0,
        defuses: 0,
        agentPlayed: ''
      }
    ])
  }

  const removePlayerStat = async (index: number) => {
    const stat = playerStats[index]
    
    if (stat.id) {
      try {
        const { error } = await supabase
          .from('player_match_stats')
          .delete()
          .eq('id', stat.id)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting player stat:', error)
        alert('Failed to delete player stat')
        return
      }
    }

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
      const { error: matchError } = await supabase
        .from('match_history')
        .update({
          opponent_name: opponentName.trim(),
          match_date: matchDate,
          our_score: ourScore,
          opponent_score: opponentScore,
          result: calculateResult(),
          map_name: mapName.trim() || null,
          match_type: matchType,
          notes: notes.trim() || null
        })
        .eq('id', matchId)

      if (matchError) throw matchError

      for (const stat of playerStats) {
        const statData = {
          match_id: matchId,
          player_id: stat.playerId,
          kills: stat.kills,
          deaths: stat.deaths,
          assists: stat.assists,
          acs: stat.acs,
          econ_rating: stat.econRating,
          first_kills: stat.firstKills,
          plants: stat.plants,
          defuses: stat.defuses,
          agent_played: stat.agentPlayed.trim()
        }

        if (stat.id) {
          const { error } = await supabase
            .from('player_match_stats')
            .update(statData)
            .eq('id', stat.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('player_match_stats')
            .insert(statData)

          if (error) throw error
        }
      }

      router.push(`/dashboard/manager/stats/match/${matchId}`)
    } catch (error) {
      console.error('Error updating match:', error)
      alert('Failed to update match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/manager/stats/match/${matchId}`}>
          <button className="p-2 hover:bg-dark-card rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Match</h1>
          <p className="text-gray-400 mt-1">Update match details and player statistics</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Match Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Opponent Name *</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Match Date & Time *</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Our Score *</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Opponent Score *</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Map Name</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="e.g., Ascent, Haven, Bind"
                className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Match Type *</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as MatchType)}
                className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                required
              >
                <option value="Scrim">Scrim</option>
                <option value="Tournament">Tournament</option>
                <option value="Qualifier">Qualifier</option>
                <option value="League">League</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
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
            </div>
          ) : (
            <div className="space-y-4">
              {playerStats.map((stat, index) => {
                const isExpanded = expandedPlayers.has(index)
                const playerName = players.find(p => p.id === stat.playerId)?.username || stat.playerName || `Player ${index + 1}`
                
                return (
                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Header - Always visible */}
                    <div className="bg-dark-card p-4 flex items-center justify-between">
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
                          <ChevronUp className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <span className="text-lg font-semibold text-white">{playerName}</span>
                          {stat.agentPlayed && (
                            <span className="ml-3 text-sm text-gray-400">• {stat.agentPlayed}</span>
                          )}
                          {!isExpanded && (
                            <span className="ml-3 text-sm text-gray-500">
                              K: {stat.kills} / D: {stat.deaths} / A: {stat.assists} / ACS: {stat.acs}
                            </span>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlayerStat(index)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded transition ml-2"
                        title="Remove player"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Expandable content */}
                    {isExpanded && (
                      <div className="p-4 bg-dark">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('player')} *</label>
                            <select
                              value={stat.playerId}
                              onChange={(e) => updatePlayerStat(index, 'playerId', e.target.value)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                              required
                            >
                              <option value="">{t('selectPlayer')}</option>
                              {players
                                .filter(p => !playerStats.some((s, i) => i !== index && s.playerId === p.id))
                                .concat(players.filter(p => p.id === stat.playerId))
                                .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
                                .map(player => (
                                  <option key={player.id} value={player.id}>
                                    {player.username} {player.in_game_name ? `(${player.in_game_name})` : ''}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('agentPlayed')} *</label>
                            <input
                              type="text"
                              value={stat.agentPlayed}
                              onChange={(e) => updatePlayerStat(index, 'agentPlayed', e.target.value)}
                              placeholder={t('agentPlaceholder')}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                              required
                            />
                          </div>

                          {/* Stats inputs */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('kills')}</label>
                            <input
                              type="number"
                              min="0"
                              value={stat.kills}
                              onChange={(e) => updatePlayerStat(index, 'kills', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('deaths')}</label>
                            <input
                              type="number"
                              min="0"
                              value={stat.deaths}
                              onChange={(e) => updatePlayerStat(index, 'deaths', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('assists')}</label>
                            <input
                              type="number"
                              min="0"
                              value={stat.assists}
                              onChange={(e) => updatePlayerStat(index, 'assists', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('avgCs')}</label>
                            <input
                              type="number"
                              min="0"
                              value={stat.acs}
                              onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('econRating')}</label>
                            <input
                              type="number"
                              value={stat.econRating}
                              onChange={(e) => updatePlayerStat(index, 'econRating', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('firstKills')}</label>
                            <input
                              type="number"
                              min="0"
                              value={stat.firstKills}
                              onChange={(e) => updatePlayerStat(index, 'firstKills', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('plants')}</label>
                            <input
                              type="number"
                              min="0"
                              value={stat.plants}
                              onChange={(e) => updatePlayerStat(index, 'plants', parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('defuses')}</label>
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
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-end">
          <Link href={`/dashboard/manager/stats/match/${matchId}`}>
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
