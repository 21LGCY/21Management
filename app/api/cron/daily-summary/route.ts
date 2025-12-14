import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDailySummary } from '@/lib/discord/webhook'

/**
 * Vercel Cron Job: Daily Discord Activity Summary
 * Runs at 8:00 PM UTC daily
 * Summarizes activity from 00:00-23:59 of the previous day
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    console.error('Unauthorized cron job attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Get yesterday's date (since we run at 8 PM, summarize previous full day)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateString = yesterday.toISOString().split('T')[0]

    // Fetch activity data for yesterday
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        total_duration_minutes,
        login_count,
        profiles:user_id (
          username,
          role
        )
      `)
      .eq('session_date', dateString)
      .gt('total_duration_minutes', 0) // Only include users with actual activity
      .order('total_duration_minutes', { ascending: false })

    if (error) {
      console.error('Failed to fetch session data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no activity, send a "quiet day" message
    if (!sessions || sessions.length === 0) {
      await sendDailySummary({
        date: dateString,
        totalUsers: 0,
        totalLogins: 0,
        totalDuration: 0,
        userActivities: [],
      })

      return NextResponse.json({
        success: true,
        message: 'No activity to report',
        date: dateString,
      })
    }

    // Calculate totals and format user data
    const totalUsers = sessions.length
    const totalLogins = sessions.reduce((sum, s) => sum + (s.login_count || 0), 0)
    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.total_duration_minutes || 0),
      0
    )

    const userActivities = sessions.map((session: any) => ({
      username: session.profiles?.username || 'Unknown',
      role: session.profiles?.role || 'player',
      duration_minutes: session.total_duration_minutes || 0,
      login_count: session.login_count || 0,
    }))

    // Send to Discord
    const sent = await sendDailySummary({
      date: dateString,
      totalUsers,
      totalLogins,
      totalDuration,
      userActivities,
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send Discord message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      date: dateString,
      totalUsers,
      totalLogins,
      totalDuration,
      userCount: userActivities.length,
    })
  } catch (error) {
    console.error('Error in daily summary cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
