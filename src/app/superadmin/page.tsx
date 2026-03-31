import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'
import { 
  Store, 
  ShieldCheck, 
  Calendar, 
  Activity, 
  Plus, 
  ArrowRight, 
  AlertTriangle,
  LayoutDashboard,
  Users,
  Clock,
  ExternalLink,
  Zap,
  UserPlus
} from 'lucide-react'
import type { Restaurant } from '@/lib/types/database'

export const metadata = { title: 'Superadmin Dashboard — TableBook' }

export default async function SuperadminPage() {
  const supabase = await createClient()

  // Fetch restaurants with their lead admin
  const { data: restaurantsRaw } = await supabase
    .from('restaurants')
    .select('*, account_memberships(role, profiles(full_name))')
    .order('created_at', { ascending: false })

  // Fetch count of admins
  const { count: totalAdmins } = await supabase
    .from('account_memberships').select('*', { count: 'exact', head: true }).eq('role', 'admin')

  // Fetch count of reservations
  const { count: totalReservations } = await supabase
    .from('reservations').select('*', { count: 'exact', head: true }).neq('status', 'cancelled')

  // Fetch recent platform activity
  const { data: recentActivity } = await supabase
    .from('account_memberships')
    .select('role, created_at, profiles(full_name), restaurants(name)')
    .order('created_at', { ascending: false })
    .limit(6)

  const list = (restaurantsRaw ?? []) as any[]
  const activeRestaurants = list.filter(r => r.is_active)
  const expiredRestaurants = list.filter(r =>
    r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
  )

  const stats = [
    { label: 'Total Restaurants', value: list.length, icon: Store, color: 'from-violet-600 to-indigo-600', glow: 'shadow-violet-500/20' },
    { label: 'Active Sites', value: activeRestaurants.length, icon: Activity, color: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-500/20' },
    { label: 'Platform Admins', value: totalAdmins ?? 0, icon: ShieldCheck, color: 'from-amber-600 to-orange-600', glow: 'shadow-amber-500/20' },
    { label: 'Total Bookings', value: totalReservations ?? 0, icon: Calendar, color: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-500/20' },
  ]

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-900/20 p-8 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-sm shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-violet-400" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Platform Command</h1>
          </div>
          <p className="text-slate-400 font-medium text-lg">Real-time surveillance and tenant infrastructure management.</p>
        </div>
        <Link href="/superadmin/restaurants/new"
          className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-2xl shadow-violet-500/40 px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]')}>
          <Plus className="h-5 w-5 mr-3" />
          Provision New Instance
        </Link>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.label} 
              className={cn(
                "bg-slate-900/40 backdrop-blur-xl border-slate-800/60 overflow-hidden relative group hover:border-slate-700 transition-all duration-500 hover:-translate-y-2 shadow-2xl",
                stat.glow
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", stat.color)} />
              <CardContent className="p-8 relative">
                <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center mb-6 bg-gradient-to-br opacity-90 shadow-lg", stat.color)}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-black text-white tabular-nums tracking-tighter mb-2 group-hover:scale-110 transition-transform duration-500 origin-left">{stat.value}</div>
                <div className="text-xs uppercase font-black tracking-[0.2em] text-slate-500">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid xl:grid-cols-6 gap-8">
        {/* Detailed Tenant Inventory */}
        <Card className="xl:col-span-4 bg-slate-900/40 backdrop-blur-xl border-slate-800/60 shadow-3xl overflow-hidden rounded-[2.5rem]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/40 p-8">
            <div>
              <CardTitle className="text-white text-2xl font-black tracking-tight underline decoration-violet-500/50 underline-offset-8 decoration-4">Tenant Inventory</CardTitle>
              <p className="text-slate-500 text-xs mt-4 uppercase tracking-[0.2em] font-black">Live Performance & Admin Governance</p>
            </div>
            <Link href="/superadmin/restaurants"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl px-6 h-10 border border-slate-800/60 font-bold')}>
              Full Ledger <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              {list.slice(0, 10).map((r) => {
                const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
                // Extract lead admin
                const leadAdmin = r.account_memberships?.find((m: any) => m.role === 'admin')?.profiles?.full_name || 'Unassigned'
                
                return (
                  <Link key={r.id} href={`/superadmin/restaurants/${r.id}`} className="block group">
                    <div className="flex items-center justify-between p-4 rounded-3xl group-hover:bg-slate-800/40 border border-transparent group-hover:border-slate-700/50 transition-all duration-300">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-sm font-black text-slate-500 group-hover:text-white group-hover:border-slate-500 transition-all shadow-xl group-hover:shadow-violet-500/10">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-lg font-black text-white group-hover:text-violet-400 transition-colors tracking-tight">{r.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-slate-500 tracking-tight">{r.slug}.tablebook.app</span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-violet-400/80 bg-violet-400/5 px-2 py-0.5 rounded-md">
                              <ShieldCheck className="h-3 w-3" />
                              Admin: {leadAdmin}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          {isExpired ? (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">Terminated</Badge>
                          ) : (
                            <Badge className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full",
                              r.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                            )}>
                              {r.is_active ? 'Active' : 'Suspended'}
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-800 group-hover:text-violet-500 transition-all group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Intelligence & Recent Activity Feed */}
        <div className="xl:col-span-2 space-y-8">
          {/* Recent Platform Activity */}
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/60 shadow-3xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="border-b border-slate-800/40 p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-white font-black text-xl tracking-tight">Recent Activity</CardTitle>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">Live Events Ledger</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {recentActivity?.map((activity, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-3xl bg-slate-800/20 border border-slate-800/40 group hover:border-slate-700 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {activity.role === 'admin' ? <UserPlus className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {activity.profiles?.full_name || 'System'} <span className="text-slate-500 font-medium">joined as</span> {activity.role}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight">
                      For <span className="text-slate-400">{activity.restaurants?.name || 'Platform'}</span> • {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <div className="p-10 text-center space-y-4">
                  <Clock className="h-10 w-10 text-slate-700 mx-auto" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No recent events logged</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operational Health (Optimized) */}
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/60 shadow-3xl p-8 rounded-[2.5rem]">
            <h3 className="text-white font-black text-xl mb-6 tracking-tight flex items-center gap-3 font-black underline underline-offset-8 decoration-emerald-500/50">
              <Activity className="h-5 w-5 text-emerald-400" />
              Infrastructure
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Edge Network', status: 'Optimal', color: 'bg-emerald-500' },
                { label: 'Cloud DB', status: 'In Sync', color: 'bg-emerald-500' },
                { label: 'Auth Gateway', status: 'Secured', color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{item.label}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full w-full animate-pulse opacity-80", item.color)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-800/40 flex justify-between items-center">
              <Link href="/superadmin/users" 
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                <Users className="h-4 w-4" /> Global Users Area
              </Link>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">System Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
