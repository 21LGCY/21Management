import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUser } from '@/lib/auth/server'

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

    // Check if user has a linked FACEIT account
    const { data: profile } = await supabase
      .from('profiles')
      .select('faceit_player_id')
      .eq('id', user.user_id)
      .single()

    if (!profile?.faceit_player_id) {
      return NextResponse.json(
        { success: false, message: 'No FACEIT account linked' },
        { status: 400 }
      )
    }

    // Remove FACEIT data from the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        faceit_player_id: null,
        faceit_nickname: null,
        faceit_elo: null,
        faceit_level: null,
        faceit_avatar: null,
        faceit_country: null,
        faceit_region: null,
        faceit_stats: null,
        faceit_linked_at: null,
        faceit_last_sync: null,
        faceit_url: null,
      })
      .eq('id', user.user_id)

    if (updateError) {
      console.error('Error unlinking FACEIT account:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to unlink FACEIT account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'FACEIT account unlinked successfully',
    })
  } catch (error) {
    console.error('Error unlinking FACEIT account:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
