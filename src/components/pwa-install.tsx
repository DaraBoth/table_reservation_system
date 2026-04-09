'use client'

import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

export function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(checkStandalone)

    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(checkIsIOS)

    // Check if dismissed within the last 7 days
    const dismissedAt = localStorage.getItem('pwa-banner-dismissed-at')
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      const wasDismissed = Date.now() - Number(dismissedAt) < sevenDays
      setDismissed(wasDismissed)
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      toast.success('App installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setDismissed(true)
    }
  }

  const handleIOSPrompt = () => {
    toast.info('To install: tap the Share button in Safari, then select "Add to Home Screen"', {
      duration: 7000,
      icon: <Smartphone className="w-4 h-4 text-violet-500" />,
    })
    dismiss()
  }

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed-at', String(Date.now()))
    setDismissed(true)
  }

  // Don't show if: standalone, installed, dismissed, or no prompt available and not iOS
  if (isStandalone || isInstalled || dismissed) return null
  if (!installPrompt && !isIOS) return null

  return (
    <div className="animate-in slide-in-from-top-2 fade-in duration-300 bg-violet-600/10 border-b border-violet-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4 text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-foreground uppercase tracking-tight">Install the App</p>
          <p className="text-[10px] text-muted-foreground font-medium truncate">
            {isIOS
              ? 'Add to Home Screen to receive push notifications'
              : 'Get push notifications and a native app experience'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={isIOS ? handleIOSPrompt : handleInstall}
          className="h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-violet-500/20"
        >
          {isIOS ? 'How?' : 'Install'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
