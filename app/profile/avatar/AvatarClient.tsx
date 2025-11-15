'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Loader2, User, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface AvatarClientProps {
  userId: string
  currentAvatar: string | null
  role: string
}

export default function AvatarClient({ userId, currentAvatar, role }: AvatarClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatar)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const dashboardUrl = `/dashboard/${role}`

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    setError(null)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      // Update the cookie with new avatar URL
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('esports_user='))
      
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]))
        userData.avatar_url = publicUrl
        document.cookie = `esports_user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
      }

      setAvatarUrl(publicUrl)
      setPreviewUrl(null)
      setSuccess(true)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) throw updateError

      // Update the cookie to remove avatar URL
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('esports_user='))
      
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]))
        userData.avatar_url = null
        document.cookie = `esports_user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
      }

      setAvatarUrl(null)
      setPreviewUrl(null)
      setSuccess(true)

      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar')
    } finally {
      setUploading(false)
    }
  }

  const displayAvatar = previewUrl || avatarUrl

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-card to-dark pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={dashboardUrl}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Profile Avatar
          </h1>
          <p className="text-gray-400 mt-2">Upload or change your profile picture</p>
        </div>

        {/* Avatar Upload Section */}
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6 shadow-xl">
          {/* Current/Preview Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt="Avatar"
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-gray-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center border-4 border-gray-700">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            
            {previewUrl && (
              <p className="text-sm text-gray-400 mb-2">Preview - Click upload to save</p>
            )}
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer hover:file:bg-primary-dark transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              Avatar updated successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !previewUrl}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Avatar
                </>
              )}
            </button>

            {avatarUrl && !previewUrl && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-800/30 hover:to-red-700/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-800/50 hover:border-red-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
