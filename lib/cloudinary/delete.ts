'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Extract Cloudinary public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/dmuhioegi/image/upload/v1234567890/folder/image.jpg
 * Returns: folder/image
 */
function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const url = new URL(cloudinaryUrl)
    const pathParts = url.pathname.split('/')
    
    // Find the upload segment
    const uploadIndex = pathParts.indexOf('upload')
    if (uploadIndex === -1) return null
    
    // Get everything after version (v1234567890)
    const afterUpload = pathParts.slice(uploadIndex + 2)
    
    // Join and remove file extension
    const publicId = afterUpload.join('/').replace(/\.[^.]+$/, '')
    return publicId
  } catch (error) {
    console.error('Error extracting public_id:', error)
    return null
  }
}

/**
 * Delete an image from Cloudinary using the Admin API
 * Requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary credentials not configured')
      return false
    }

    const publicId = extractPublicId(imageUrl)
    if (!publicId) {
      console.error('Could not extract public_id from URL:', imageUrl)
      return false
    }

    // Generate timestamp and signature
    const timestamp = Math.round(new Date().getTime() / 1000)
    const crypto = require('crypto')
    
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex')

    // Call Cloudinary destroy API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          timestamp: timestamp,
          api_key: apiKey,
          signature: signature,
        }),
      }
    )

    const result = await response.json()
    
    if (result.result === 'ok' || result.result === 'not found') {
      console.log('Successfully deleted from Cloudinary:', publicId)
      return true
    } else {
      console.error('Cloudinary deletion failed:', result)
      return false
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}

/**
 * Server action to delete a team message image
 */
export async function deleteTeamMessageImage(messageId: string, userId: string) {
  try {
    const supabase = await createClient()

    // Get the message to retrieve image URL
    const { data: message, error: fetchError } = await supabase
      .from('team_messages')
      .select('image_url, author_id')
      .eq('id', messageId)
      .single()

    if (fetchError) throw fetchError
    if (!message) throw new Error('Message not found')

    // Verify user is the author or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (message.author_id !== userId && profile?.role !== 'admin') {
      throw new Error('Unauthorized')
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('team_messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) throw deleteError

    // Delete from Cloudinary if it has an image
    if (message.image_url) {
      await deleteFromCloudinary(message.image_url)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting team message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Server action to delete a user avatar
 */
export async function deleteUserAvatar(userId: string, avatarUrl: string) {
  try {
    const supabase = await createClient()

    // Update database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (updateError) throw updateError

    // Delete from Cloudinary
    if (avatarUrl) {
      await deleteFromCloudinary(avatarUrl)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting avatar:', error)
    return { success: false, error: error.message }
  }
}
