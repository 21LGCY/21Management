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

  useEffect(() => {
    // Quick fade transition - minimal delay
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 50)
    return () => clearTimeout(timer)
  }, [pathname])

  // Use suppressHydrationWarning to prevent hydration mismatch
  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      <div 
        className="transition-opacity duration-150"
        style={{ opacity: isTransitioning ? 0.9 : 1 }}
        suppressHydrationWarning
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
