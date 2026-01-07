'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link as LinkIcon, Loader2, X, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { FormattedFaceitStats } from '@/lib/types/faceit'

interface FaceitLinkButtonProps {
  isLinked: boolean
  faceitNickname?: string | null
  onLinkSuccess?: (stats: FormattedFaceitStats) => void
  onUnlinkSuccess?: () => void
}

export default function FaceitLinkButton({
  isLinked,
  faceitNickname,
  onLinkSuccess,
  onUnlinkSuccess,
}: FaceitLinkButtonProps) {
  const t = useTranslations('faceit')
  const tCommon = useTranslations('common')

  const [isOpen, setIsOpen] = useState(false)
  const [profileUrl, setProfileUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLink = async () => {
    if (!profileUrl.trim()) {
      setError(t('enterProfileUrl'))
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/faceit/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: profileUrl.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || t('linkError'))
        return
      }

      setSuccess(t('linkSuccess'))
      setIsOpen(false)
      setProfileUrl('')
      
      if (onLinkSuccess && data.stats) {
        onLinkSuccess(data.stats)
      }

      // Reload page to show updated data
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError(t('linkError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!confirm(t('unlinkConfirm'))) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/faceit/unlink', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || t('unlinkError'))
        return
      }

      setSuccess(t('unlinkSuccess'))
      
      if (onUnlinkSuccess) {
        onUnlinkSuccess()
      }

      // Reload page to show updated data
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError(t('unlinkError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Already linked - show unlink option
  if (isLinked) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
          <img 
            src="/images/faceit.svg" 
            alt="FACEIT" 
            className="w-4 h-4"
          />
          <span className="text-sm text-orange-300">{faceitNickname}</span>
          <Check className="w-4 h-4 text-green-400" />
        </div>
        
        <button
          onClick={handleUnlink}
          disabled={isLoading}
          className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('unlink')
          )}
        </button>

        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
        {success && (
          <span className="text-sm text-green-400">{success}</span>
        )}
      </div>
    )
  }

  // Not linked - show link button and modal
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 hover:border-orange-500/60 text-orange-300 rounded-lg transition"
      >
        <LinkIcon className="w-4 h-4" />
        {t('linkAccount')}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <img 
                    src="/images/faceit.svg" 
                    alt="FACEIT" 
                    className="w-6 h-6"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('linkFaceit')}</h3>
                  <p className="text-sm text-gray-400">{t('linkDescription')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setError(null)
                  setProfileUrl('')
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('faceitProfileUrl')}
              </label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                  placeholder={t('enterFaceitProfileUrl')}
                  className="w-full pl-10 pr-4 py-3 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">{t('profileUrlHint')}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-300">{success}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setError(null)
                  setProfileUrl('')
                }}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                disabled={isLoading}
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleLink}
                disabled={isLoading || !profileUrl.trim()}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('linking')}
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    {t('link')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
