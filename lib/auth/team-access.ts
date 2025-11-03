import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

export interface ManagerTeamAccess {
  user: any
  teamId: string | null
  team: any | null
}

/**
 * Get the manager's team access information
 * Ensures the manager can only access data from their assigned team
 */
export async function getManagerTeamAccess(): Promise<ManagerTeamAccess> {
  // Require manager role
  const user = await requireRole(['manager'])
  
  const supabase = await createClient()
  
  // Get the manager's team information
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('team_id, teams(*)')
    .eq('id', user.user_id)
    .single()

  if (!userProfile?.team_id) {
    throw new Error('Manager is not assigned to a team')
  }

  return {
    user,
    teamId: userProfile.team_id,
    team: userProfile.teams
  }
}

/**
 * Require manager to have team access and return team information
 */
export async function requireManagerTeamAccess(): Promise<ManagerTeamAccess> {
  const access = await getManagerTeamAccess()
  
  if (!access.teamId) {
    throw new Error('Manager must be assigned to a team to access this resource')
  }
  
  return access
}