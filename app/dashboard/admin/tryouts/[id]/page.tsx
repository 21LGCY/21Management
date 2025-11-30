import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import TryoutWeekDetail from './TryoutWeekDetail'
import { TimezoneOffset } from '@/lib/types/database'
import { ORG_TIMEZONE } from '@/lib/utils/timezone'

export default async function TryoutWeekDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin'])
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
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TryoutWeekDetail weekId={params.id} userTimezone={userTimezone} />
      </main>
    </div>
  )
}
