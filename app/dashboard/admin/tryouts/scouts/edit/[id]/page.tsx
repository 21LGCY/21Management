import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import EditScoutForm from './EditScoutForm'

export default async function EditScoutPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin', 'manager'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditScoutForm scoutId={params.id} />
      </main>
    </div>
  )
}
