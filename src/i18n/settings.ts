export const SUPPORTED_LANGUAGES = ['en', 'km', 'zh', 'vi', 'ko'] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: AppLanguage = 'en'
export const LANGUAGE_STORAGE_KEY = 'tbmng-language'
