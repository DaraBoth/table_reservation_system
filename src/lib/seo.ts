import type { Metadata } from 'next'

export const APP_NAME = 'BookJM'
export const APP_DESCRIPTION = 'Booking and operations platform for restaurants, hotels, and guesthouses.'
export const DEFAULT_OG_IMAGE = '/logo.png'

function normalizeUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  return new URL(normalizeUrl(envUrl || 'http://localhost:3001'))
}

type PageMetadataInput = {
  title: string
  description: string
  path?: string
  noIndex?: boolean
}

export function createPageMetadata({ title, description, path, noIndex = false }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: path ? { canonical: path } : undefined,
    openGraph: {
      title,
      description,
      url: path,
      siteName: APP_NAME,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 512,
          height: 512,
          alt: `${APP_NAME} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
  }
}

export function createPrivateMetadata(title: string, description: string, path?: string): Metadata {
  return createPageMetadata({ title, description, path, noIndex: true })
}