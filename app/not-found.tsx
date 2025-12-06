'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const t = useTranslations('errors')

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('pageNotFound')}</h2>
        <p className="text-gray-400 mb-8">
          {t('pageNotFoundDescription')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  )
}
