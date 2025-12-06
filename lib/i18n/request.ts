import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from './config'

export default getRequestConfig(async () => {
  // Get locale from cookie, fallback to default
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined
  
  // Validate the locale is supported
  const locale = localeCookie && locales.includes(localeCookie) 
    ? localeCookie 
    : defaultLocale

  return {
    locale,
    timeZone: 'Europe/Paris', // Default timezone for the app
    messages: (await import(`@/messages/${locale}.json`)).default
  }
})
