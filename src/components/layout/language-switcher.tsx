'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AppLanguage } from '@/i18n/settings'
import { SUPPORTED_LANGUAGES } from '@/i18n/settings'

const languageMeta: Record<
  AppLanguage,
  { countryCode: string; nativeLabel: string; translatedKey: string }
> = {
  en: { countryCode: 'us', nativeLabel: 'English', translatedKey: 'language.en' },
  km: { countryCode: 'kh', nativeLabel: 'ខ្មែរ', translatedKey: 'language.km' },
  zh: { countryCode: 'cn', nativeLabel: '中文', translatedKey: 'language.zh' },
  vi: { countryCode: 'vn', nativeLabel: 'Tiếng Việt', translatedKey: 'language.vi' },
  ko: { countryCode: 'kr', nativeLabel: '한국어', translatedKey: 'language.ko' },
}

function Flag({ countryCode, alt }: { countryCode: string; alt: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode}.png 2x`}
      alt={alt}
      className="h-3.5 w-5 rounded-xs object-cover ring-1 ring-border/70"
      loading="lazy"
    />
  )
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const current = (SUPPORTED_LANGUAGES.includes(i18n.language as AppLanguage)
    ? i18n.language
    : i18n.language.split('-')[0]) as AppLanguage

  const value = SUPPORTED_LANGUAGES.includes(current) ? current : 'en'
  const selected = languageMeta[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label={t('language.label')}
            className="h-8 min-w-0 gap-1 rounded-xl border border-border/60 bg-card/40 px-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Flag countryCode={selected.countryCode} alt={t(selected.translatedKey)} />
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44 rounded-xl border border-border/60 bg-card/95 p-1 shadow-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1 text-[9px] font-semibold tracking-[0.08em] uppercase">
            {t('language.label')}
          </DropdownMenuLabel>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const meta = languageMeta[lang]
            const active = lang === value

            return (
              <DropdownMenuItem
                key={lang}
                onClick={() => {
                  void i18n.changeLanguage(lang)
                }}
                className="relative flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <Flag countryCode={meta.countryCode} alt={t(meta.translatedKey)} />
                <span className="truncate text-[13px] font-semibold text-foreground">{meta.nativeLabel}</span>
                {active ? <Check className="ml-auto h-4 w-4 text-violet-400" /> : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
