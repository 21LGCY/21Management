// Internationalization configuration
// Supports English and French with room for future languages

export type Locale = 'en' | 'fr'

export const locales: Locale[] = ['en', 'fr']
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français'
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷'
}

// Cookie name for storing user's locale preference
export const LOCALE_COOKIE = 'esports_locale'

// Options for locale select dropdown
export const LOCALE_OPTIONS = locales.map(locale => ({
  value: locale,
  label: `${localeFlags[locale]} ${localeNames[locale]}`
}))
