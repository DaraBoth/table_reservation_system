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

import { useState } from 'react'

interface BottomNavProps {
  isAdmin?: boolean
  businessType?: BusinessType
}

export function BottomNav({ isAdmin, businessType = 'restaurant' }: BottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                className={cn(
                  'flex flex-col items-center justify-start flex-1 gap-1.5 transition-all duration-200 relative min-w-[4rem]',
                  pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports') ? 'text-violet-400' : 'text-slate-500'
                )}
              >
                <Menu
                  className={cn(
                    'w-6 h-6 transition-all duration-300',
                    (pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports')) && 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                  )}
                  fill={pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports') ? 'currentColor' : 'none'} 
                />
                <span className={cn(
                  "text-[10px] font-bold tracking-wide transition-colors",
                  (pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports')) ? 'text-violet-400' : 'text-slate-500'
                )}>
                  More
                </span>
              </button>
            }
          />
          <SheetContent side="right" className="bg-slate-950/90 backdrop-blur-xl border-slate-800/50 p-0 sm:max-w-xs overflow-hidden">
            <div className="flex flex-col h-full bg-slate-950/40">
              <SheetHeader className="p-8 pb-6 text-left border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-black text-[10px]">TB</span>
                  </div>
                  <SheetTitle className="text-white text-xl font-black tracking-tight">Menu</SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 mt-2">
                <MenuLink 
                  href="/dashboard/reports" 
                  icon={BarChart3} 
                  label="Reports" 
                  active={pathname.startsWith('/dashboard/reports')} 
                  onClick={() => setOpen(false)}
                />
                {isAdmin && (
                  <MenuLink 
                    href="/dashboard/staff" 
                    icon={Users} 
                    label="Staff" 
                    active={pathname.startsWith('/dashboard/staff')} 
                    onClick={() => setOpen(false)}
                  />
                )}
                <MenuLink 
                  href="/dashboard/account" 
                  icon={UserCircle} 
                  label="Settings" 
                  active={pathname.startsWith('/dashboard/account')} 
                  onClick={() => setOpen(false)}
                />

                <div className="pt-6 mt-6 border-t border-slate-800/50 px-2">
                  <form action={logout}>
                    <button
                      type="submit"
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm border border-transparent hover:border-red-500/20"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>

              <div className="p-8 bg-slate-900/40 border-t border-slate-800/50 flex flex-col gap-1 items-center">
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                  BookJM
                </p>
                <p className="text-[9px] text-slate-700 font-semibold tracking-wider">
                  VERSION 2.4.0 • © 2026 
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

function MenuLink({ href, icon: Icon, label, active, onClick }: { href: string; icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm relative group overflow-hidden border",
        active
          ? "bg-violet-600/10 text-violet-400 border-violet-500/20 shadow-[inset_0_0_12px_rgba(139,92,246,0.05)]"
          : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-white"
      )}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-violet-500 rounded-r-lg shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
      )}
      <Icon 
        className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active && "drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]")} 
        fill={active ? 'currentColor' : 'none'} 
      />
      <div className="flex flex-col">
        {label}
      </div>
    </Link>
  )
}
