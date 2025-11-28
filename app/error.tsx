'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Application error:', error.message)
  }, [error])

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong!</h1>
        <p className="text-gray-400 mb-6">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-600 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
