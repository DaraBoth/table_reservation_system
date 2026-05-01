'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/auth/logout-button'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, PanelLeft } from 'lucide-react'
import { NotificationBell } from '@/components/notification-bell'
import { RestaurantSwitcher } from './restaurant-switcher'
import { useSidebar } from './sidebar-provider'
import { PWAInstallBanner } from '@/components/pwa-install'
import { LanguageSwitcher } from './language-switcher'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface TopBarProps {
  brandName: string
  userName: string
  userEmail?: string
  avatarUrl?: string | null
  restaurantId?: string
  activeSlug?: string
  memberships?: any[]
  logoUrl?: string
  isSpecialAdmin?: boolean
  specialFeatures?: Record<string, any>
}


export function TopBar({ 
  brandName, 
  userName, 
  userEmail, 
  avatarUrl, 
  restaurantId, 
  activeSlug, 
  memberships, 
  logoUrl,
  isSpecialAdmin,
  specialFeatures
}: TopBarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)

  // Find the exact active membership based on current URL to pass dashSlug everywhere
  const activeMembership = memberships?.find(m => m.restaurant_id === restaurantId)
  const dashSlug = activeMembership?.restaurants?.slug || restaurantId

  const isEditing = pathname.includes('/edit-') || pathname.includes('/create-') || pathname.includes('/setup')
  const hasMultiple = memberships && memberships.length > 1

  useEffect(() => {
    setMobileActionsOpen(false)
  }, [pathname])

  return (
    <>
      <PWAInstallBanner />
      <header className="sticky top-0 z-30 w-full flex items-center justify-between px-3 md:px-6 h-14 bg-card/60 backdrop-blur-xl border-b border-border/40 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all rounded-lg"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>

          {isEditing ? (
            <Link
              href={pathname.includes('reservations') ? `/dashboard/${dashSlug}/reservations` : `/dashboard/${dashSlug}`}
              className="flex items-center gap-1 text-violet-400 text-sm font-semibold"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              {t('common.back')}
            </Link>
          ) : hasMultiple && restaurantId && memberships ? (
            <RestaurantSwitcher 
              currentRestaurantId={restaurantId} 
              memberships={memberships} 
              isSpecialAdmin={isSpecialAdmin}
              specialFeatures={specialFeatures}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-foreground font-black text-[10px]">TB</span>
                )}
              </div>
              <span className="text-foreground font-bold text-sm">{brandName}</span>
            </div>
          )}
        </div>

        {/* Center: Removed h1 title that used to overlap with profile button in New/Edit mode */}


        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* User Identity - Navigates to Account Settings */}
          <Link 
            href={`/dashboard/${dashSlug}/account`}
            className="flex items-center gap-2 p-1.5 sm:px-3 rounded-2xl bg-violet-600/5 border border-violet-500/10 hover:bg-violet-600/10 transition-all group cursor-pointer active:scale-95 shadow-sm shrink-0"
          >
            {/* Hidden on mobile to save space */}
            <div className="hidden sm:flex flex-col items-end min-w-0 max-w-20 xs:max-w-none">
              <span className="text-[10px] font-black text-foreground italic uppercase tracking-tighter leading-none truncate w-full">{userName}</span>
              <span className="text-[9px] text-violet-500 font-black uppercase tracking-widest mt-0.5 group-hover:text-violet-400 transition-colors">{t('common.viewProfile')}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-indigo-700 border border-violet-500/20 flex items-center justify-center text-[10px] font-black italic text-white shadow-xl overflow-hidden shrink-0 group-hover:shadow-violet-500/20 transition-all">
               {avatarUrl ? (
                 <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
               ) : (
                 (userName || '??').slice(0, 2).toUpperCase()
               )}
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher className="h-9" />
            <NotificationBell restaurantId={restaurantId} className="h-9 w-9" />
            <LogoutButton isCollapsed={false} showText={false} className="w-9 h-9" formClassName="w-auto" />
          </div>

          <div className="sm:hidden flex items-center min-w-0">
            <div
              className={cn(
                'flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-all duration-300 ease-out',
                mobileActionsOpen ? 'max-w-62 opacity-100 mr-1.5' : 'max-w-0 opacity-0 mr-0 pointer-events-none'
              )}
            >
              <div className="flex items-center gap-1.5 pr-1">
                <LanguageSwitcher showLabel className="h-9 min-w-24 justify-between px-2" />
                <NotificationBell restaurantId={restaurantId} className="h-9 w-9 shrink-0" />
                <LogoutButton
                  isCollapsed={false}
                  showText={false}
                  className="w-9 h-9 shrink-0"
                  formClassName="w-auto shrink-0"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label={mobileActionsOpen ? t('common.closeActions', { defaultValue: 'Close actions' }) : t('common.openActions', { defaultValue: 'Open actions' })}
              onClick={() => setMobileActionsOpen((prev) => !prev)}
              className="h-9 w-9 rounded-xl border border-border/60 bg-card/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground shrink-0"
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', mobileActionsOpen && 'rotate-180')} />
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
