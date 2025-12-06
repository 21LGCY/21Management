import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import NavbarWrapper from '@/components/NavbarWrapper'
import EditMatchClient from './EditMatchClient'

interface EditMatchPageProps {
  params: Promise<{
    id: string
    matchId: string
  }>
}

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { id, matchId } = await params
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditMatchClient matchId={matchId} teamId={id} />
      </main>
    </div>
  )
}
