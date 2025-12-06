import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import TeamForm from '@/components/TeamForm'
import { getTranslations } from 'next-intl/server'

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole(['admin'])
  const t = await getTranslations('teams')

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('editTeam')}
          </h1>
          <p className="text-gray-400">{t('updateTeamDescription')}</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <TeamForm teamId={id} />
        </div>
      </main>
    </div>
  )
}
