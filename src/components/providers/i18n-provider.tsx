'use client'

import '@/i18n/client'
import { useEffect } from 'react'
import i18n from 'i18next'
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '@/i18n/settings'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyLanguage = (lng?: string) => {
      const normalized = (lng || DEFAULT_LANGUAGE).split('-')[0]
      document.documentElement.lang = normalized
    }

    applyLanguage(i18n.language)
    const handleLanguageChanged = (lng: string) => applyLanguage(lng)

    i18n.on('languageChanged', handleLanguageChanged)

    const persisted = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (persisted && persisted !== i18n.language) {
      i18n.changeLanguage(persisted).catch(() => {
        applyLanguage(DEFAULT_LANGUAGE)
      })
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  return <>{children}</>
}
