'use client'

import { LOCALE_COOKIE, type Locale, defaultLocale, locales } from './config'

/**
 * Get the current locale from cookie (client-side)
 */
export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${LOCALE_COOKIE}=`))
  
  const locale = cookie?.split('=')[1] as Locale | undefined
  
  return locale && locales.includes(locale) ? locale : defaultLocale
}

/**
 * Set the locale preference in cookie (client-side)
 */
export function setClientLocale(locale: Locale): void {
  if (typeof document === 'undefined') return
  
  // Set cookie with 1 year expiry
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; secure; samesite=strict`
}

/**
 * Update locale and refresh the page to apply changes
 */
export function changeLocale(locale: Locale): void {
  setClientLocale(locale)
  window.location.reload()
}
