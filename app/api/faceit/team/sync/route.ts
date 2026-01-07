import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUser } from '@/lib/auth/server'
import { faceitClient } from '@/lib/faceit/client'
import { CS2_GAME_ID } from '@/lib/faceit/constants'

/**
 * POST /api/faceit/team/sync
 * Synchronize FACEIT stats for all team members
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUser()
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { teamId } = await request.json()
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user has access to this team
    if (user.role === 'manager') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.user_id)
        .single()

      if (profile?.team_id !== teamId) {
        return NextResponse.json({ error: 'Access denied to this team' }, { status: 403 })
      }
    }

    // Get all team players with FACEIT accounts
    const { data: players, error: playersError } = await supabase
      .from('profiles')
      .select('id, username, faceit_player_id, faceit_nickname')
      .eq('team_id', teamId)
      .not('faceit_player_id', 'is', null)

    if (playersError) {
      console.error('Error fetching team players:', playersError)
      return NextResponse.json({ error: 'Failed to fetch team players' }, { status: 500 })
    }

    if (!players || players.length === 0) {
      return NextResponse.json({ 
        error: 'No players with linked FACEIT accounts found',
        synced: 0,
        failed: 0 
      }, { status: 200 })
    }

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Sync each player's FACEIT stats
    for (const player of players) {
      try {
        if (!player.faceit_player_id) continue

        // Get fresh stats from FACEIT
        const stats = await faceitClient.getPlayerStats(player.faceit_player_id, CS2_GAME_ID)
        const playerInfo = await faceitClient.getPlayerById(player.faceit_player_id)
        
        const formattedStats = faceitClient.formatPlayerStats(playerInfo, stats)

        // Update player's FACEIT data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            faceit_elo: formattedStats.elo,
            faceit_level: formattedStats.level,
            faceit_stats: formattedStats,
            faceit_last_sync: new Date().toISOString()
          })
          .eq('id', player.id)

        if (updateError) {
          throw updateError
        }

        results.synced++
      } catch (error: any) {
        console.error(`Error syncing player ${player.username}:`, error)
        results.failed++
        results.errors.push(`${player.username}: ${error.message}`)
      }
    }

    // Calculate team aggregate stats
    const { data: updatedPlayers } = await supabase
      .from('profiles')
      .select('faceit_elo, faceit_level, faceit_stats')
      .eq('team_id', teamId)
      .not('faceit_elo', 'is', null)

    let teamStats = null
    if (updatedPlayers && updatedPlayers.length > 0) {
      const avgElo = Math.round(
        updatedPlayers.reduce((sum, p) => sum + (p.faceit_elo || 0), 0) / updatedPlayers.length
      )
      const avgLevel = Math.round(
        updatedPlayers.reduce((sum, p) => sum + (p.faceit_level || 0), 0) / updatedPlayers.length
      )

      // Aggregate wins, matches, win rate
      let totalMatches = 0
      let totalWins = 0
      
      updatedPlayers.forEach(p => {
        if (p.faceit_stats) {
          totalMatches += p.faceit_stats.matches || 0
          totalWins += p.faceit_stats.wins || 0
        }
      })

      const avgWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0

      teamStats = {
        avgElo,
        avgLevel,
        playerCount: updatedPlayers.length,
        totalMatches,
        totalWins,
        avgWinRate: parseFloat(avgWinRate.toFixed(2))
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.synced,
      failed: results.failed,
      errors: results.errors,
      teamStats,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error in team sync:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync team' },
      { status: 500 }
    )
  }
}
