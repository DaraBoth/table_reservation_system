import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { AccountMembership, Profile } from '@/lib/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(name)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as (AccountMembership & { restaurants: { name: string } | null }) | null
  if (!membership) redirect('/login')
  if (membership.role === 'superadmin') redirect('/superadmin')

  const { data: profileRaw } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const profile = profileRaw as Pick<Profile, 'full_name'> | null

  const isAdmin = membership.role === 'admin'
  const restaurantName = membership.restaurants?.name ?? 'Restaurant'
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/dashboard/reservations', label: 'Reservations', icon: '📅' },
    ...(isAdmin ? [
      { href: '/dashboard/tables', label: 'Tables', icon: '🪑' },
      { href: '/dashboard/staff', label: 'Staff', icon: '👥' },
    ] : []),
    { href: '/dashboard/account', label: 'Account', icon: '⚙️' },
  ]

  const roleColor = isAdmin
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{restaurantName}</p>
              <Badge variant="secondary" className={`text-xs capitalize ${roleColor}`}>{membership.role}</Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-150 text-sm font-medium">
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-600 text-white text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{membership.role}</p>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white hover:bg-slate-800 justify-start">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
