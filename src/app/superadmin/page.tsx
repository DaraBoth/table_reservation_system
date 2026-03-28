import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Restaurant } from '@/lib/types/database'

export const metadata = { title: 'Superadmin Dashboard — TableBook' }

export default async function SuperadminPage() {
  const supabase = await createClient()

  const { data: restaurantsRaw } = await supabase
    .from('restaurants').select('*').order('created_at', { ascending: false })

  const { count: totalAdmins } = await supabase
    .from('account_memberships').select('*', { count: 'exact', head: true }).eq('role', 'admin')

  const { count: totalReservations } = await supabase
    .from('reservations').select('*', { count: 'exact', head: true }).neq('status', 'cancelled')

  const list = (restaurantsRaw ?? []) as Restaurant[]
  const activeRestaurants = list.filter(r => r.is_active)
  const expiredRestaurants = list.filter(r =>
    r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
  )

  const stats = [
    { label: 'Total Restaurants', value: list.length, icon: '🏢', color: 'from-violet-600 to-indigo-600' },
    { label: 'Active Restaurants', value: activeRestaurants.length, icon: '✅', color: 'from-emerald-600 to-teal-600' },
    { label: 'Admin Accounts', value: totalAdmins ?? 0, icon: '👤', color: 'from-amber-600 to-orange-600' },
    { label: 'Total Reservations', value: totalReservations ?? 0, icon: '📅', color: 'from-blue-600 to-cyan-600' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Overview</h1>
          <p className="text-slate-400 mt-1">Manage all restaurants and subscriptions</p>
        </div>
        <Link href="/superadmin/restaurants/new"
          className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25')}>
          + New Restaurant
        </Link>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800 overflow-hidden relative group hover:border-slate-700 transition-colors">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <CardContent className="p-6 relative">
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expired Subscriptions Alert */}
      {expiredRestaurants.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-400 text-base flex items-center gap-2">
              ⚠️ Expired Subscriptions ({expiredRestaurants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredRestaurants.map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{r.name}</span>
                  <Link href={`/superadmin/restaurants/${r.id}`}>
                    <Badge variant="outline" className="text-amber-400 border-amber-500/40 cursor-pointer text-xs">
                      Renew
                    </Badge>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restaurants List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">All Restaurants</CardTitle>
          <Link href="/superadmin/restaurants"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-slate-400 hover:text-white')}>
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {list.slice(0, 8).map((r) => {
              const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
              const expiresIn = r.subscription_expires_at
                ? Math.ceil((new Date(r.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null
              return (
                <Link key={r.id} href={`/superadmin/restaurants/${r.id}`} className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-white">
                        {r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.contact_email || r.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Expired</Badge>
                      ) : expiresIn !== null && expiresIn <= 7 ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Expires in {expiresIn}d</Badge>
                      ) : (
                        <Badge className={`text-xs ${r.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                          {r.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
            {!list.length && (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-4">No restaurants yet</p>
                <Link href="/superadmin/restaurants/new"
                  className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 border-0')}>
                  Create your first restaurant
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
