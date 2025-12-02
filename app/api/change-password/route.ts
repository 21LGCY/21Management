import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUser } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const user = await getVerifiedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, verify the current password using authenticate_user
    const { data: authData, error: authError } = await supabase
      .rpc('authenticate_user', {
        p_username: user.username,
        p_password: currentPassword
      })

    if (authError || !authData || authData.length === 0) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Now update the password using the update_password RPC
    const { data, error } = await supabase
      .rpc('update_password', {
        p_user_id: user.user_id,
        p_old_password: currentPassword,
        p_new_password: newPassword
      })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
