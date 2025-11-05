import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import SchedulePreview from '@/components/SchedulePreview'
import { Shield, Users, Calendar, Clock, Plus, Search, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerTeamsPage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get player count for manager's team
  const { count: playerCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)

  // Get tryouts (if team-specific tryouts exist, otherwise general tryouts)
  const { data: tryouts } = await supabase
    .from('tryouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Team & Roster Management
          </h1>
          <p className="text-gray-400">Manage {team?.name || 'your team'}, schedules, and tryouts</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/dashboard/manager/teams/schedule">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Schedule</p>
                  <p className="text-sm text-gray-400">Manage team schedule</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/manager/teams/tryouts">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Manage Tryouts</p>
                  <p className="text-sm text-gray-400">Scout new talent</p>
                </div>
              </div>
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Weekly Schedule Preview */}
          {teamId && <SchedulePreview teamId={teamId} />}

          {/* Recent Tryouts */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Tryouts</h2>
              <Link href="/dashboard/manager/teams/tryouts">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                  Manage Tryouts
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {tryouts && tryouts.length > 0 ? (
                tryouts.map((tryout) => (
                  <div
                    key={tryout.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{tryout.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tryout.status === 'open' 
                          ? 'bg-green-500/20 text-green-400'
                          : tryout.status === 'in_progress'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {tryout.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{tryout.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No tryouts scheduled</p>
                  <Link href="/dashboard/manager/teams/tryouts">
                    <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                      Create Tryout
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Team Performance Overview */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
              <Link href="/dashboard/manager/stats">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                  View Details
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-white">Win Rate</span>
                </div>
                <span className="text-green-400 font-medium">75%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-white">Active Players</span>
                </div>
                <span className="text-blue-400 font-medium">{playerCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}