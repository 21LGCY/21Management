import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { ActivityType } from '@/lib/types/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { type, title, description, day_of_week, time_slot, duration } = body

    // Validate required fields
    if (!type || !title || day_of_week === undefined || !time_slot || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate activity type
    const validTypes: ActivityType[] = [
      'practice', 'individual_training', 'group_training', 
      'official_match', 'tournament', 'meeting'
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    // Get the activity to check permissions
    const { data: existingActivity, error: fetchError } = await supabase
      .from('schedule_activities')
      .select('team_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has access to this team
    if (userProfile.role !== 'admin' && userProfile.team_id !== existingActivity.team_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the activity
    const { data: activity, error } = await supabase
      .from('schedule_activities')
      .update({
        type,
        title,
        description,
        day_of_week,
        time_slot,
        duration,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule activity:', error)
      return NextResponse.json({ error: 'Failed to update schedule activity' }, { status: 500 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the activity to check permissions
    const { data: existingActivity, error: fetchError } = await supabase
      .from('schedule_activities')
      .select('team_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has access to this team
    if (userProfile.role !== 'admin' && userProfile.team_id !== existingActivity.team_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the activity
    const { error } = await supabase
      .from('schedule_activities')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting schedule activity:', error)
      return NextResponse.json({ error: 'Failed to delete schedule activity' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}