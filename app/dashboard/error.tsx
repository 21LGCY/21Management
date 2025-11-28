'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error.message)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-6 text-sm">
          We couldn't load this page. Please try again.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-600 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
