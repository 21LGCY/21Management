import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUser } from '@/lib/auth/server'
import { faceitClient } from '@/lib/faceit/client'

interface RouteParams {
  params: Promise<{ playerId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { playerId } = await params
    
    // Get verified user from custom auth
    const user = await getVerifiedUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get user's profile to check permissions
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role, team_id')
      .eq('id', user.user_id)
      .single()

    // Get the target player's profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, team_id, faceit_player_id, faceit_stats, faceit_last_sync')
      .eq('id', playerId)
      .single()

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, message: 'Player not found' },
        { status: 404 }
      )
    }

    // Check permissions:
    // - User can view their own stats
    // - Managers can view stats of players in their team
    // - Admins can view all stats
    const isOwnProfile = user.user_id === playerId
    const isSameTeam = currentUserProfile?.team_id === targetProfile.team_id
    const isManager = currentUserProfile?.role === 'manager' && isSameTeam
    const isAdmin = currentUserProfile?.role === 'admin'

    if (!isOwnProfile && !isManager && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    if (!targetProfile.faceit_player_id) {
      return NextResponse.json(
        { success: false, message: 'No FACEIT account linked' },
        { status: 404 }
      )
    }

    // Check if we should use cached data (less than 30 minutes old)
    const useCached = targetProfile.faceit_last_sync && 
      (new Date().getTime() - new Date(targetProfile.faceit_last_sync).getTime()) < 30 * 60 * 1000

    if (useCached && targetProfile.faceit_stats) {
      return NextResponse.json({
        success: true,
        stats: targetProfile.faceit_stats,
        lastSync: targetProfile.faceit_last_sync,
        cached: true,
      })
    }

    // Fetch fresh data from FACEIT
    let faceitData
    try {
      faceitData = await faceitClient.syncPlayerData(targetProfile.faceit_player_id)
    } catch (error) {
      // If we have cached data, return it even if refresh fails
      if (targetProfile.faceit_stats) {
        return NextResponse.json({
          success: true,
          stats: targetProfile.faceit_stats,
          lastSync: targetProfile.faceit_last_sync,
          cached: true,
          warning: 'Using cached data - fresh data unavailable',
        })
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch FACEIT data'
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      )
    }

    // Update cache in background (don't await)
    const now = new Date().toISOString()
    void supabase
      .from('profiles')
      .update({
        faceit_stats: faceitData,
        faceit_last_sync: now,
        faceit_elo: faceitData.elo,
        faceit_level: faceitData.level,
      })
      .eq('id', playerId)
      .then(() => {})

    return NextResponse.json({
      success: true,
      stats: faceitData,
      lastSync: now,
      cached: false,
    })
  } catch (error) {
    console.error('Error fetching FACEIT stats:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
