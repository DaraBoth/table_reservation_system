'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CalendarDays, LayoutGrid, UserCircle, Users, BarChart3, BookUser, BedDouble, Menu, LogOut, ChevronRight, Home, Settings } from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import { logout } from '@/app/actions/auth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { BusinessType } from '@/lib/business-type'

interface BottomNavProps {
  isAdmin?: boolean
  businessType?: BusinessType
}

export function BottomNav({ isAdmin, businessType = 'restaurant' }: BottomNavProps) {
  const pathname = usePathname()
  const terms = getTerms(businessType)

  // Use BedDouble icon for hotel/guesthouse rooms, LayoutGrid for restaurant tables
  const unitIcon = terms.hasCheckout ? BedDouble : LayoutGrid

  const primaryItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true },
    { href: '/dashboard/tables', label: terms.units, icon: unitIcon, exact: false },
    { href: '/dashboard/reservations', label: terms.bookings, icon: CalendarDays, exact: false },
    { href: '/dashboard/customers', label: 'Customers', icon: BookUser, exact: false },
  ]

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-50 bg-slate-900/80 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="flex items-stretch justify-around px-2 py-3"
      >
        {primaryItems.map((item) => {
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
                'flex flex-col items-center justify-start flex-1 gap-1.5 transition-all duration-200 relative min-w-[4rem]',
                isActive ? 'text-violet-400' : 'text-slate-500'
              )}
            >
              <Icon
                className={cn('w-6 h-6 transition-all duration-300', isActive && 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]')}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className={cn('text-[10px] font-bold tracking-wide transition-colors', isActive ? 'text-violet-400' : 'text-slate-500')}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* More Menu Trigger */}
        <Sheet>
          <SheetTrigger
            render={
              <button
                className={cn(
                  'flex flex-col items-center justify-start flex-1 gap-1.5 transition-all duration-200 relative min-w-[4rem]',
                  pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports') ? 'text-violet-400' : 'text-slate-500'
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 overflow-hidden border border-transparent",
                  (pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports')) && "border-violet-500/50 scale-110"
                )}>
                  <Menu className="w-5 h-5" fill={pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports') ? 'currentColor' : 'none'} />
                </div>
                <span className="text-[10px] font-bold tracking-wide">More</span>
              </button>
            }
          />
          <SheetContent side="right" className="bg-slate-950 border-slate-800 p-0 sm:max-w-xs">
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b border-slate-800">
                <SheetTitle className="text-white text-lg font-black">Menu</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <MenuLink href="/dashboard/reports" icon={BarChart3} label="Reports" active={pathname.startsWith('/dashboard/reports')} />
                {isAdmin && (
                  <>
                    <MenuLink href="/dashboard/staff" icon={Users} label="Staff Management" active={pathname.startsWith('/dashboard/staff')} />
                  </>
                )}
                <MenuLink href="/dashboard/account" icon={UserCircle} label="System Settings" active={pathname.startsWith('/dashboard/account')} />

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                  BookJM © 2026
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

function MenuLink({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm",
        active
          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      )}
    >
      <Icon className="w-5 h-5" fill={active ? 'currentColor' : 'none'} />
      {label}
    </Link>
  )
}
