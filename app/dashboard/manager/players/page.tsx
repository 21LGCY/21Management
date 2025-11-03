import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import { Users, Search, Plus, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerPlayersPage() {
  // Require manager role
  const user = await requireRole(['manager'])
  
  const supabase = await createClient()

  // Get all players with their team information
  const { data: players } = await supabase
    .from('profiles')
    .select('*, teams(name)')
    .eq('role', 'player')
    .order('created_at', { ascending: false })

  // Get teams for filtering
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Player Management
          </h1>
          <p className="text-gray-400">Manage and oversee all players in your organization</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
              />
            </div>
            <select className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none">
              <option value="">All Teams</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <Link href="/dashboard/manager/players/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                <Plus className="w-4 h-4" />
                Add Player
              </button>
            </Link>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players && players.length > 0 ? (
            players.map((player) => (
              <div
                key={player.id}
                className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{player.username}</h3>
                      {player.teams && (
                        <span className="text-sm text-primary">{player.teams.name}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/manager/players/${player.id}`}>
                    <button className="text-primary hover:text-primary-light text-sm">
                      View
                    </button>
                  </Link>
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                  {player.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{player.email}</span>
                    </div>
                  )}
                  {player.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{player.phone}</span>
                    </div>
                  )}
                  {player.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{player.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Joined</span>
                    <span>{new Date(player.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No players found</p>
              <p className="text-gray-500 mb-4">Start by adding your first player to the system</p>
              <Link href="/dashboard/manager/players/new">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                  Add First Player
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}