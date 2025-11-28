import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { NextRequest, NextResponse } from 'next/server'
import { isValidUUID, isValidResponseStatus, sanitizeString, checkRateLimit } from '@/lib/utils/validation'

// GET - Fetch schedule activity responses
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`responses-get:${clientIP}`, 100, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
    )
  }

  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const activityId = searchParams.get('activity_id')
  const playerId = searchParams.get('player_id')

  // Validate parameters if provided
  if (activityId && !isValidUUID(activityId)) {
    return NextResponse.json({ error: 'Invalid activity_id format' }, { status: 400 })
  }
  if (playerId && !isValidUUID(playerId)) {
    return NextResponse.json({ error: 'Invalid player_id format' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('schedule_activity_responses')
      .select(`
        *,
        player:profiles(id, username, in_game_name, avatar_url),
        activity:schedule_activities(*)
      `)
      .limit(100) // Prevent excessive data retrieval

    if (activityId) {
      query = query.eq('activity_id', activityId)
    }
    
    if (playerId) {
      query = query.eq('player_id', playerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching responses:', error.message)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    return NextResponse.json({ responses: data || [] })
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update schedule activity response
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`responses-post:${clientIP}`, 30, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
    )
  }

  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { activity_id, player_id, status, notes } = body

    // Validate required fields
    if (!activity_id || !player_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate UUID formats
    if (!isValidUUID(activity_id)) {
      return NextResponse.json({ error: 'Invalid activity_id format' }, { status: 400 })
    }
    if (!isValidUUID(player_id)) {
      return NextResponse.json({ error: 'Invalid player_id format' }, { status: 400 })
    }

    // Validate status
    if (!isValidResponseStatus(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be: available, unavailable, or tentative' }, { status: 400 })
    }

    // Authorization: Players can only respond for themselves
    if (user.role === 'player' && player_id !== user.user_id) {
      return NextResponse.json({ error: 'You can only respond for yourself' }, { status: 403 })
    }

    // For managers, verify they have access to the activity's team
    if (user.role === 'manager') {
      const { data: activity } = await supabase
        .from('schedule_activities')
        .select('team_id')
        .eq('id', activity_id)
        .single()

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.user_id)
        .single()

      if (!activity || userProfile?.team_id !== activity.team_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Sanitize notes if provided
    const sanitizedNotes = notes ? sanitizeString(notes, 500) : null

    // Check if response already exists
    const { data: existing } = await supabase
      .from('schedule_activity_responses')
      .select('id')
      .eq('activity_id', activity_id)
      .eq('player_id', player_id)
      .single()

    let result

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('schedule_activity_responses')
        .update({
          status,
          notes: sanitizedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('schedule_activity_responses')
        .insert({
          activity_id,
          player_id,
          status,
          notes: sanitizedNotes,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ response: result })
  } catch (error) {
    console.error('Error saving response:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
  }
}

// DELETE - Remove schedule activity response
export async function DELETE(request: NextRequest) {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing response ID' }, { status: 400 })
  }

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid response ID format' }, { status: 400 })
  }

  try {
    // First check ownership
    const { data: response } = await supabase
      .from('schedule_activity_responses')
      .select('player_id, activity:schedule_activities(team_id)')
      .eq('id', id)
      .single()

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Authorization check
    if (user.role === 'player' && response.player_id !== user.user_id) {
      return NextResponse.json({ error: 'You can only delete your own responses' }, { status: 403 })
    }

    if (user.role === 'manager') {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.user_id)
        .single()
      
      // Handle the activity relation which returns an array from the join
      const activity = response.activity as { team_id: string }[] | null
      const teamId = activity?.[0]?.team_id
      if (userProfile?.team_id !== teamId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('schedule_activity_responses')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting response:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 })
  }
}
