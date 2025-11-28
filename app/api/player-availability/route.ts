import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { NextRequest, NextResponse } from 'next/server'
import { isValidUUID, isValidDateString, sanitizeString, checkRateLimit } from '@/lib/utils/validation'

// GET - Fetch player availability for a week
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`availability-get:${clientIP}`, 100, 60000)
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
  const playerId = searchParams.get('player_id')
  const teamId = searchParams.get('team_id')
  const weekStart = searchParams.get('week_start')

  // Validate parameters if provided
  if (playerId && !isValidUUID(playerId)) {
    return NextResponse.json({ error: 'Invalid player_id format' }, { status: 400 })
  }
  if (teamId && !isValidUUID(teamId)) {
    return NextResponse.json({ error: 'Invalid team_id format' }, { status: 400 })
  }
  if (weekStart && !isValidDateString(weekStart)) {
    return NextResponse.json({ error: 'Invalid week_start format' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('player_weekly_availability')
      .select(`
        *,
        player:profiles(id, username, in_game_name, avatar_url)
      `)
      .order('week_start', { ascending: false })
      .limit(100) // Prevent excessive data retrieval

    if (playerId) {
      query = query.eq('player_id', playerId)
    }
    
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    if (weekStart) {
      query = query.eq('week_start', weekStart)
    }

    // Authorization: Players can only see their own or team availability
    if (user.role === 'player') {
      if (playerId && playerId !== user.user_id) {
        // Check if they're on the same team
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.user_id)
          .single()
        
        if (!teamId || userProfile?.team_id !== teamId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching player availability:', error.message)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json({ availabilities: data || [] })
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update player availability
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`availability-post:${clientIP}`, 30, 60000)
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
    const { player_id, team_id, week_start, week_end, time_slots, notes } = body

    // Validate required fields
    if (!player_id || !team_id || !week_start || !week_end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate UUID formats
    if (!isValidUUID(player_id)) {
      return NextResponse.json({ error: 'Invalid player_id format' }, { status: 400 })
    }
    if (!isValidUUID(team_id)) {
      return NextResponse.json({ error: 'Invalid team_id format' }, { status: 400 })
    }

    // Validate date formats
    if (!isValidDateString(week_start) || !isValidDateString(week_end)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Validate time_slots is an object
    if (time_slots && typeof time_slots !== 'object') {
      return NextResponse.json({ error: 'Invalid time_slots format' }, { status: 400 })
    }

    // Authorization: Players can only update their own availability
    if (user.role === 'player' && player_id !== user.user_id) {
      return NextResponse.json({ error: 'You can only update your own availability' }, { status: 403 })
    }

    // Managers and admins can update any player's availability
    if (user.role === 'manager') {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.user_id)
        .single()
      
      if (userProfile?.team_id !== team_id) {
        return NextResponse.json({ error: 'Access denied to this team' }, { status: 403 })
      }
    }

    // Sanitize notes if provided
    const sanitizedNotes = notes ? sanitizeString(notes, 500) : null

    // Check if availability already exists
    const { data: existing } = await supabase
      .from('player_weekly_availability')
      .select('id')
      .eq('player_id', player_id)
      .eq('team_id', team_id)
      .eq('week_start', week_start)
      .single()

    let result

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('player_weekly_availability')
        .update({
          time_slots,
          notes: sanitizedNotes,
          submitted_at: new Date().toISOString(),
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
        .from('player_weekly_availability')
        .insert({
          player_id,
          team_id,
          week_start,
          week_end,
          time_slots,
          notes: sanitizedNotes,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ availability: result })
  } catch (error) {
    console.error('Error saving availability:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
  }
}

// DELETE - Remove player availability
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
    return NextResponse.json({ error: 'Missing availability ID' }, { status: 400 })
  }

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid availability ID format' }, { status: 400 })
  }

  try {
    // First check ownership
    const { data: availability } = await supabase
      .from('player_weekly_availability')
      .select('player_id, team_id')
      .eq('id', id)
      .single()

    if (!availability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 })
    }

    // Authorization check
    if (user.role === 'player' && availability.player_id !== user.user_id) {
      return NextResponse.json({ error: 'You can only delete your own availability' }, { status: 403 })
    }

    if (user.role === 'manager') {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.user_id)
        .single()
      
      if (userProfile?.team_id !== availability.team_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('player_weekly_availability')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting availability:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 })
  }
}
