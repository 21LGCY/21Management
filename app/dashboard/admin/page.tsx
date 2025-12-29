import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import AdminDashboardClient from '@/components/AdminDashboardClient'
import { TimezoneOffset, DEFAULT_TIMEZONE } from '@/lib/utils/timezone'

export default async function AdminDashboard() {
  // Require admin role
  const user = await requireRole(['admin'])
  
  const supabase = await createClient()

  // Run all queries in parallel for faster page load
  const [
    { data: userProfile },
    { count: teamCount },
    { count: playerCount },
    { count: tournamentCount },
    { data: scheduleActivities },
    { data: players }
  ] = await Promise.all([
    // Get user's timezone
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.user_id)
      .single(),
    // Get team count
    supabase
      .from('teams')
      .select('*', { count: 'exact', head: true }),
    // Get player count
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'player'),
    // Get tournament count
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true }),
    // Get schedule activities across all teams
    supabase
      .from('schedule_activities')
      .select('*, teams(name)')
      .or(`activity_date.gte.${new Date().toISOString().split('T')[0]},activity_date.is.null`) // Include future dated or recurring activities
      .order('activity_date', { ascending: true, nullsFirst: false })
      .limit(5),
    // Get players across all teams
    supabase
      .from('profiles')
      .select('*, teams(name)')
      .eq('role', 'player')
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const userTimezone = (userProfile?.timezone as TimezoneOffset) || DEFAULT_TIMEZONE

  return (
    <AdminDashboardClient
      user={user}
      teamCount={teamCount || 0}
      playerCount={playerCount || 0}
      tournamentCount={tournamentCount || 0}
      scheduleActivities={scheduleActivities || []}
      players={players || []}
      userTimezone={userTimezone}
    />
  )
}