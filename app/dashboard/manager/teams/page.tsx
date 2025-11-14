import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import ManagerTeamsClient from './ManagerTeamsClient'

export default async function ManagerTeamsPage() {
  // Require manager role and get team access
  const { user, teamId, team, teamCategory } = await requireManagerTeamAccess()
  
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
        <ManagerTeamsClient 
          teamId={teamId || ''} 
          teamName={team?.name || ''}
          teamCategory={teamCategory || '21GC'}
          playerCount={playerCount || 0}
          tryouts={tryouts || []}
        />
      </main>
    </div>
  )
}