import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Khmer } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import NextTopLoader from 'nextjs-toploader'
import { APP_DESCRIPTION, APP_NAME, DEFAULT_OG_IMAGE, getSiteUrl } from '@/lib/seo'

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ['khmer'],
  display: 'swap',
  variable: '--font-khmer-sans',
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: ['restaurant booking system', 'hotel booking system', 'table reservations', 'guesthouse operations', 'multi-tenant booking software'],
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    apple: '/icons/maskable_icon_x192.png',
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: 'website',
    url: '/',
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
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Common PWA setup to disable pinch-zoom on Safari forms
}

import { MuiProvider } from '@/components/providers/mui-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
      </head>
      <body className={`${notoSansKhmer.variable} ${notoSansKhmer.className} antialiased`} suppressHydrationWarning>

        <ThemeProvider>
        <MuiProvider>
          <AuthProvider>
            <NextTopLoader 
              color="#7c3aed" 
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px #7c3aed,0 0 5px #7c3aed"
            />
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </MuiProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
