import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import MatchDetailClient from './MatchDetailClient'

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole(['admin'])
  const supabase = await createClient()

  // Fetch match with player stats
  const { data: match, error } = await supabase
    .from('match_history')
    .select(`
      *,
      team:teams(name, tag),
      player_stats:player_match_stats(
        *,
        player:profiles(id, username, in_game_name, avatar_url, position)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !match) notFound()

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MatchDetailClient match={match} />
      </main>
    </div>
  )
}
