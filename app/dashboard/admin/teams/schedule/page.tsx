import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import BackButton from '@/components/BackButton'
import TeamScheduleSelector from './TeamScheduleSelector'
import { TimezoneOffset } from '@/lib/types/database'
import { getTranslations } from 'next-intl/server'

export default async function AdminTeamSchedulePage() {
  // Require admin role
  const user = await requireRole(['admin'])
  const t = await getTranslations('schedule')
  const tTeams = await getTranslations('teams')

  const supabase = await createClient()
  
  // Fetch all teams for the selector
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  // Get user's timezone from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.user_id)
    .single()
  
  const userTimezone = (profile?.timezone || 'UTC+1') as TimezoneOffset

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/admin/teams">
              {t('backToTeamManagement')}
            </BackButton>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t('title')}
              </h1>
              <p className="text-gray-400">{t('selectTeamToManage')}</p>
            </div>
          </div>
        </div>

        {/* Team Selector and Schedule Management Interface */}
        {teams && teams.length > 0 ? (
          <TeamScheduleSelector 
            teams={teams}
            user={user}
            userTimezone={userTimezone}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">{tTeams('noTeamsCreateFirst')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
