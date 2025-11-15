import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import NewTryoutWeekForm from './NewTryoutWeekForm'

export default async function NewTryoutWeekPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewTryoutWeekForm />
      </main>
    </div>
  )
}

