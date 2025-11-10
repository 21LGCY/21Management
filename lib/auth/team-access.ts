import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { TeamCategory } from '@/lib/types/database'

export interface ManagerTeamAccess {
  user: any
  teamId: string | null
  team: any | null
  teamCategory: TeamCategory | null
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

  // Map team name to team category
  const team = Array.isArray(userProfile.teams) ? userProfile.teams[0] : userProfile.teams
  const teamName = team?.name?.toLowerCase() || ''
  let teamCategory: TeamCategory | null = null
  
  if (teamName.includes('legacy gc') || teamName.includes('21gc')) {
    teamCategory = '21GC'
  } else if (teamName.includes('academy') || teamName.includes('21aca')) {
    teamCategory = '21ACA'
  } else if (teamName.includes('21 legacy') || teamName.includes('21l') || 
             (teamName.includes('legacy') && !teamName.includes('gc') && !teamName.includes('academy'))) {
    teamCategory = '21L'
  }

  return {
    user,
    teamId: userProfile.team_id,
    team: team,
    teamCategory
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