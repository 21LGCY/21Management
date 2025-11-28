'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode, useCallback, useState, useTransition } from 'react'

interface TransitionLinkProps {
  href: string
  children: ReactNode
  className?: string
  prefetch?: boolean
  onClick?: () => void
}

/**
 * A Link component that provides visual feedback during navigation.
 * Uses React's useTransition for smooth, non-blocking navigation.
 */
export default function TransitionLink({ 
  href, 
  children, 
  className = '',
  prefetch = true,
  onClick
}: TransitionLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onClick?.()
    
    startTransition(() => {
      router.push(href)
    })
  }, [href, router, onClick])

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch={prefetch}
      className={`${className} ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {children}
    </Link>
  )
}

/**
 * Hook to get navigation state for custom implementations
 */
export function useNavigationTransition() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback((href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }, [router])

  return { navigate, isPending }
}
