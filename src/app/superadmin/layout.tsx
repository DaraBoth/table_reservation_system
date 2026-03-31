import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { AccountMembership, Profile } from '@/lib/types/database'

const navItems = [
  { href: '/superadmin', label: 'Overview', icon: '⊞' },
  { href: '/superadmin/restaurants', label: 'Restaurants', icon: '🏢' },
  { href: '/superadmin/users', label: 'User Management', icon: '👥' },
  { href: '/superadmin/admins', label: 'Admin Accounts', icon: '👤' },
]

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Pick<AccountMembership, 'role'> | null
  if (membership?.role !== 'superadmin') redirect('/dashboard')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Pick<Profile, 'full_name'> | null
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Superadmin'

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-white font-bold text-sm">TB</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">TableBook</p>
              <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                Superadmin
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-150 text-sm font-medium"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-violet-600 text-white text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm"
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800 justify-start">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
