'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, UserProfile, MatchType } from '@/lib/types/database'
import { ArrowLeft, Save, Plus, Trash2, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'

interface RecordMatchClientProps {
  teams: Team[]
  userId: string
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
  agent: string
  championPool: string[]
}

type RecordStep = 'select-team' | 'match-details' | 'player-stats'

export default function RecordMatchClient({ teams, userId }: RecordMatchClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<RecordStep>('select-team')
  const [players, setPlayers] = useState<UserProfile[]>([])

  // Team selection
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const selectedTeam = teams.find(t => t.id === selectedTeamId)

  // Match details
  const [opponentName, setOpponentName] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 16))
  const [ourScore, setOurScore] = useState(13)
  const [opponentScore, setOpponentScore] = useState(0)
  const [mapName, setMapName] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('Scrim')
  const [notes, setNotes] = useState('')

  // Player statistics
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])

  useEffect(() => {
    if (selectedTeamId && step === 'player-stats') {
      fetchPlayers(selectedTeamId)
    }
  }, [selectedTeamId, step])

  const fetchPlayers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', 'player')
        .order('username')

      if (error) throw error
      setPlayers(data || [])
      
      // Initialize player stats if empty
      if (playerStats.length === 0 && data && data.length > 0) {
        setPlayerStats(data.slice(0, 5).map(p => {
          const championPool = p.champion_pool || []
          return {
            playerId: p.id,
            playerName: p.in_game_name || p.username,
            kills: 0,
            deaths: 0,
            assists: 0,
            acs: 0,
            firstKills: 0,
            plants: 0,
            defuses: 0,
            agent: championPool.length === 1 ? championPool[0] : '',
            championPool: championPool
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const addPlayerStat = () => {
    const availablePlayers = players.filter(p => 
      !playerStats.some(ps => ps.playerId === p.id)
    )
    
    if (availablePlayers.length === 0) {
      alert('All players have been added')
      return
    }

    const nextPlayer = availablePlayers[0]
    const championPool = nextPlayer.champion_pool || []
    setPlayerStats([
      ...playerStats,
      {
        playerId: nextPlayer.id,
        playerName: nextPlayer.in_game_name || nextPlayer.username,
        kills: 0,
        deaths: 0,
        assists: 0,
        acs: 0,
        firstKills: 0,
        plants: 0,
        defuses: 0,
        agent: championPool.length === 1 ? championPool[0] : '',
        championPool: championPool
      }
    ])
  }

  const removePlayerStat = (index: number) => {
    setPlayerStats(playerStats.filter((_, i) => i !== index))
  }

  const updatePlayerStat = (index: number, field: keyof PlayerStats, value: string | number) => {
    const newStats = [...playerStats]
    if (field === 'playerId') {
      const player = players.find(p => p.id === value)
      const championPool = player?.champion_pool || []
      newStats[index] = {
        ...newStats[index],
        playerId: value as string,
        playerName: player ? (player.in_game_name || player.username) : '',
        championPool: championPool,
        agent: championPool.length === 1 ? championPool[0] : ''
      }
    } else {
      newStats[index] = {
        ...newStats[index],
        [field]: value
      }
    }
    setPlayerStats(newStats)
  }

  const handleSubmit = async () => {
    if (!selectedTeamId || !opponentName.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Determine result
      const result = ourScore > opponentScore ? 'win' : ourScore < opponentScore ? 'loss' : 'draw'

      // Insert match
      const { data: matchData, error: matchError } = await supabase
        .from('match_history')
        .insert({
          team_id: selectedTeamId,
          opponent_name: opponentName,
          match_date: new Date(matchDate).toISOString(),
          our_score: ourScore,
          opponent_score: opponentScore,
          result,
          map_name: mapName || null,
          match_type: matchType,
          notes: notes || null,
          created_by: userId
        })
        .select()
        .single()

      if (matchError) throw matchError

      // Insert player stats
      if (playerStats.length > 0) {
        const statsToInsert = playerStats
          .filter(ps => ps.playerId)
          .map(ps => ({
            match_id: matchData.id,
            player_id: ps.playerId,
            kills: ps.kills,
            deaths: ps.deaths,
            assists: ps.assists,
            acs: ps.acs,
            agent_played: ps.agent || null,
            headshot_percentage: 0,
            first_kills: 0,
            first_deaths: 0,
            plants: 0,
            defuses: 0
          }))

        if (statsToInsert.length > 0) {
          const { error: statsError } = await supabase
            .from('player_match_stats')
            .insert(statsToInsert)

          if (statsError) throw statsError
        }
      }

      alert('Match recorded successfully!')
      router.push('/dashboard/admin/matches')
    } catch (error) {
      console.error('Error recording match:', error)
      alert('Failed to record match')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToDetails = selectedTeamId && opponentName.trim()
  const canSubmit = selectedTeamId && opponentName.trim() && ourScore >= 0 && opponentScore >= 0

  return (
    <div className="max-w-6xl space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/admin/matches">
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Matches
        </button>
      </Link>

      {/* Progress Steps */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 ${step === 'select-team' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'select-team' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                1
              </div>
              <span className="font-medium">Select Team</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-800"></div>
            <div className={`flex items-center gap-3 ${step === 'match-details' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'match-details' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                2
              </div>
              <span className="font-medium">Match Details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-800"></div>
            <div className={`flex items-center gap-3 ${step === 'player-stats' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'player-stats' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                3
              </div>
              <span className="font-medium">Player Stats</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Select Team */}
      {step === 'select-team' && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Select Team</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedTeamId === team.id
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Trophy className={`w-8 h-8 ${selectedTeamId === team.id ? 'text-primary' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className="text-white font-semibold text-lg">{team.name}</p>
                    <p className="text-gray-400 text-sm">{team.game}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Opponent Name *</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Enter opponent team name"
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>

            <button
              onClick={() => setStep('match-details')}
              disabled={!canProceedToDetails}
              className="w-full py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue to Match Details
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Match Details */}
      {step === 'match-details' && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Match Details</h2>
            <button
              onClick={() => setStep('select-team')}
              className="text-gray-400 hover:text-white transition"
            >
              Change Team
            </button>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">Recording for</p>
            <p className="text-white font-semibold text-lg">{selectedTeam?.name} vs {opponentName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Match Date & Time *</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Match Type</label>
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
                className="min-w-[160px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Our Score *</label>
              <input
                type="number"
                value={ourScore}
                onChange={(e) => setOurScore(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Opponent Score *</label>
              <input
                type="number"
                value={opponentScore}
                onChange={(e) => setOpponentScore(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Map Name</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="e.g., Ascent, Bind, Haven..."
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about the match..."
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('select-team')}
              className="flex-1 py-3 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 rounded-xl font-semibold transition border border-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setStep('player-stats')}
              className="flex-1 py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110"
            >
              Continue to Player Stats
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Player Stats */}
      {step === 'player-stats' && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Player Statistics</h2>
            <button
              onClick={() => setStep('match-details')}
              className="text-gray-400 hover:text-white transition"
            >
              Back to Details
            </button>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Match Summary</p>
            <p className="text-white font-semibold text-lg">
              {selectedTeam?.name} <span className={ourScore > opponentScore ? 'text-green-400' : ourScore < opponentScore ? 'text-red-400' : 'text-yellow-400'}>{ourScore}</span>
              <span className="text-gray-500 mx-2">-</span>
              <span className={opponentScore > ourScore ? 'text-green-400' : opponentScore < ourScore ? 'text-red-400' : 'text-yellow-400'}>{opponentScore}</span> {opponentName}
            </p>
            {mapName && <p className="text-sm text-gray-400 mt-1">{mapName}</p>}
          </div>

          <p className="text-sm text-gray-400 mb-4">Add player statistics (optional - you can skip this step)</p>

          <div className="space-y-4 mb-6">
            {playerStats.map((stat, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <div className="space-y-4">
                  {/* Player Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Player</label>
                    <CustomSelect
                      value={stat.playerId}
                      onChange={(value) => updatePlayerStat(index, 'playerId', value)}
                      options={[
                        { value: '', label: 'Select...' },
                        ...players
                          .filter(p => p.id === stat.playerId || !playerStats.some(ps => ps.playerId === p.id))
                          .map(player => ({
                            value: player.id,
                            label: player.in_game_name || player.username
                          }))
                      ]}
                      className="w-full"
                    />
                  </div>

                  {/* Core Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Kills</label>
                      <input
                        type="number"
                        value={stat.kills}
                        onChange={(e) => updatePlayerStat(index, 'kills', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Deaths</label>
                      <input
                        type="number"
                        value={stat.deaths}
                        onChange={(e) => updatePlayerStat(index, 'deaths', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Assists</label>
                      <input
                        type="number"
                        value={stat.assists}
                        onChange={(e) => updatePlayerStat(index, 'assists', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Advanced Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">AVG CS (ACS)</label>
                      <input
                        type="number"
                        value={stat.acs}
                        onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">First Bloods</label>
                      <input
                        type="number"
                        value={stat.firstKills}
                        onChange={(e) => updatePlayerStat(index, 'firstKills', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Objective Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Plants</label>
                      <input
                        type="number"
                        value={stat.plants}
                        onChange={(e) => updatePlayerStat(index, 'plants', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Defuses</label>
                      <input
                        type="number"
                        value={stat.defuses}
                        onChange={(e) => updatePlayerStat(index, 'defuses', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Agent Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Agent</label>
                    {stat.championPool && stat.championPool.length > 0 ? (
                      <>
                        <CustomSelect
                          value={stat.championPool.includes(stat.agent || '') ? stat.agent : 'other'}
                          onChange={(value) => {
                            if (value !== 'other') {
                              updatePlayerStat(index, 'agent', value)
                            }
                          }}
                          options={[
                            { value: '', label: 'Select...' },
                            ...stat.championPool.map(champion => ({
                              value: champion,
                              label: champion
                            })),
                            { value: 'other', label: 'Other (Custom)' }
                          ]}
                          className="w-full"
                        />
                        {!stat.championPool.includes(stat.agent || '') && stat.agent !== '' && (
                          <input
                            type="text"
                            value={stat.agent || ''}
                            onChange={(e) => updatePlayerStat(index, 'agent', e.target.value)}
                            placeholder="Enter agent name"
                            className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none mt-2"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={stat.agent || ''}
                          onChange={(e) => updatePlayerStat(index, 'agent', e.target.value)}
                          placeholder="e.g., Jett"
                          className="w-full px-3 py-2 bg-dark border border-gray-700 rounded-lg text-white text-sm focus:border-primary focus:outline-none"
                        />
                        {stat.playerId && (
                          <p className="text-xs text-yellow-400 mt-1">No agent pool defined for this player</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => removePlayerStat(index)}
                      className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-2"
                      title="Remove Player"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Remove Player</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {playerStats.length < players.length && (
            <button
              onClick={addPlayerStat}
              className="w-full py-3 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 rounded-xl font-medium transition border border-gray-700 flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" />
              Add Player
            </button>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep('match-details')}
              className="flex-1 py-3 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 rounded-xl font-semibold transition border border-gray-700"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Recording...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Match
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
