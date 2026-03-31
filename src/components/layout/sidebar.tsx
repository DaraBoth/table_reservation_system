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
}

export function Sidebar({ user, role, brandName, type, isAdmin }: SidebarProps) {
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
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/reservations', label: 'Reservations', icon: Calendar },
        { href: '/dashboard/tables', label: 'Tables', icon: TableIcon },
        ...(isAdmin ? [
          { href: '/dashboard/staff', label: 'Staff', icon: Users },
        ] : []),
        { href: '/dashboard/account', label: 'Account', icon: Settings },
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

  if (!isMounted) return <aside className="w-64 bg-slate-950 border-r border-slate-800" />

  return (
    <aside 
      className={cn(
        "relative flex flex-col bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/60 transition-all duration-300 ease-in-out group z-40",
        isCollapsed ? "w-20" : "w-66"
      )}
    >
      {/* Toggle Button */}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Brand Header */}
      <div className={cn("p-6 flex items-center gap-3 overflow-hidden transition-all duration-300", isCollapsed ? "justify-center" : "")}>
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
          <span className="text-white font-black text-xs tracking-tighter">TB</span>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300 text-nowrap">
            <span className="font-bold text-white text-base tracking-tight">{brandName}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">{role}</span>
            </div>
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
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform duration-300 group-hover/nav:scale-110 flex-shrink-0",
                  isActive ? "text-violet-400" : "text-slate-500 group-hover/nav:text-slate-300"
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
      <div className="p-4 border-t border-slate-800/40 mt-auto">
        <div className={cn("flex items-center gap-3 mb-4 rounded-2xl p-2 bg-slate-800/20 hover:bg-slate-800/40 transition-colors cursor-default overflow-hidden", isCollapsed ? "justify-center p-1" : "")}>
          <div className={cn("h-9 w-9 border-2 border-slate-800 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-slate-900 flex-shrink-0", isCollapsed ? "h-8 w-8" : "")}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-xs font-bold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 truncate mt-0.5 tracking-tight font-medium">{user.email}</span>
            </div>
          )}
        </div>
        
        <form action={logout}>
          <Button 
            type="submit" 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"}
            className={cn(
              "w-full text-slate-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all",
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
