'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut, ChevronRight } from 'lucide-react'
import { NotificationBell } from '@/components/notification-bell'
import { RestaurantSwitcher } from './restaurant-switcher'

interface TopBarProps {
  brandName: string
  userName: string
  userEmail?: string
  avatarUrl?: string | null
  restaurantId?: string
  memberships?: any[]
}


export function TopBar({ brandName, userName, avatarUrl, restaurantId, memberships }: TopBarProps) {
  const pathname = usePathname()

  const hasMultiple = (memberships?.length ?? 0) > 1


  const isEditing = pathname.includes('/edit') || pathname.includes('/new')

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Back or Brand or Switcher */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Link
              href={pathname.includes('reservations') ? `/dashboard/${restaurantId}/reservations` : `/dashboard/${restaurantId}`}
              className="flex items-center gap-1 text-violet-400 text-sm font-semibold"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </Link>
          ) : hasMultiple && restaurantId && memberships ? (
            <RestaurantSwitcher 
              currentRestaurantId={restaurantId} 
              memberships={memberships} 
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <span className="text-foreground font-black text-[10px]">TB</span>
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
            href={`/dashboard/${restaurantId}/account`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-violet-600/5 border border-violet-500/10 hover:bg-violet-600/10 transition-all group cursor-pointer active:scale-95 shadow-sm"
          >
            <div className="flex flex-col items-end min-w-0 max-w-[80px] xs:max-w-none">
              <span className="text-[10px] font-black text-foreground italic uppercase tracking-tighter leading-none truncate w-full">{userName}</span>
              <span className="text-[9px] text-violet-500 font-black uppercase tracking-widest mt-0.5 group-hover:text-violet-400 transition-colors">View Profile</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-indigo-700 border border-violet-500/20 flex items-center justify-center text-[10px] font-black italic text-white shadow-xl overflow-hidden flex-shrink-0 group-hover:shadow-violet-500/20 transition-all">
               {avatarUrl ? (
                 <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
               ) : (
                 (userName || '??').slice(0, 2).toUpperCase()
               )}
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <NotificationBell restaurantId={restaurantId} />
            <form action={logout}>
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                className="w-9 h-9 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header >
  )
}
