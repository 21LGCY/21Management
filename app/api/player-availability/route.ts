import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch player availability for a week
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const playerId = searchParams.get('player_id')
  const teamId = searchParams.get('team_id')
  const weekStart = searchParams.get('week_start')

  try {
    let query = supabase
      .from('player_weekly_availability')
      .select(`
        *,
        player:profiles(id, username, in_game_name, avatar_url)
      `)
      .order('week_start', { ascending: false })

    if (playerId) {
      query = query.eq('player_id', playerId)
    }
    
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    if (weekStart) {
      query = query.eq('week_start', weekStart)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching player availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json({ availabilities: data || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update player availability
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { player_id, team_id, week_start, week_end, time_slots, notes } = body

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
          notes,
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
          notes,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ availability: result })
  } catch (error) {
    console.error('Error saving availability:', error)
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
  }
}

// DELETE - Remove player availability
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing availability ID' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('player_weekly_availability')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 })
  }
}
