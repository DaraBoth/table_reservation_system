'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  LayoutDashboard, 
  Utensils, 
  Users, 
  Calendar, 
  Table as TableIcon,
  Settings,
  ShieldCheck
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface SidebarProps {
  user: {
    email: string | undefined
    name: string
  }
  role: string
  brandName: string
  type: 'superadmin' | 'dashboard'
  isAdmin?: boolean
  restaurantId?: string
  memberships?: any[]
  isSpecialAdmin?: boolean
  specialFeatures?: Record<string, any>
}

export function Sidebar({ 
  user, 
  role, 
  brandName, 
  type, 
  isAdmin,
  restaurantId,
  memberships = [],
  isSpecialAdmin = false,
  specialFeatures = {}
}: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Define nav items locally to avoid serialization issues
  const navItems = type === 'superadmin' 
    ? [
        { href: '/superadmin', label: 'Overview', icon: LayoutDashboard },
        { href: '/superadmin/restaurants', label: 'Restaurants', icon: Utensils },
        { href: '/superadmin/users', label: 'User Management', icon: Users },
        { href: '/superadmin/admins', label: 'Admin Accounts', icon: ShieldCheck },
      ]
    : [
        { href: `/dashboard/${restaurantId}`, label: 'Overview', icon: LayoutDashboard },
        { href: `/dashboard/${restaurantId}/reservations`, label: 'Reservations', icon: Calendar },
        { href: `/dashboard/${restaurantId}/tables`, label: 'Tables', icon: TableIcon },
        ...(isAdmin ? [
          { href: `/dashboard/${restaurantId}/staff`, label: 'Staff', icon: Users },
        ] : []),
        { href: `/dashboard/${restaurantId}/account`, label: 'Account', icon: Settings },
      ]

  // Persist state to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
    setIsMounted(true)
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  if (!isMounted) return <aside className="w-64 bg-background border-r border-border" />

  return (
    <aside 
      className={cn(
        "relative flex flex-col bg-card/40 backdrop-blur-xl border-r border-border/60 transition-all duration-300 ease-in-out group z-40",
        isCollapsed ? "w-20" : "w-66"
      )}
    >
      {/* Toggle Button */}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Brand Header & Switcher */}
      <div className={cn("p-4 flex flex-col gap-2 overflow-hidden transition-all duration-300", isCollapsed ? "items-center" : "")}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <span className="text-foreground font-black text-xs tracking-tighter">TB</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-bold text-foreground text-sm tracking-tight truncate">{brandName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground">{role}</span>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Switcher (Only in Dashboard mode) */}
        {!isCollapsed && type === 'dashboard' && (memberships.length > 1 || isSpecialAdmin) && (
          <div className="mt-2 grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-400">
            <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 px-1">Portfolio</div>
            
            {/* Filtered memberships to show other brands */}
            {memberships.filter(m => m.restaurant_id !== restaurantId).map((m: any) => (
              <Link 
                key={m.restaurant_id}
                href={`/dashboard/${m.restaurant_id}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/50 border border-border/30 transition-all group/brand"
              >
                <div className="w-6 h-6 rounded-md bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground group-hover/brand:text-foreground group-hover/brand:bg-violet-600/20 transition-colors uppercase font-black">
                  {m.restaurants?.name?.slice(0, 2) || 'RT'}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover/brand:text-foreground/70 truncate">{m.restaurants?.name}</span>
              </Link>
            ))}

            {/* Create Brand Trigger for Special Admins */}
            {isSpecialAdmin && !!specialFeatures['create_restaurant'] && (
              <Link 
                href={`/dashboard/${restaurantId}/setup/new`}
                className="flex items-center gap-2 p-2 rounded-lg bg-violet-600/5 hover:bg-violet-600/10 border border-violet-500/20 transition-all border-dashed group/new mt-1"
              >
                <div className="w-6 h-6 rounded-md bg-violet-600 text-foreground flex items-center justify-center text-[10px] font-black">
                   +
                </div>
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-tight">Establish Brand</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/superadmin' && item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group/nav text-nowrap",
                isActive 
                  ? "bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-[inset_0_0_12px_rgba(139,92,246,0.05)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform duration-300 group-hover/nav:scale-110 flex-shrink-0",
                  isActive ? "text-violet-400" : "text-muted-foreground group-hover/nav:text-foreground/70"
                )} 
              />
              {!isCollapsed && (
                <span className="text-sm font-semibold tracking-wide animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User & Sign Out */}
      <div className="p-4 border-t border-border/40 mt-auto">
        <div className={cn("flex items-center gap-3 mb-4 rounded-2xl p-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-default overflow-hidden", isCollapsed ? "justify-center p-1" : "")}>
          <div className={cn("h-9 w-9 border-2 border-border rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-foreground text-[10px] flex items-center justify-center font-bold ring-2 ring-card flex-shrink-0", isCollapsed ? "h-8 w-8" : "")}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-xs font-bold text-foreground truncate">{user.name}</span>
              <span className="text-[10px] text-muted-foreground truncate mt-0.5 tracking-tight font-medium">{user.email}</span>
            </div>
          )}
        </div>
        
        <form action={logout}>
          <Button 
            type="submit" 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all",
              isCollapsed ? "justify-center" : "justify-start gap-3 px-3 h-10 rounded-xl"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Sign out</span>}
          </Button>
        </form>
      </div>
    </aside>
  )
}
