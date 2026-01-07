import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUser } from '@/lib/auth/server'
import { faceitClient } from '@/lib/faceit/client'

export async function POST(request: NextRequest) {
  try {
    // Get verified user from custom auth
    const user = await getVerifiedUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get user's profile with FACEIT data
    const { data: profile } = await supabase
      .from('profiles')
      .select('faceit_player_id, faceit_last_sync')
      .eq('id', user.user_id)
      .single()

    if (!profile?.faceit_player_id) {
      return NextResponse.json(
        { success: false, message: 'No FACEIT account linked' },
        { status: 400 }
      )
    }

    // Rate limiting: Check if sync was done recently (within 5 minutes)
    if (profile.faceit_last_sync) {
      const lastSync = new Date(profile.faceit_last_sync)
      const now = new Date()
      const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60)
      
      if (diffMinutes < 5) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Please wait ${Math.ceil(5 - diffMinutes)} minutes before syncing again` 
          },
          { status: 429 }
        )
      }
    }

    // Fetch fresh data from FACEIT
    let faceitData
    try {
      faceitData = await faceitClient.syncPlayerData(profile.faceit_player_id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch FACEIT data'
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 }
      )
    }

    // Update the profile with fresh data
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        faceit_nickname: faceitData.nickname,
        faceit_elo: faceitData.elo,
        faceit_level: faceitData.level,
        faceit_avatar: faceitData.avatar,
        faceit_country: faceitData.country,
        faceit_region: faceitData.region,
        faceit_stats: faceitData,
        faceit_last_sync: now,
        faceit_url: faceitData.faceitUrl,
      })
      .eq('id', user.user_id)

    if (updateError) {
      console.error('Error updating FACEIT data:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update FACEIT data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'FACEIT data synced successfully',
      stats: faceitData,
      lastSync: now,
    })
  } catch (error) {
    console.error('Error syncing FACEIT data:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
