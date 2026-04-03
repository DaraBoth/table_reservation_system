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
import { PlusCircle } from 'lucide-react'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react'

interface BottomNavProps {
  isAdmin?: boolean
  businessType?: BusinessType
  isSpecialAdmin?: boolean
  specialFeatures?: Record<string, any>
  restaurantId: string
  memberships?: any[]
}

export function BottomNav({ 
  isAdmin, 
  businessType = 'restaurant', 
  isSpecialAdmin = false, 
  specialFeatures = {},
  restaurantId,
  memberships = []
}: BottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const terms = getTerms(businessType)

  // Use BedDouble icon for hotel/guesthouse rooms, LayoutGrid for restaurant tables
  const unitIcon = terms.hasCheckout ? BedDouble : LayoutGrid

  const primaryItems = [
    { href: `/dashboard/${restaurantId}`, label: 'Dashboard', icon: Home, exact: true },
    { href: `/dashboard/${restaurantId}/tables`, label: terms.units, icon: unitIcon, exact: false },
    { href: `/dashboard/${restaurantId}/reservations`, label: terms.bookings, icon: CalendarDays, exact: false },
    { href: `/dashboard/${restaurantId}/customers`, label: 'Customers', icon: BookUser, exact: false },
  ]

  const currentMembership = memberships.find(m => m.restaurant_id === restaurantId)
  const currentRestaurantName = currentMembership?.restaurants?.name || 'Menu'

  const filteredMemberships = useMemo(() => {
    if (!searchQuery) return memberships
    return memberships.filter(m => 
      m.restaurants?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [memberships, searchQuery])

  const maxBrands = specialFeatures['create_restaurant']?.max_brands || 1
  const canEstablishMore = memberships.length < maxBrands || isAdmin // Superadmins can always establish

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
        <Sheet open={open} onOpenChange={(val) => {
          setOpen(val)
          if (!val) {
            setIsPortfolioOpen(false)
            setSearchQuery('')
          }
        }}>
          <SheetTrigger
            render={
              <button
                className={cn(
                  'flex flex-col items-center justify-start flex-1 gap-1.5 transition-all duration-200 relative min-w-[4rem]',
                  isPortfolioOpen || pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports') ? 'text-violet-400' : 'text-slate-500'
                )}
              >
                <Menu
                  className={cn(
                    'w-6 h-6 transition-all duration-300',
                    (isPortfolioOpen || pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports')) && 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                  )}
                  fill={isPortfolioOpen || pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports') ? 'currentColor' : 'none'} 
                />
                <span className={cn(
                  "text-[10px] font-bold tracking-wide transition-colors",
                  (isPortfolioOpen || pathname === '/dashboard/account' || pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/reports')) ? 'text-violet-400' : 'text-slate-500'
                )}>
                  More
                </span>
              </button>
            }
          />
          <SheetContent side="right" className="bg-slate-950/90 backdrop-blur-xl border-slate-800/50 p-0 sm:max-w-xs overflow-hidden">
            <div className="flex flex-col h-full bg-slate-950/40">
              <SheetHeader className="p-6 pb-4 text-left border-b border-slate-800/50">
                <button 
                  onClick={() => setIsPortfolioOpen(!isPortfolioOpen)}
                  className="flex items-center justify-between w-full group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20 group-hover:scale-105 transition-transform">
                      <span className="text-white font-black text-[12px] uppercase">
                        {currentRestaurantName.slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex flex-col text-left">
                      <SheetTitle className="text-white text-base font-black tracking-tight leading-none">
                        {currentRestaurantName}
                      </SheetTitle>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {isPortfolioOpen ? 'Close Portfolio' : 'Switch Brand'}
                      </span>
                    </div>
                  </div>
                  {isPortfolioOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  )}
                </button>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isPortfolioOpen ? (
                  <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* Vercel-style Search */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
                      <input 
                        autoFocus
                        placeholder="Find Brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-11 pr-12 rounded-2xl bg-slate-900 border border-slate-800/50 text-[11px] text-white font-bold placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-800 text-[8px] font-black text-slate-700 uppercase tracking-widest hidden sm:block">
                        Esc
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                       {filteredMemberships.map((m: any) => {
                         const isCurrent = m.restaurant_id === restaurantId
                         return (
                           <Link 
                             key={m.restaurant_id}
                             href={`/dashboard/${m.restaurant_id}`}
                             onClick={() => setOpen(false)}
                             className={cn(
                               "flex items-center justify-between p-4 rounded-2xl border transition-all group/opt",
                               isCurrent 
                                ? "bg-violet-600/10 border-violet-500/20 shadow-inner" 
                                : "bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-800"
                             )}
                           >
                             <div className="flex items-center gap-3">
                               <div className={cn(
                                 "w-9 h-9 rounded-[0.9rem] flex items-center justify-center text-[10px] uppercase font-black transition-all",
                                 isCurrent ? "bg-violet-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-600 group-hover/opt:text-white group-hover/opt:bg-slate-800"
                               )}>
                                 {m.restaurants?.name?.slice(0, 2) || 'RT'}
                               </div>
                               <div className="flex flex-col">
                                 <span className={cn("text-[12px] font-bold tracking-tight", isCurrent ? "text-white" : "text-slate-400 group-hover/opt:text-white")}>
                                   {m.restaurants?.name}
                                 </span>
                                 <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">{m.role}</span>
                               </div>
                             </div>
                             {isCurrent && <Check className="w-4 h-4 text-violet-400" />}
                           </Link>
                         )
                       })}
                    </div>

                    {/* Establishment Trigger (Vercel style at bottom) */}
                    {isSpecialAdmin && canEstablishMore && (
                      <div className="pt-4 mt-4 border-t border-slate-900">
                        <Link 
                          href="/setup/new"
                          onClick={() => setOpen(false)}
                          className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 hover:border-violet-500/40 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-violet-600/5 group/new"
                        >
                          <PlusCircle className="w-5 h-5 group-hover/new:rotate-90 transition-transform duration-500" />
                          Establish Brand
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-1.5 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <MenuLink 
                      href={`/dashboard/${restaurantId}/reports`} 
                      icon={BarChart3} 
                      label="Reports" 
                      active={pathname.startsWith(`/dashboard/${restaurantId}/reports`)} 
                      onClick={() => setOpen(false)}
                    />
                    {isAdmin && (
                      <MenuLink 
                        href={`/dashboard/${restaurantId}/staff`} 
                        icon={Users} 
                        label="Staff" 
                        active={pathname.startsWith(`/dashboard/${restaurantId}/staff`)} 
                        onClick={() => setOpen(false)}
                      />
                    )}

                    <MenuLink 
                      href={`/dashboard/${restaurantId}/account`} 
                      icon={UserCircle} 
                      label="Settings" 
                      active={pathname.startsWith(`/dashboard/${restaurantId}/account`)} 
                      onClick={() => setOpen(false)}
                    />

                    <div className="pt-6 mt-6 border-t border-slate-800/50 px-2 text-center">
                      <form action={logout}>
                        <button
                          type="submit"
                          onClick={() => setOpen(false)}
                          className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm border border-transparent hover:border-red-500/20"
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-900/10 border-t border-slate-900/50 flex flex-col gap-1 items-center">
                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.2em]">
                  BookJM
                </p>
                <p className="text-[9px] text-slate-800 font-semibold tracking-wider italic">
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

function MenuLink({ href, icon: Icon, label, active, onClick, className }: { href: string; icon: any; label: string; active: boolean; onClick: () => void; className?: string }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm relative group overflow-hidden border",
        active
          ? "bg-violet-600/10 text-violet-400 border-violet-500/20 shadow-[inset_0_0_12px_rgba(139,92,246,0.05)]"
          : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-white",
        className
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
