import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUser } from '@/lib/auth/server'
import { faceitClient } from '@/lib/faceit/client'

// Extract nickname from FACEIT URL or return as-is if it's just a nickname
function extractNicknameFromUrl(input: string): string {
  const trimmed = input.trim()
  
  // Try to parse as URL
  // Formats: 
  // - https://www.faceit.com/fr/players/ZARQXX
  // - https://www.faceit.com/en/players/ZARQXX
  // - faceit.com/players/ZARQXX
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?faceit\.com\/(?:\w{2}\/)?players\/([^\/\?\#]+)/i
  const match = trimmed.match(urlPattern)
  
  if (match && match[1]) {
    return match[1]
  }
  
  // If not a URL, return the input as nickname
  return trimmed
}

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

    // Get request body
    const body = await request.json()
    const { nickname: rawInput } = body

    if (!rawInput || typeof rawInput !== 'string') {
      return NextResponse.json(
        { success: false, message: 'FACEIT profile URL or nickname is required' },
        { status: 400 }
      )
    }

    // Extract nickname from URL if needed
    const nickname = extractNicknameFromUrl(rawInput)

    if (!nickname) {
      return NextResponse.json(
        { success: false, message: 'Could not extract nickname from input' },
        { status: 400 }
      )
    }

    // Check if user already has a linked FACEIT account
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('faceit_player_id')
      .eq('id', user.user_id)
      .single()

    if (existingProfile?.faceit_player_id) {
      return NextResponse.json(
        { success: false, message: 'You already have a linked FACEIT account. Unlink it first.' },
        { status: 400 }
      )
    }

    // Search for the FACEIT player
    let faceitData
    try {
      faceitData = await faceitClient.getCompletePlayerData(nickname)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Player not found on FACEIT'
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 404 }
      )
    }

    // Check if this FACEIT account is already linked to another user
    const { data: existingLink } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('faceit_player_id', faceitData.playerId)
      .neq('id', user.user_id)
      .single()

    if (existingLink) {
      return NextResponse.json(
        { success: false, message: 'This FACEIT account is already linked to another user' },
        { status: 400 }
      )
    }

    // Update the user's profile with FACEIT data
    const now = new Date().toISOString()
    
    // Only include faceit_level if it's valid (1-10)
    const faceitLevel = faceitData.level >= 1 && faceitData.level <= 10 ? faceitData.level : null
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        faceit_player_id: faceitData.playerId,
        faceit_nickname: faceitData.nickname,
        faceit_elo: faceitData.elo || null,
        faceit_level: faceitLevel,
        faceit_avatar: faceitData.avatar || null,
        faceit_country: faceitData.country || null,
        faceit_region: faceitData.region || null,
        faceit_stats: faceitData,
        faceit_linked_at: now,
        faceit_last_sync: now,
      })
      .eq('id', user.user_id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to link FACEIT account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'FACEIT account linked successfully',
      stats: faceitData,
    })
  } catch (error) {
    console.error('Error linking FACEIT account:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
