import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PlayerForm from '@/components/PlayerForm'

interface EditPlayerPageProps {
  params: { id: string }
}

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get player details - ensure they belong to the manager's team
  const { data: player, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'player')
    .eq('team_id', teamId)
    .single()

  if (error || !player) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/dashboard/manager/players/${player.id}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary-light mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Player Details
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Edit Player
          </h1>
          <p className="text-gray-400">Update {player.in_game_name || player.username}'s information</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <PlayerForm 
            teamId={teamId || ''} 
            teamName={team?.name || 'your team'} 
            playerId={player.id}
          />
        </div>
      </main>
    </div>
  )
}