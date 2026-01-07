import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { getTranslations } from 'next-intl/server'
import FaceitPageClient from './FaceitPageClient'

export default async function PlayerFaceitPage() {
  const user = await requireRole(['player'])
  const t = await getTranslations('faceit')
  const supabase = await createClient()

  // Get player data with FACEIT info
  const { data: playerData } = await supabase
    .from('profiles')
    .select(`
      *,
      teams(name, game)
    `)
    .eq('id', user.user_id)
    .single()

  const gameType = playerData?.teams?.game || playerData?.game || 'valorant'

  return (
    <FaceitPageClient
      user={user}
      playerData={playerData}
      gameType={gameType}
    />
  )
}
