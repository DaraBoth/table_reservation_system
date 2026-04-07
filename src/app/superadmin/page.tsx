import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Store, ShieldCheck, CalendarDays, Activity,
  Plus, ArrowRight, Zap, UserPlus, Clock,
  Users, LayoutDashboard,
} from 'lucide-react'

export const metadata = { title: 'Superadmin — TableBook' }

export default async function SuperadminPage() {
  const supabase = await createClient()

  const { data: restaurantsRaw } = await supabase
    .from('restaurants')
    .select('*, account_memberships(role, profiles(full_name))')
    .order('created_at', { ascending: false })

  const { count: totalAdmins } = await supabase
    .from('account_memberships').select('*', { count: 'exact', head: true }).eq('role', 'admin')

  const { count: totalReservations } = await supabase
    .from('reservations').select('*', { count: 'exact', head: true }).neq('status', 'cancelled')

  const { data: recentActivity } = await supabase
    .from('account_memberships')
    .select('role, created_at, profiles(full_name), restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const list = (restaurantsRaw ?? []) as any[]
  const activeCount = list.filter(r => r.is_active).length

  const stats = [
    { label: 'Restaurants', value: list.length,          icon: Store,      color: 'from-violet-600 to-indigo-600', bg: 'bg-violet-500/10',  text: 'text-violet-400' },
    { label: 'Active Sites', value: activeCount,          icon: Activity,   color: 'from-emerald-600 to-teal-600',  bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    { label: 'Admins',       value: totalAdmins ?? 0,     icon: ShieldCheck,color: 'from-amber-600 to-orange-600',  bg: 'bg-amber-500/10',   text: 'text-amber-400' },
    { label: 'Bookings',     value: totalReservations ?? 0,icon: CalendarDays,  color: 'from-blue-600 to-cyan-600',     bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  ]

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-violet-400" />
            <h1 className="text-2xl font-black text-foreground">Platform Overview</h1>
          </div>
          <p className="text-muted-foreground text-sm">Manage all restaurants and users from here.</p>
        </div>
        <Link
          href="/superadmin/restaurants/new"
          className="flex items-center gap-2 h-11 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-foreground rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Restaurant
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
                <Icon className={cn('w-5 h-5', s.text)} />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Two-column grid on larger screens */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Restaurant list — takes 3 columns */}
        <div className="lg:col-span-3 bg-card border border-border rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-base font-black text-foreground">All Restaurants</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{list.length} registered</p>
            </div>
            <Link
              href="/superadmin/restaurants"
              className="text-xs text-violet-400 font-bold hover:text-violet-300 flex items-center gap-1"
            >
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {list.slice(0, 8).map((r) => {
              const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
              const leadAdmin = r.account_memberships?.find((m: any) => m.role === 'admin')?.profiles?.full_name || 'No admin'
              return (
                <Link
                  key={r.id}
                  href={`/superadmin/restaurants/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-sm font-black text-muted-foreground group-hover:text-foreground group-hover:border-border transition-all flex-shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-violet-300 transition-colors">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{leadAdmin}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-lg border hidden sm:inline-flex',
                      isExpired ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : r.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    )}>
                      {isExpired ? 'Expired' : r.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              )
            })}
            {list.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground text-sm">No restaurants yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column — takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-base font-black text-foreground">Recent Activity</h2>
            </div>
            <div className="p-3 space-y-1">
              {recentActivity?.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                    {a.role === 'admin' ? <UserPlus className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {(a as any).profiles?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(a as any).restaurants?.name || 'Platform'} · {a.role}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">No recent events</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-3xl p-4 space-y-2">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-2 mb-3">Quick Links</p>
            {[
              { href: '/superadmin/users',  label: 'User Management',  icon: Users,      color: 'text-blue-400'   },
              { href: '/superadmin/admins', label: 'Admin Accounts',   icon: ShieldCheck,color: 'text-amber-400'  },
              { href: '/superadmin/restaurants/new', label: 'New Restaurant', icon: Store, color: 'text-violet-400' },
            ].map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-muted/60 transition-colors group"
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', link.color)} />
                  <span className="text-sm font-semibold text-foreground/70 group-hover:text-foreground transition-colors">{link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 ml-auto group-hover:text-muted-foreground transition-colors" />
                </Link>
              )
            })}
          </div>

          {/* System status */}
          <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-foreground">System Status</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Edge Network', status: 'Online' },
                { label: 'Database',     status: 'In Sync' },
                { label: 'Auth Gateway', status: 'Secured' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-bold">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
