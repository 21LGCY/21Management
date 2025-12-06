import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { notFound } from 'next/navigation'
import PraccsReviewClient from './PraccsReviewClient'

export default async function PraccsReviewPage({ 
  params 
}: { 
  params: Promise<{ id: string; matchId: string }>
}) {
  const { id, matchId } = await params
  const user = await requireRole(['admin', 'manager', 'player'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PraccsReviewClient 
          teamId={id}
          matchId={matchId}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
