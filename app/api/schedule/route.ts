import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { ScheduleActivity, ActivityType } from '@/lib/types/database'
import { isValidUUID, isValidDayOfWeek, isValidTimeString, isValidNumber, isValidActivityType, isValidDateString, sanitizeString, checkRateLimit } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`schedule-get:${clientIP}`, 100, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
    )
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('team_id')

  // Validate team_id format if provided
  if (teamId && !isValidUUID(teamId)) {
    return NextResponse.json({ error: 'Invalid team_id format' }, { status: 400 })
  }

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
      console.error('Error fetching schedule activities:', error.message)
      return NextResponse.json({ error: 'Failed to fetch schedule activities' }, { status: 500 })
    }

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = checkRateLimit(`schedule-post:${clientIP}`, 30, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
    )
  }

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

    // Validate UUID format
    if (!isValidUUID(team_id)) {
      return NextResponse.json({ error: 'Invalid team_id format' }, { status: 400 })
    }

    // Validate day of week (0-6)
    if (!isValidDayOfWeek(day_of_week)) {
      return NextResponse.json({ error: 'Invalid day_of_week. Must be 0-6' }, { status: 400 })
    }

    // Validate time slot format
    if (!isValidTimeString(time_slot)) {
      return NextResponse.json({ error: 'Invalid time_slot format. Use HH:MM' }, { status: 400 })
    }

    // Validate duration (positive number, max 480 minutes = 8 hours)
    if (!isValidNumber(duration, 1, 480)) {
      return NextResponse.json({ error: 'Invalid duration. Must be 1-480 minutes' }, { status: 400 })
    }

    // Validate activity date if provided
    if (activity_date && !isValidDateString(activity_date)) {
      return NextResponse.json({ error: 'Invalid activity_date format' }, { status: 400 })
    }

    // Check if user has access to this team
    if (userProfile.role !== 'admin' && userProfile.team_id !== team_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate activity type
    if (!isValidActivityType(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    // Sanitize string inputs
    const sanitizedTitle = sanitizeString(title, 200)
    const sanitizedDescription = description ? sanitizeString(description, 2000) : null

    // Create the activity
    const { data: activity, error } = await supabase
      .from('schedule_activities')
      .insert({
        team_id,
        type,
        title: sanitizedTitle,
        description: sanitizedDescription,
        day_of_week,
        time_slot,
        duration,
        activity_date: activity_date || null,
        created_by: user.user_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule activity:', error.message)
      return NextResponse.json({ error: 'Failed to create schedule activity' }, { status: 500 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}