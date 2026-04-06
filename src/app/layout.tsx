import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import NextTopLoader from 'nextjs-toploader'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'BookJM',
  description: 'Multi-tenant restaurant and hotel management system',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/logo.png',
    apple: '/icons/maskable_icon_x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BookJM',
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
      <body className={`${inter.className} antialiased`}>
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
