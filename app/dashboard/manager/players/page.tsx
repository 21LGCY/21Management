import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import PlayersPageClient from './PlayersPageClient'

export default async function ManagerPlayersPage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get players from manager's team only
  const { data: players } = await supabase
    .from('profiles')
    .select('*, teams(name)')
    .eq('role', 'player')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  return <PlayersPageClient players={players || []} user={user} team={team} />
}
