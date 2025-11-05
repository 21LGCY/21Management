import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MatchStatsClient from './MatchStatsClient'

interface PageProps {
  params: {
    id: string
  }
}

export default async function MatchStatsPage({ params }: PageProps) {
  const { user, teamId } = await requireManagerTeamAccess()
  const supabase = await createClient()

  // Fetch match details
  const { data: match, error: matchError } = await supabase
    .from('match_history')
    .select('*')
    .eq('id', params.id)
    .eq('team_id', teamId)
    .single()

  if (matchError || !match) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      <MatchStatsClient 
        matchId={params.id}
        teamId={teamId!}
        initialMatch={match}
      />
    </div>
  )
}