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
  restaurantId?: string
  memberships?: any[]
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/reservations': 'Bookings',
  '/dashboard/reservations/new': 'New Booking',
  '/dashboard/tables': 'Tables',
  '/dashboard/staff': 'Staff',
  '/dashboard/account': 'Account',
}

export function TopBar({ brandName, userName, restaurantId, memberships }: TopBarProps) {
  const pathname = usePathname()

  const hasMultiple = (memberships?.length ?? 0) > 1

  // Find matching title (longest match wins for nested routes)
  const title = Object.entries(pageTitles)
    .filter(([key]) => pathname === key || pathname.startsWith(key + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  const isEditing = pathname.includes('/edit') || pathname.includes('/new')

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/60">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Back or Brand or Switcher */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Link
              href={pathname.includes('reservations') ? '/dashboard/reservations' : '/dashboard'}
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
                <span className="text-white font-black text-[10px]">TB</span>
              </div>
              <span className="text-white font-bold text-sm">{brandName}</span>
            </div>
          )}
        </div>

        {isEditing ? (
          <h1 className="text-white font-bold text-base absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        ) : null}


        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 translate-x-1.5">
          <NotificationBell restaurantId={restaurantId} />
          <form action={logout}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="w-9 h-9 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </header >
  )
}
