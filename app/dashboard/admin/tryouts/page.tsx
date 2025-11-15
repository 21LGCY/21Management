import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import TryoutsPageClient from './TryoutsPageClient'

export default async function TryoutsManagementPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Tryouts & Scouting
          </h1>
          <p className="text-gray-400">Comprehensive recruitment and tryout management system</p>
        </div>
        
        <TryoutsPageClient />
      </main>
    </div>
  )
}

