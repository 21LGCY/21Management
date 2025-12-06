import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MatchDetailsClient from './MatchDetailsClient'

interface MatchDetailsPageProps {
  params: Promise<{
    id: string
    matchId: string
  }>
}

export default async function MatchDetailsPage({ params }: MatchDetailsPageProps) {
  const { id, matchId } = await params
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MatchDetailsClient 
          matchId={matchId} 
          teamId={id}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
