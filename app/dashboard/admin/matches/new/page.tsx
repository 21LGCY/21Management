import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import RecordMatchClient from './RecordMatchClient'
import { getTranslations } from 'next-intl/server'

export default async function RecordMatchPage() {
  const t = await getTranslations('matches')
  const user = await requireRole(['admin'])
  const supabase = await createClient()

  // Fetch all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('recordMatch')}
          </h1>
          <p className="text-gray-400">{t('recordMatchDescription')}</p>
        </div>

        <RecordMatchClient teams={teams || []} userId={user.user_id} />
      </main>
    </div>
  )
}
