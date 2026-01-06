'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, MatchType } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'
import { getMapsForGame } from '@/lib/types/games'

interface RecordMatchClientProps {
  teamId: string
  teamName: string
  teamGame: 'valorant' | 'cs2'
  userId: string
}

interface PlayerStats {
  playerId: string
  playerName: string
  championPool: string[]
  kills: number
  deaths: number
  assists: number
  acs: number
  econRating: number
  firstKills: number
  plants: number
  defuses: number
  agent: string
}

type RecordStep = 'match-details' | 'player-stats'

export default function RecordMatchClient({ teamId, teamName, teamGame, userId }: RecordMatchClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('matches')
  const tCommon = useTranslations('common')
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<RecordStep>('match-details')
  const [players, setPlayers] = useState<UserProfile[]>([])

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
    if (step === 'player-stats') {
      fetchPlayers()
    }
  }, [step])

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
            econRating: 0,
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
      alert(t('allPlayersAdded'))
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
        econRating: 0,
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
    if (!opponentName.trim()) {
      alert(t('pleaseCompleteRequiredFields'))
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
          team_id: teamId,
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
            econ_rating: ps.econRating,
            agent_played: ps.agent || null,
            first_kills: ps.firstKills,
            plants: ps.plants,
            defuses: ps.defuses
          }))

        if (statsToInsert.length > 0) {
          const { error: statsError } = await supabase
            .from('player_match_stats')
            .insert(statsToInsert)

          if (statsError) throw statsError
        }
      }

      alert(t('matchRecordedSuccessfully'))
      router.push('/dashboard/manager/stats')
    } catch (error) {
      console.error('Error recording match:', error)
      alert(t('failedRecordMatch'))
    } finally {
      setLoading(false)
    }
  }

  const canProceedToPlayerStats = opponentName.trim()
  const canSubmit = opponentName.trim() && ourScore >= 0 && opponentScore >= 0

  return (
    <div className="max-w-6xl space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/manager/stats">
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          {t('backToStatistics')}
        </button>
      </Link>

      {/* Progress Steps */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 ${step === 'match-details' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'match-details' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                1
              </div>
              <span className="font-medium">{t('matchDetails')}</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-800"></div>
            <div className={`flex items-center gap-3 ${step === 'player-stats' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'player-stats' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                2
              </div>
              <span className="font-medium">{t('playerStats')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Match Details */}
      {step === 'match-details' && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">{t('matchDetails')}</h2>

          <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">{t('recordingFor')}</p>
            <p className="text-white font-semibold text-lg">{teamName}</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('opponentName')} *</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder={t('enterOpponentTeamName')}
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('matchDateTime')} *</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('matchType')}</label>
              <CustomSelect
                value={matchType}
                onChange={(value) => setMatchType(value as MatchType)}
                options={[
                  { value: 'Scrim', label: t('scrim') },
                  { value: 'Tournament', label: t('tournament') },
                  { value: 'Qualifier', label: t('qualifier') },
                  { value: 'League', label: t('league') },
                  { value: 'Other', label: t('other') }
                ]}
                className="min-w-[160px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('ourScore')} *</label>
              <input
                type="number"
                value={ourScore}
                onChange={(e) => setOurScore(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('opponentScore')} *</label>
              <input
                type="number"
                value={opponentScore}
                onChange={(e) => setOpponentScore(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('mapName')}</label>
              <CustomSelect
                value={mapName}
                onChange={(value) => setMapName(value)}
                options={[
                  { value: '', label: t('selectMap') || 'Select Map...' },
                  ...getMapsForGame(teamGame).map(map => ({
                    value: map,
                    label: map
                  }))
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t('addMatchNotes')}
                className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('player-stats')}
            disabled={!canProceedToPlayerStats}
            className="w-full py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {t('continueToPlayerStats')}
          </button>
        </div>
      )}

      {/* Step 2: Player Stats */}
      {step === 'player-stats' && (
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{t('playerStatistics')}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('match-details')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToMatchDetails')}
              </button>
              <button
                onClick={addPlayerStat}
                disabled={playerStats.length >= players.length}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {t('addPlayer')}
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {playerStats.map((stat, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {t('playerNumber', { number: index + 1 })}
                  </h3>
                  <button
                    onClick={() => removePlayerStat(index)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Player Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('player')} *</label>
                    <CustomSelect
                      value={stat.playerId}
                      onChange={(value) => updatePlayerStat(index, 'playerId', value)}
                      placeholder={t('selectPlayer')}
                      options={players
                        .filter(p => !playerStats.some((s, i) => i !== index && s.playerId === p.id))
                        .map(p => ({
                          value: p.id,
                          label: p.in_game_name || p.username
                        }))}
                    />
                  </div>

                  {/* Agent Selection - Only for Valorant */}
                  {teamGame === 'valorant' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t('agentPlayed')}</label>
                      {stat.championPool && stat.championPool.length > 0 ? (
                        <CustomSelect
                          value={stat.agent}
                          onChange={(value) => updatePlayerStat(index, 'agent', value)}
                          placeholder={t('selectAgent')}
                          options={stat.championPool.map(agent => ({
                            value: agent,
                            label: agent
                          }))}
                        />
                      ) : (
                        <input
                          type="text"
                          value={stat.agent}
                          onChange={(e) => updatePlayerStat(index, 'agent', e.target.value)}
                          placeholder={t('enterAgentName')}
                          className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                        />
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('kills')}</label>
                    <input
                      type="number"
                      value={stat.kills}
                      onChange={(e) => updatePlayerStat(index, 'kills', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('deaths')}</label>
                    <input
                      type="number"
                      value={stat.deaths}
                      onChange={(e) => updatePlayerStat(index, 'deaths', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('assists')}</label>
                    <input
                      type="number"
                      value={stat.assists}
                      onChange={(e) => updatePlayerStat(index, 'assists', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('avgCs')}</label>
                    <input
                      type="number"
                      value={stat.acs}
                      onChange={(e) => updatePlayerStat(index, 'acs', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('econRating')}</label>
                    <input
                      type="number"
                      value={stat.econRating}
                      onChange={(e) => updatePlayerStat(index, 'econRating', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('firstBloods')}</label>
                    <input
                      type="number"
                      value={stat.firstKills}
                      onChange={(e) => updatePlayerStat(index, 'firstKills', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('plants')}</label>
                    <input
                      type="number"
                      value={stat.plants}
                      onChange={(e) => updatePlayerStat(index, 'plants', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('defuses')}</label>
                    <input
                      type="number"
                      value={stat.defuses}
                      onChange={(e) => updatePlayerStat(index, 'defuses', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {playerStats.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-2">{t('noPlayerStatsYet')}</p>
              <p className="text-sm">{t('clickAddPlayerToRecord')}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep('match-details')}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition"
            >
              {t('backToMatchDetails')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex-1 py-3 bg-gradient-to-br from-primary via-purple-600 to-primary-dark text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? t('saving') : t('saveMatch')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}