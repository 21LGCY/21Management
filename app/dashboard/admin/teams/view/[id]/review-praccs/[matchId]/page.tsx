import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import { notFound } from 'next/navigation'
import PraccsReviewClient from './PraccsReviewClient'

export default async function PraccsReviewPage({ 
  params 
}: { 
  params: { id: string; matchId: string } 
}) {
  const user = await requireRole(['admin', 'manager', 'player'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PraccsReviewClient 
          teamId={params.id}
          matchId={params.matchId}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
