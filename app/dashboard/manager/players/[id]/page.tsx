import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import { Edit, Mail, Phone, ExternalLink, Crown, User } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { GameType, getFaceitLevelImage } from '@/lib/types/games'

// Utility function to get rank image for Valorant
const getRankImage = (rank: string | undefined | null): string | null => {
  if (!rank) return null
  
  const rankMap: { [key: string]: string } = {
    'Ascendant 1': '/images/asc_1_rank.webp',
    'Ascendant 2': '/images/asc_2_rank.webp',
    'Ascendant 3': '/images/asc_3_rank.webp',
    'Immortal 1': '/images/immo_1_rank.webp',
    'Immortal 2': '/images/immo_2_rank.webp',
    'Immortal 3': '/images/immo_3_rank.webp',
    'Radiant': '/images/rad_rank.webp'
  }
  
  return rankMap[rank] || null
}

interface PlayerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { id } = await params
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  const t = await getTranslations('players')
  const tCommon = await getTranslations('common')
  const tForms = await getTranslations('forms')
  
  const supabase = await createClient()
  
  // Determine game type from team
  const gameType: GameType = (team?.game as GameType) || 'valorant'

  // Get player details - ensure they belong to the manager's team
  const { data: player, error } = await supabase
    .from('profiles')
    .select('*, teams(name, game)')
    .eq('id', id)
    .eq('role', 'player')
    .eq('team_id', teamId)
    .single()

  if (error || !player) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Link 
              href="/dashboard/manager/players"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToPlayers')}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {player.in_game_name || player.username}
              </h1>
              <p className="text-gray-400">{player.username} • {team?.name}</p>
            </div>
            <Link href={`/dashboard/manager/players/${player.id}/edit`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                <Edit className="w-4 h-4" />
                {t('editPlayer')}
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Overview */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('profileOverview')}</h2>
              
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{tCommon('username')}</p>
                      <p className="text-white font-medium">{player.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('inGameName')}</p>
                      <p className="text-white font-medium">{player.in_game_name || t('notSet')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role and Status */}
              <div className="flex flex-wrap gap-3">
                {player.position && (
                  <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-lg font-medium">
                    {player.position}
                  </span>
                )}
                {player.is_igl && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg font-medium flex items-center gap-1">
                    <Crown className="w-4 h-4" />
                    {t('inGameLeader')}
                  </span>
                )}
                {player.is_substitute && (
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-lg font-medium">
                    {t('substitutePlayer')}
                  </span>
                )}
                {player.nationality && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg font-medium flex items-center gap-2">
                    <img 
                      src={`https://flagcdn.com/${player.nationality.toLowerCase()}.svg`} 
                      alt={player.nationality}
                      className="w-4 h-3"
                    />
                    {player.nationality}
                  </span>
                )}
              </div>
            </div>

            {/* Gaming Information */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{t('gamingInfo')}</h2>
                {/* Game badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  gameType === 'valorant' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {gameType === 'valorant' ? 'VALORANT' : 'CS2'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                {gameType === 'cs2' ? (
                  /* CS2: Faceit Level */
                  <>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{tForms('faceitLevel')}</p>
                      <div className="flex items-center gap-2">
                        {player.faceit_level && (
                          <img 
                            src={getFaceitLevelImage(player.faceit_level)} 
                            alt={`Level ${player.faceit_level}`}
                            className="w-8 h-8"
                          />
                        )}
                        <p className="text-white font-medium text-lg">
                          {player.faceit_level ? `Level ${player.faceit_level}` : t('unranked')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{t('currentRank')}</p>
                      <p className="text-white font-medium text-lg">{player.rank || t('unranked')}</p>
                    </div>
                  </>
                ) : (
                  /* Valorant: Rank */
                  <>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{t('currentRank')}</p>
                      <div className="flex items-center gap-2">
                        {getRankImage(player.rank) && (
                          <img 
                            src={getRankImage(player.rank)!} 
                            alt={player.rank}
                            className="w-8 h-8"
                          />
                        )}
                        <p className="text-white font-medium text-lg">{player.rank || t('unranked')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{t('peakRank')}</p>
                      <div className="flex items-center gap-2">
                        {getRankImage(player.peak_rank) && (
                          <img 
                            src={getRankImage(player.peak_rank)!} 
                            alt={player.peak_rank}
                            className="w-8 h-8"
                          />
                        )}
                        <p className="text-white font-medium text-lg">{player.peak_rank || t('notRecorded')}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Agent Pool - Only for Valorant */}
              {gameType === 'valorant' && player.champion_pool && player.champion_pool.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">{t('championPool')}</p>
                  <div className="flex flex-wrap gap-2">
                    {player.champion_pool.map((agent: string) => (
                      <span key={agent} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg">
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('performanceOverview')}</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark rounded-lg border border-gray-700">
                  <p className="text-2xl font-bold text-primary">{player.wins || 0}</p>
                  <p className="text-gray-400 text-sm">{t('wins')}</p>
                </div>
                <div className="text-center p-4 bg-dark rounded-lg border border-gray-700">
                  <p className="text-2xl font-bold text-red-400">{player.losses || 0}</p>
                  <p className="text-gray-400 text-sm">{t('losses')}</p>
                </div>
                <div className="text-center p-4 bg-dark rounded-lg border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">
                    {player.wins && player.losses ? 
                      Math.round((player.wins / (player.wins + player.losses)) * 100) : 0}%
                  </p>
                  <p className="text-gray-400 text-sm">{t('winRate')}</p>
                </div>
              </div>
            </div>

            {/* FACEIT Stats - Only for CS2 players with linked accounts */}
            {gameType === 'cs2' && player.faceit_player_id && player.faceit_stats && (
              <div className="bg-gradient-to-br from-orange-500/10 to-dark border border-orange-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/images/faceit.svg" 
                      alt="FACEIT" 
                      className="w-6 h-6"
                    />
                    <h2 className="text-xl font-semibold text-white">FACEIT Stats</h2>
                  </div>
                  {player.faceit_url && (
                    <a 
                      href={player.faceit_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 transition text-sm flex items-center gap-1"
                    >
                      {t('viewProfile')}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                {/* FACEIT Level and ELO */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-dark/50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-400">{player.faceit_stats.level || player.faceit_level || '-'}</p>
                    <p className="text-gray-400 text-sm">Level</p>
                  </div>
                  <div className="text-center p-4 bg-dark/50 rounded-lg">
                    <p className="text-3xl font-bold text-orange-400">{player.faceit_stats.elo || player.faceit_elo || '-'}</p>
                    <p className="text-gray-400 text-sm">ELO</p>
                  </div>
                </div>

                {/* Additional FACEIT Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-dark/50 rounded-lg">
                    <p className="text-xl font-bold text-white">{player.faceit_stats.matches || 0}</p>
                    <p className="text-gray-400 text-xs">Matches</p>
                  </div>
                  <div className="text-center p-3 bg-dark/50 rounded-lg">
                    <p className="text-xl font-bold text-green-400">{player.faceit_stats.winRate || 0}%</p>
                    <p className="text-gray-400 text-xs">{t('winRate')}</p>
                  </div>
                  <div className="text-center p-3 bg-dark/50 rounded-lg">
                    <p className="text-xl font-bold text-blue-400">{player.faceit_stats.kdRatio || 0}</p>
                    <p className="text-gray-400 text-xs">K/D</p>
                  </div>
                  <div className="text-center p-3 bg-dark/50 rounded-lg">
                    <p className="text-xl font-bold text-red-400">{player.faceit_stats.headshotPercentage || 0}%</p>
                    <p className="text-gray-400 text-xs">HS %</p>
                  </div>
                </div>

                {/* Last Sync Info */}
                {player.faceit_last_sync && (
                  <p className="text-gray-500 text-xs mt-4 text-center">
                    Last synced: {new Date(player.faceit_last_sync).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* FACEIT Not Linked - Only for CS2 players */}
            {gameType === 'cs2' && !player.faceit_player_id && (
              <div className="bg-dark-card border border-gray-800 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <img 
                    src="/images/faceit.svg" 
                    alt="FACEIT" 
                    className="w-6 h-6 opacity-50"
                  />
                </div>
                <h3 className="text-white font-medium mb-1">FACEIT Not Linked</h3>
                <p className="text-gray-400 text-sm">This player hasn't linked their FACEIT account yet.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('contactInfo')}</h3>
              
              <div className="space-y-3">
                {player.email && (
                  <div className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-400 text-xs">{tCommon('email')}</p>
                      <p className="text-white text-sm">{player.email}</p>
                    </div>
                  </div>
                )}
                
                {player.phone && (
                  <div className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-400 text-xs">{tCommon('phone')}</p>
                      <p className="text-white text-sm">{player.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* External Links */}
            {(player.valorant_tracker_url || player.tracker_url || player.steam_url || player.faceit_url || player.twitter_url) && (
              <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('externalLinks')}</h3>
                
                <div className="space-y-3">
                  {/* Valorant Tracker */}
                  {gameType === 'valorant' && (player.valorant_tracker_url || player.tracker_url) && (
                    <a 
                      href={player.tracker_url || player.valorant_tracker_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700 hover:border-red-500/50 transition"
                    >
                      <ExternalLink className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-white text-sm font-medium">{t('valorantTracker')}</p>
                        <p className="text-gray-400 text-xs">{t('viewDetailedStats')}</p>
                      </div>
                    </a>
                  )}
                  
                  {/* CS2: Steam Profile */}
                  {gameType === 'cs2' && player.steam_url && (
                    <a 
                      href={player.steam_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700 hover:border-blue-500/50 transition"
                    >
                      <ExternalLink className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Steam Profile</p>
                        <p className="text-gray-400 text-xs">{t('viewDetailedStats')}</p>
                      </div>
                    </a>
                  )}
                  
                  {/* CS2: Faceit Profile */}
                  {gameType === 'cs2' && player.faceit_url && (
                    <a 
                      href={player.faceit_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700 hover:border-orange-500/50 transition"
                    >
                      <ExternalLink className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Faceit Profile</p>
                        <p className="text-gray-400 text-xs">{t('viewDetailedStats')}</p>
                      </div>
                    </a>
                  )}
                  
                  {player.twitter_url && (
                    <a 
                      href={player.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700 hover:border-primary/50 transition"
                    >
                      <ExternalLink className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-white text-sm font-medium">Twitter</p>
                        <p className="text-gray-400 text-xs">{t('followOnSocial')}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Team Information */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('teamInfo')}</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-xs">{tCommon('team')}</p>
                  <p className="text-white font-medium">{team?.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">{t('joined')}</p>
                  <p className="text-white font-medium">
                    {new Date(player.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}