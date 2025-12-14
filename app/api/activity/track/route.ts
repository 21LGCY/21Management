import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Internal API to track user activity
 * Called by middleware on each page visit
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const isLogin = request.headers.get('x-is-login') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Call database function to update activity
    const { error } = await supabase.rpc('update_user_activity', {
      p_user_id: userId,
      p_is_login: isLogin,
    })

    if (error) {
      console.error('Failed to update user activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
