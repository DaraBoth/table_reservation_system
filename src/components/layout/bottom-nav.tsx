'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CalendarDays, Grid3X3, UserCircle, Users, BarChart3, BookUser, BedDouble } from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'

interface BottomNavProps {
  isAdmin?: boolean
  businessType?: BusinessType
}

export function BottomNav({ isAdmin, businessType = 'restaurant' }: BottomNavProps) {
  const pathname = usePathname()
  const terms = getTerms(businessType)

  // Use BedDouble icon for hotel/guesthouse rooms, Grid3X3 for restaurant tables
  const unitIcon = terms.hasCheckout ? BedDouble : Grid3X3

  const navItems = [
    { href: '/dashboard',              label: 'Home',          icon: LayoutDashboard, exact: true  },
    { href: '/dashboard/reservations', label: terms.bookings,  icon: CalendarDays,    exact: false },
    { href: '/dashboard/tables',       label: terms.units,     icon: unitIcon,        exact: false },
    { href: '/dashboard/customers',    label: 'Customers',     icon: BookUser,        exact: false },
    ...(isAdmin ? [
      { href: '/dashboard/staff',   label: 'Staff',   icon: Users,     exact: false },
      { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, exact: false },
    ] : []),
    { href: '/dashboard/account', label: 'Account', icon: UserCircle, exact: false },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div 
        className="flex items-stretch justify-around px-1" 
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', paddingTop: '0.75rem' }}
      >
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-start flex-1 gap-1.5 transition-all duration-200 relative min-w-[3.5rem]',
                isActive ? 'text-violet-400' : 'text-slate-500'
              )}
            >
              <Icon className={cn('w-7 h-7 transition-all duration-300', isActive && 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]')} />
              <span className={cn('text-[10px] font-bold tracking-wide transition-colors', isActive ? 'text-violet-400' : 'text-slate-500')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
