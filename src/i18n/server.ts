import { headers } from 'next/headers'
import { createInstance } from 'i18next'
import { resources } from './resources'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type AppLanguage } from './settings'

function resolveLanguage(acceptLanguageHeader: string | null, preferredLanguage?: string): AppLanguage {
  const preferredBase = (preferredLanguage || '').split('-')[0]?.toLowerCase()
  if (preferredBase && SUPPORTED_LANGUAGES.includes(preferredBase as AppLanguage)) {
    return preferredBase as AppLanguage
  }

  if (!acceptLanguageHeader) return DEFAULT_LANGUAGE

  const ordered = acceptLanguageHeader
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean)

  for (const candidate of ordered) {
    if (SUPPORTED_LANGUAGES.includes(candidate as AppLanguage)) {
      return candidate as AppLanguage
    }
    const base = candidate.split('-')[0]
    if (SUPPORTED_LANGUAGES.includes(base as AppLanguage)) {
      return base as AppLanguage
    }
  }

  return DEFAULT_LANGUAGE
}

export async function getServerT(preferredLanguage?: string) {
  const headerStore = await headers()
  const language = resolveLanguage(headerStore.get('accept-language'), preferredLanguage)

  const i18n = createInstance()
  await i18n.init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
  })

  return {
    t: i18n.t.bind(i18n),
    language,
  }
}
