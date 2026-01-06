'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface TransitionContextType {
  isTransitioning: boolean
}

const TransitionContext = createContext<TransitionContextType>({ isTransitioning: false })

export const usePageTransition = () => useContext(TransitionContext)

interface PageTransitionProviderProps {
  children: ReactNode
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Quick fade transition - minimal delay
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 50)
    return () => clearTimeout(timer)
  }, [pathname, mounted])

  // Prevent hydration mismatch by not applying transition class on server
  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      <div
        className={mounted ? `transition-opacity duration-150 ${isTransitioning ? 'opacity-90' : 'opacity-100'}` : ''}
      >
        {children}
      </div>
    </TransitionContext.Provider>
  )
}

// Simpler component for wrapping page content with fade transitions
interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`animate-page-enter ${className}`}>
      {children}
    </div>
  )
}

// Component for staggered content animations
interface StaggeredContentProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function StaggeredContent({ children, delay = 0, className = '' }: StaggeredContentProps) {
  return (
    <div 
      className={`animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
