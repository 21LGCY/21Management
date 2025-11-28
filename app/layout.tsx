import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { PageTransitionProvider } from '@/components/PageTransition'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
})

export const metadata: Metadata = {
  title: {
    default: '21 Legacy Management',
    template: '%s | 21 Legacy',
  },
  description: 'Professional esports team management platform for VALORANT teams and players',
  keywords: ['esports', 'valorant', 'team management', '21 Legacy', 'player management'],
  authors: [{ name: '21 Legacy' }],
  robots: {
    index: false, // Private app - prevent search engine indexing
    follow: false,
  },
  icons: {
    icon: '/images/21.svg',
    shortcut: '/images/21.svg',
    apple: '/images/21.svg',
  },
  openGraph: {
    title: '21 Legacy Management',
    description: 'Professional esports team management platform',
    type: 'website',
    siteName: '21 Legacy Management',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </body>
    </html>
  )
}
