'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Save, Loader2, Lock, Eye, EyeOff, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { deleteUserAvatar } from '@/lib/cloudinary/delete'
import { optimizeAvatar } from '@/lib/cloudinary/optimize'

interface Profile {
  id: string
  username: string
  email: string
  role: string
  created_at: string
  avatar_url?: string | null
}

interface SettingsClientProps {
  profile: Profile
  userId: string
}

export default function SettingsClient({ profile, userId }: SettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [username, setUsername] = useState(profile.username)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const dashboardUrl = `/dashboard/${profile.role}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', userId)

      if (updateError) throw updateError

      // Update the cookie with new username
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('esports_user='))
      
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]))
        userData.username = username
        document.cookie = `esports_user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(dashboardUrl)
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to update account settings')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    setError(null)
  }

  const handleAvatarUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setError(null)
    setSuccess(false)

    try {
      // Create FormData for Cloudinary upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to upload to Cloudinary')
      }

      const publicUrl = result.secure_url

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

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
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current avatar URL before deletion
      const currentAvatarUrl = avatarUrl

      // Use server action to delete avatar and Cloudinary image
      if (currentAvatarUrl) {
        const result = await deleteUserAvatar(userId, currentAvatarUrl)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to remove avatar')
        }
      } else {
        // No avatar to delete, just update database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('id', userId)

        if (updateError) throw updateError
      }

      // Update cookie
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
      setUploadingAvatar(false)
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
            Account Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your account information</p>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Role Field (Read-only) */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  value={profile.role}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed capitalize"
                />
                <p className="text-xs text-gray-500 mt-1">Role is managed by administrators</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || username === profile.username}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Avatar Section */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>
            
            {/* Current/Preview Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="mb-4">
                {displayAvatar ? (
                  <Image
                    src={optimizeAvatar(displayAvatar)}
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
            <div className="mb-4">
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAvatarUpload}
                disabled={uploadingAvatar || !previewUrl}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {uploadingAvatar ? (
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
                  disabled={uploadingAvatar}
                  className="px-6 py-3 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-800/30 hover:to-red-700/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-800/50 hover:border-red-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Current Password Field */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <span className="pl-3 text-gray-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-transparent border-none text-white focus:outline-none focus:ring-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="pr-3 text-gray-500 hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <span className="pl-3 text-gray-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-transparent border-none text-white focus:outline-none focus:ring-0"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="pr-3 text-gray-500 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <span className="pl-3 text-gray-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-transparent border-none text-white focus:outline-none focus:ring-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="pr-3 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              Settings updated successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
