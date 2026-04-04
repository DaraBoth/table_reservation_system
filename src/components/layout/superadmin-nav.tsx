'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard,
  Utensils,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

interface SuperadminNavProps {
  userName: string
  userEmail?: string
}

const NAV_ITEMS = [
  { href: '/superadmin',             label: 'Overview',       icon: LayoutDashboard },
  { href: '/superadmin/restaurants', label: 'Restaurants',    icon: Utensils },
  { href: '/superadmin/users',       label: 'Users',          icon: Users },
  { href: '/superadmin/admins',      label: 'Admin Accounts', icon: ShieldCheck },
]

export function SuperadminNav({ userName, userEmail }: SuperadminNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === '/superadmin'
            ? pathname === '/superadmin'
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all',
              isActive
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
            )}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-violet-400' : 'text-muted-foreground')} />
            {item.label}
            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card/60 backdrop-blur-xl border-r border-border/60 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 p-6 border-b border-border/60">
          <div className="relative w-10 h-10 overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="TableBook Logo" fill className="object-cover" />
          </div>
          <div>
            <p className="text-foreground font-bold text-sm">TableBook</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Superadmin</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLinks />
        </nav>

        {/* User + Sign out */}
        <div className="p-3 border-t border-border/60 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{userName}</p>
              {userEmail && <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>}
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-semibold">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 overflow-hidden">
            <Image src="/logo.png" alt="TableBook Logo" fill className="object-cover" />
          </div>
          <span className="text-foreground font-bold text-sm">Superadmin</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted border border-border text-foreground/70"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Drawer panel */}
          <div className="relative ml-auto w-72 h-full bg-background border-l border-border flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 overflow-hidden">
                  <Image src="/logo.png" alt="TableBook Logo" fill className="object-cover" />
                </div>
                <span className="text-foreground font-bold text-sm">TableBook</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <NavLinks onClick={() => setOpen(false)} />
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border space-y-1">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/40">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-foreground font-bold text-xs">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                  {userEmail && <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>}
                </div>
              </div>
              <form action={logout}>
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-semibold">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
