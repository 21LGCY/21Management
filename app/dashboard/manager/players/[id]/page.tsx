import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import { Edit, Mail, Phone, ExternalLink, Crown, User } from 'lucide-react'

// Utility function to get rank image
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
  params: { id: string }
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get player details - ensure they belong to the manager's team
  const { data: player, error } = await supabase
    .from('profiles')
    .select('*, teams(name)')
    .eq('id', params.id)
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
              Back to Players
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
                Edit Player
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Overview */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Profile Overview</h2>
              
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
                      <p className="text-gray-400 text-sm">Username</p>
                      <p className="text-white font-medium">{player.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">In-Game Name</p>
                      <p className="text-white font-medium">{player.in_game_name || 'Not set'}</p>
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
                    In-Game Leader
                  </span>
                )}
                {player.is_substitute && (
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-lg font-medium">
                    Substitute Player
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
              <h2 className="text-xl font-semibold text-white mb-4">Gaming Information</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Current Rank</p>
                  <div className="flex items-center gap-2">
                    {getRankImage(player.rank) && (
                      <img 
                        src={getRankImage(player.rank)!} 
                        alt={player.rank}
                        className="w-8 h-8"
                      />
                    )}
                    <p className="text-white font-medium text-lg">{player.rank || 'Unranked'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Peak Rank</p>
                  <div className="flex items-center gap-2">
                    {getRankImage(player.peak_rank) && (
                      <img 
                        src={getRankImage(player.peak_rank)!} 
                        alt={player.peak_rank}
                        className="w-8 h-8"
                      />
                    )}
                    <p className="text-white font-medium text-lg">{player.peak_rank || 'Not recorded'}</p>
                  </div>
                </div>
              </div>

              {/* Agent Pool */}
              {player.champion_pool && player.champion_pool.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-3">Agent Pool</p>
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
              <h2 className="text-xl font-semibold text-white mb-4">Performance Overview</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark rounded-lg border border-gray-700">
                  <p className="text-2xl font-bold text-primary">{player.wins || 0}</p>
                  <p className="text-gray-400 text-sm">Wins</p>
                </div>
                <div className="text-center p-4 bg-dark rounded-lg border border-gray-700">
                  <p className="text-2xl font-bold text-red-400">{player.losses || 0}</p>
                  <p className="text-gray-400 text-sm">Losses</p>
                </div>
                <div className="text-center p-4 bg-dark rounded-lg border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">
                    {player.wins && player.losses ? 
                      Math.round((player.wins / (player.wins + player.losses)) * 100) : 0}%
                  </p>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
              
              <div className="space-y-3">
                {player.email && (
                  <div className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-400 text-xs">Email</p>
                      <p className="text-white text-sm">{player.email}</p>
                    </div>
                  </div>
                )}
                
                {player.phone && (
                  <div className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-gray-400 text-xs">Phone</p>
                      <p className="text-white text-sm">{player.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* External Links */}
            {(player.valorant_tracker_url || player.twitter_url) && (
              <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">External Links</h3>
                
                <div className="space-y-3">
                  {player.valorant_tracker_url && (
                    <a 
                      href={player.valorant_tracker_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-gray-700 hover:border-primary/50 transition"
                    >
                      <ExternalLink className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-white text-sm font-medium">Valorant Tracker</p>
                        <p className="text-gray-400 text-xs">View detailed stats</p>
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
                        <p className="text-gray-400 text-xs">Follow on social media</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Team Information */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-xs">Team</p>
                  <p className="text-white font-medium">{team?.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Joined</p>
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