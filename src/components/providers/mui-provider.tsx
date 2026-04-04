'use client'

import React, { useEffect, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useTheme } from 'next-themes'

const sharedComponents = {
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: '1.25rem',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '0.75rem',
        textTransform: 'none' as const,
        fontWeight: 700,
      },
    },
  },
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    background: { default: '#020617', paper: '#0f172a' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' },
  },
  typography: { fontFamily: 'var(--font-inter), sans-serif' },
  components: sharedComponents,
})

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#7c3aed' },
    background: { default: '#ffffff', paper: '#f8fafc' },
    text: { primary: '#0f172a', secondary: '#475569' },
  },
  typography: { fontFamily: 'var(--font-inter), sans-serif' },
  components: sharedComponents,
})

function MuiThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const theme = mounted && resolvedTheme === 'light' ? lightTheme : darkTheme
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

export function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiThemeWrapper>
        {children}
      </MuiThemeWrapper>
    </LocalizationProvider>
  )
}
