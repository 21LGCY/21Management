'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  fallbackHref?: string
  className?: string
  children?: React.ReactNode
}

export default function BackButton({ fallbackHref, className = "", children }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      router.back()
    } else if (fallbackHref) {
      // Fallback to a specific route if no history
      router.push(fallbackHref)
    } else {
      // Default fallback to dashboard
      router.push('/dashboard/manager')
    }
  }

  return (
    <button 
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-gray-400 hover:text-white transition group ${className}`}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span>{children}</span>
    </button>
  )
}