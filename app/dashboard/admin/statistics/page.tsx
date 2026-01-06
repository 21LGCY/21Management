import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import StatisticsClient from './StatisticsClient'
import { BarChart3 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function StatisticsPage() {
  const user = await requireRole(['admin'])
  const supabase = await createClient()
  const t = await getTranslations('stats')

  // Fetch all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl border border-primary/30">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t('title')}
              </h1>
              <p className="text-gray-400">{t('viewPerformance')}</p>
            </div>
          </div>
        </div>

        <StatisticsClient teams={teams || []} />
      </main>
    </div>
  )
}
