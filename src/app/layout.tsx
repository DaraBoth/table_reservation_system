import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BookJM',
  description: 'Multi-tenant restaurant and hotel management system',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BookJM',
  },
}

export const viewport: Viewport = {
  themeColor: '#020617', // slate-950 matches our deep dark bg
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Common PWA setup to disable pinch-zoom on Safari forms
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
