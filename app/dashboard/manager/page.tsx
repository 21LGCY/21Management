import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import ManagerDashboardClient from '@/components/ManagerDashboardClient'
import { TimezoneOffset, DEFAULT_TIMEZONE } from '@/lib/utils/timezone'

export default async function ManagerDashboard() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Run all queries in parallel for faster page load
  const [
    { data: userProfile },
    { count: playerCount },
    { data: scheduleActivities },
    { data: tournaments },
    { data: players }
  ] = await Promise.all([
    // Get user's timezone
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.user_id)
      .single(),
    // Get statistics for manager's team only
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'player')
      .eq('team_id', teamId),
    // Get schedule activities for manager's team
    supabase
      .from('schedule_activities')
      .select('*')
      .eq('team_id', teamId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .limit(5),
    // Get tournaments where manager's team is participating
    supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(5),
    // Get players from manager's team only
    supabase
      .from('profiles')
      .select('*, teams(name)')
      .eq('role', 'player')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const userTimezone = (userProfile?.timezone as TimezoneOffset) || DEFAULT_TIMEZONE

  return (
    <ManagerDashboardClient
      user={user}
      team={team}
      playerCount={playerCount || 0}
      scheduleActivities={scheduleActivities || []}
      tournaments={tournaments || []}
      players={players || []}
      userTimezone={userTimezone}
    />
  )
}
