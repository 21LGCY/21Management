import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BackButton from '@/components/BackButton'
import { Users, Calendar, Settings, Trophy, Shield, Edit } from 'lucide-react'
import Link from 'next/link'
import TeamManagementClient from './TeamManagementClient'

interface TeamManagementPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TeamManagementPage({ params }: TeamManagementPageProps) {
  const { id } = await params
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  // Ensure the manager can only access their own team
  if (id !== teamId) {
    notFound()
  }

  const supabase = await createClient()

  // Get detailed team information
  const { data: teamDetails, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (teamError || !teamDetails) {
    notFound()
  }

  // Get all players for this team
  const { data: players } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  // Get team statistics
  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)

  const { count: mainRoster } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)
    .eq('is_substitute', false)

  const { count: substitutes } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)
    .eq('is_substitute', true)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton fallbackHref="/dashboard/manager/teams" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                {teamDetails.name}
                {teamDetails.tag && (
                  <span className="text-primary ml-2">[{teamDetails.tag}]</span>
                )}
              </h1>
              <p className="text-gray-400">Team Management Dashboard</p>
            </div>
          </div>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-2xl font-bold text-white">{totalPlayers || 0}</p>
            <p className="text-gray-400 text-sm">Total Players</p>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{mainRoster || 0}</p>
            <p className="text-gray-400 text-sm">Main Players</p>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white">{substitutes || 0}</p>
            <p className="text-gray-400 text-sm">Substitutes</p>
          </div>
        </div>

        {/* Team Management Content */}
        <TeamManagementClient 
          team={teamDetails}
          players={players || []}
          user={user}
        />
      </main>
    </div>
  )
}