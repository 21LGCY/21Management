'use client'

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'
import { ReactNode } from 'react'

interface I18nProviderProps {
  children: ReactNode
  locale: string
  messages: AbstractIntlMessages
  timeZone?: string
}

export default function I18nProvider({ children, locale, messages, timeZone = 'Europe/Paris' }: I18nProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  )
}
