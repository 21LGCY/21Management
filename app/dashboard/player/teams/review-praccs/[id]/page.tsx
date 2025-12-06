import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { notFound } from 'next/navigation'
import PraccsReviewClient from './PraccsReviewClient'
import { createClient } from '@/lib/supabase/server'

export default async function PlayerPraccsReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole(['player'])
  const matchId = id
  
  // Get player's team_id from their profile
  const supabase = await createClient()
  const { data: playerData } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.user_id)
    .single()

  if (!playerData?.team_id) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PraccsReviewClient
          teamId={playerData.team_id}
          matchId={matchId}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
