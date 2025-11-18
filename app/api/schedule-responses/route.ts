import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch schedule activity responses
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const activityId = searchParams.get('activity_id')
  const playerId = searchParams.get('player_id')

  try {
    let query = supabase
      .from('schedule_activity_responses')
      .select(`
        *,
        player:profiles(id, username, in_game_name, avatar_url),
        activity:schedule_activities(*)
      `)

    if (activityId) {
      query = query.eq('activity_id', activityId)
    }
    
    if (playerId) {
      query = query.eq('player_id', playerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    return NextResponse.json({ responses: data || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update schedule activity response
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { activity_id, player_id, status, notes } = body

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
          notes,
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
          notes,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ response: result })
  } catch (error) {
    console.error('Error saving response:', error)
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
  }
}

// DELETE - Remove schedule activity response
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing response ID' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('schedule_activity_responses')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting response:', error)
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 })
  }
}
