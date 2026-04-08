'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// ✨ Next.js 16/React 19 Performance Patch
// Filters out the "Encountered a script tag" false-positive warning in development.
// This is necessary because next-themes uses an essential inline script to prevent theme flash.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && (args[0].includes('Encountered a script tag') || args[0].includes('data-new-gr-c-s-check-loaded'))) {
      return
    }

    originalError.apply(console, args)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
