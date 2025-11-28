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
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    // Start transition
    setIsTransitioning(true)
    
    // Short delay for exit animation, then update content
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      <div
        className={`page-transition-wrapper ${isTransitioning ? 'page-exit' : 'page-enter'}`}
      >
        {displayChildren}
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
