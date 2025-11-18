import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { ScheduleActivity, ActivityType } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('team_id')

  try {
    // Get current user using your custom auth system
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has access to this team
    if (!teamId || (userProfile.role !== 'admin' && userProfile.team_id !== teamId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get schedule activities for the team
    const { data: activities, error } = await supabase
      .from('schedule_activities')
      .select(`
        *,
        created_by_profile:profiles!schedule_activities_created_by_fkey(username)
      `)
      .eq('team_id', teamId)
      .order('day_of_week', { ascending: true })
      .order('time_slot', { ascending: true })

    if (error) {
      console.error('Error fetching schedule activities:', error)
      return NextResponse.json({ error: 'Failed to fetch schedule activities' }, { status: 500 })
    }

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Get current user using your custom auth system
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { team_id, type, title, description, day_of_week, time_slot, duration, activity_date } = body

    // Validate required fields
    if (!team_id || !type || !title || day_of_week === undefined || !time_slot || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user has access to this team
    if (userProfile.role !== 'admin' && userProfile.team_id !== team_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate activity type
    const validTypes: ActivityType[] = [
      'practice', 'individual_training', 'group_training', 
      'official_match', 'tournament', 'meeting'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    // Create the activity
    const { data: activity, error } = await supabase
      .from('schedule_activities')
      .insert({
        team_id,
        type,
        title,
        description,
        day_of_week,
        time_slot,
        duration,
        activity_date: activity_date || null,
        created_by: user.user_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule activity:', error)
      return NextResponse.json({ error: 'Failed to create schedule activity' }, { status: 500 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}