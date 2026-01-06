import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import { Users, UserPlus, Settings, Trophy, Calendar, Target } from 'lucide-react'
import RosterManagementClient from './RosterManagementClient'

export default async function TeamRosterPage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get full team details
  const { data: teamDetails } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  // Get all players in the team with detailed information
  const { data: players } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true })

  // Get all staff members in the team
  const { data: staffMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'manager')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true })

  // Get team statistics
  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)

  const { count: substitutes } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)
    .eq('is_substitute', true)

  const { count: staffCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'manager')
    .eq('team_id', teamId)

  const mainPlayers = (totalPlayers || 0) - (substitutes || 0)

  // Get upcoming matches
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('*, opponent_team:teams!matches_opponent_team_id_fkey(name)')
    .eq('team_id', teamId)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3)

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/manager/teams">
              Back to Team Overview
            </BackButton>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Team Roster Management
              </h1>
              <p className="text-gray-400">Manage your squad</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                <Settings className="w-4 h-4" />
                Team Settings
              </button>
            </div>
          </div>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalPlayers || 0}</p>
                <p className="text-sm text-gray-400">Total Players</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mainPlayers}</p>
                <p className="text-sm text-gray-400">Main Players</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{substitutes || 0}</p>
                <p className="text-sm text-gray-400">Substitutes</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{upcomingMatches?.length || 0}</p>
                <p className="text-sm text-gray-400">Upcoming Matches</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{staffCount || 0}</p>
                <p className="text-sm text-gray-400">Staff Members</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Players Management */}
          <div className="lg:col-span-2 space-y-6">
            <RosterManagementClient 
              players={players || []} 
              team={teamDetails} 
              user={user}
            />
            
            {/* Staff Section */}
            <div className="bg-dark-card border border-gray-800 rounded-lg">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Staff Members
                  </h2>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                    {staffMembers?.length || 0} members
                  </span>
                </div>
              </div>

              <div className="p-6">
                {staffMembers && staffMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffMembers.map((staff: any) => (
                      <div
                        key={staff.id}
                        className="p-4 bg-gradient-to-br from-dark to-dark-card rounded-lg border border-gray-800 hover:border-purple-500/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {staff.avatar_url ? (
                              <img src={staff.avatar_url} alt={staff.username} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-purple-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                              {staff.full_name || staff.username}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">@{staff.username}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {staff.staff_role && (
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg font-medium border border-purple-500/30">
                                  {staff.staff_role}
                                </span>
                              )}
                              {staff.game && (
                                <span className={`px-2 py-1 text-xs rounded-lg font-medium border ${
                                  staff.game === 'cs2' 
                                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                                }`}>
                                  {staff.game === 'cs2' ? 'CS2' : 'VALORANT'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-400">No staff members assigned yet</p>
                    <p className="text-sm text-gray-500 mt-1">Staff can be added from the admin panel</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Matches */}
            {upcomingMatches && upcomingMatches.length > 0 && (
              <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Upcoming Matches
                </h3>
                
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="p-3 bg-dark rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-white font-medium text-sm">
                          vs {match.opponent_team?.name || 'TBD'}
                        </p>
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                          {match.match_type || 'Match'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {new Date(match.scheduled_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Link href="/dashboard/manager/teams/schedule" className="block mt-4">
                  <button className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition text-sm">
                    View All Matches
                  </button>
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link href="/dashboard/manager/players">
                  <button className="w-full p-3 bg-dark hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-white text-sm">Manage Players</span>
                    </div>
                  </button>
                </Link>
                
                <Link href="/dashboard/manager/teams/tryouts">
                  <button className="w-full p-3 bg-dark hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-white text-sm">Scout Players</span>
                    </div>
                  </button>
                </Link>
                
                <Link href="/dashboard/manager/teams/schedule">
                  <button className="w-full p-3 bg-dark hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-white text-sm">Schedule Match</span>
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}