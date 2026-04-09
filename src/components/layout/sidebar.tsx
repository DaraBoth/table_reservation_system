'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSidebar } from './sidebar-provider'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import { 
  LogOut, 
  LayoutDashboard, 
  Utensils, 
  Users, 
  Grid2X2,
  CalendarDays, 
  Settings2,
  ShieldCheck,
  BookUser,
  BarChart3,
  UserCircle,
  Plus,
  Loader2
} from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { login } from '@/app/actions/auth'
import { toast } from 'sonner'


interface SidebarProps {
  user: {
    email: string | undefined
    name: string
  }
  avatarUrl?: string | null
  role: string
  brandName: string
  type: 'superadmin' | 'dashboard'
  isAdmin?: boolean
  isStaff?: boolean
  restaurantId?: string
  activeSlug?: string
  businessType?: BusinessType
  memberships?: any[]
  isSpecialAdmin?: boolean
  specialFeatures?: Record<string, any>
  logoUrl?: string
}

export function Sidebar({ 
  user, 
  avatarUrl,
  role, 
  brandName, 
  type, 
  isAdmin,
  isStaff,
  restaurantId,
  activeSlug,
  businessType = 'restaurant',
  memberships = [],
  isSpecialAdmin = false,
  specialFeatures = {},
  logoUrl = ''
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  
  const dashSlug = activeSlug || restaurantId
  const terms = getTerms(businessType)

  useEffect(() => {
    setIsMounted(true)
    const stored = JSON.parse(localStorage.getItem('bookjm_saved_accounts') || '[]')
    // Filter out the current user from the "other accounts" list
    const currentEmail = user.email
    setSavedAccounts(stored.filter((acc: any) => 
      acc.identifier !== currentEmail && 
      acc.identifier !== currentEmail?.split('@')[0]
    ))
  }, [user.email])

  const handleAccountSwitch = (account: any) => {
    setSwitchingId(account.identifier)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('identifier', account.identifier)
      formData.append('password', account.password)
      
      const res = await login(null, formData)
      if (res?.error) {
        toast.error(`${res.error} (Saved password may have changed)`)
        setSwitchingId(null)
      } else if (res?.success && res.url) {
        window.location.href = res.url // Force reload to sync new session
      }
    })
  }

  // Grouped Navigation Items
  const navGroups = type === 'superadmin' 
    ? [
        {
          label: 'System',
          items: [
            { href: '/superadmin', label: 'Overview', icon: LayoutDashboard },
            { href: '/superadmin/restaurants', label: 'Restaurants', icon: Utensils },
            { href: '/superadmin/users', label: 'User Management', icon: Users },
            { href: '/superadmin/admins', label: 'Admin Accounts', icon: ShieldCheck },
          ]
        }
      ]
    : [
        {
          label: 'Operations',
          items: [
            { href: `/dashboard/${dashSlug}`, label: 'Overview', icon: LayoutDashboard },
            { href: `/dashboard/${dashSlug}/units`, label: terms.units, icon: Grid2X2 },
            { href: `/dashboard/${dashSlug}/reservations`, label: terms.bookings, icon: CalendarDays },
            { href: `/dashboard/${dashSlug}/customers`, label: 'Customers', icon: BookUser },
            { href: `/dashboard/${dashSlug}/reports`, label: 'Reports', icon: BarChart3 },
          ]
        },
        ...(isAdmin || isStaff ? [
          {
            label: 'Configuration',
            items: [
              { href: `/dashboard/${dashSlug}/units/manage`, label: `Manage ${terms.units}`, icon: Settings2 },
              ...(isAdmin ? [
                { href: `/dashboard/${dashSlug}/staff`, label: 'Staff Management', icon: Users },
              ] : []),
            ]
          }
        ] : []),
        {
          label: 'System',
          items: [
            { href: `/dashboard/${dashSlug}/account`, label: 'Account Settings', icon: UserCircle },
          ]
        }
      ]

  if (!isMounted) return <aside className="w-64 bg-background border-r border-border" />

  return (
    <aside 
      className={cn(
        "relative flex flex-col bg-card/40 backdrop-blur-xl border-r border-border/60 transition-all duration-300 ease-in-out group z-40 hidden md:flex h-full",
        isCollapsed ? "w-20" : "w-66"
      )}
    >

      {/* Modern Top Header with User Profile & Switcher */}
      <div className={cn("p-4 flex flex-col gap-4 overflow-hidden transition-all duration-300", isCollapsed ? "items-center" : "")}>
        
        {/* Active User Section */}
        <div className="flex items-center gap-3 group/profile">
          <div className="relative flex-shrink-0">
            <div className={cn(
              "w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-500/20 overflow-hidden ring-2 ring-violet-500/20 transition-transform duration-300",
              !isCollapsed && "group-hover/profile:scale-105"
            )}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xs">{user.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-black text-foreground text-sm tracking-tight truncate">{user.name}</span>
              <span className="text-[10px] uppercase tracking-widest font-black text-violet-500">{role}</span>
            </div>
          )}
        </div>

        {/* Multi-Account Switcher (Avatars Row) */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
            {savedAccounts.slice(0, 3).map((account) => (
              <button
                key={account.identifier}
                onClick={() => handleAccountSwitch(account)}
                disabled={isPending}
                className="relative group/acc w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 overflow-hidden"
                title={`Switch to ${account.name}`}
              >
                {switchingId === account.identifier ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                ) : account.avatar ? (
                  <img src={account.avatar} alt={account.name} className="w-full h-full object-cover grayscale group-hover/acc:grayscale-0 transition-all" />
                ) : (
                  <span className="text-[9px] font-black">{account.name.slice(0, 2).toUpperCase()}</span>
                )}
              </button>
            ))}
            
            {/* Add Account Button (Facebook Style) */}
            <Link 
              href="/login"
              className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-500 hover:bg-violet-600/20 transition-all hover:scale-110 active:scale-95 group/add"
              title="Add another account"
            >
              <Plus className="w-4 h-4 transition-transform group-hover/add:rotate-90" />
            </Link>
          </div>
        )}
      </div>

      <div className="h-px bg-border/40 mx-4 mb-2" />

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar pt-2">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 mb-2 animate-in fade-in slide-in-from-left-1 duration-400">
                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                  {group.label}
                </span>
              </div>
            )}
            
            <div className="space-y-1">
              {(() => {
                const allHrefs = navGroups.flatMap(g => g.items.map(i => i.href))
                return group.items.map((item) => {
                  const isActive = pathname === item.href || (
                    pathname.startsWith(item.href) && 
                    !allHrefs.some(h => h !== item.href && h.startsWith(item.href) && pathname.startsWith(h))
                  )
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/nav text-nowrap",
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
                })
              })()}
            </div>
          </div>
        ))}
      </nav>

      {/* Clean Bottom Section: Logout Only */}
      <div className="p-4 border-t border-border/40 mt-auto bg-card/20 backdrop-blur-sm">
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}
