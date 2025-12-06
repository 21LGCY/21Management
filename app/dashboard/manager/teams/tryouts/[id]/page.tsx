import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import TryoutWeekDetailManager from './TryoutWeekDetailManager'
import { TimezoneOffset } from '@/lib/types/database'
import { ORG_TIMEZONE } from '@/lib/utils/timezone'

export default async function TryoutWeekDetailManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, team, teamCategory } = await requireManagerTeamAccess()
  const supabase = await createClient()

  // Fetch user's timezone from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.user_id)
    .single()

  const userTimezone: TimezoneOffset = (profile?.timezone as TimezoneOffset) || ORG_TIMEZONE

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TryoutWeekDetailManager weekId={id} team={team} teamCategory={teamCategory} userTimezone={userTimezone} />
      </main>
    </div>
  )
}
