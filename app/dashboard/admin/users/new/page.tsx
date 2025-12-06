import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import UserForm from '@/components/UserForm'
import { getTranslations } from 'next-intl/server'

export default async function NewUserPage() {
  const user = await requireRole(['admin'])
  const t = await getTranslations('users')

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t('addUser')}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{t('createUserDescription')}</p>
            </div>
          </div>
        </div>
        
        <UserForm />
      </main>
    </div>
  )
}
