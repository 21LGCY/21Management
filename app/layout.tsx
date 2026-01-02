import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { PageTransitionProvider } from '@/components/PageTransition'
import I18nProvider from '@/components/I18nProvider'
import { getLocale, getMessages, getTimeZone } from 'next-intl/server'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
})

export const metadata: Metadata = {
  title: {
    default: '21 Legacy',
    template: '%s | 21 Legacy',
  },
  description: 'Management Platform',
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
    title: '21 Legacy',
    description: 'Management platform',
    type: 'website',
    siteName: '21 Legacy - Management',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const timeZone = await getTimeZone()

  return (
    <html lang={locale} className="dark">
      <body className={inter.className}>
        <I18nProvider locale={locale} messages={messages} timeZone={timeZone}>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
