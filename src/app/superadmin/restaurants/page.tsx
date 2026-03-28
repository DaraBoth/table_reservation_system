import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { Restaurant } from '@/lib/types/database'

export const metadata = { title: 'Restaurants — Superadmin' }

export default async function RestaurantsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  const restaurants = (raw ?? []) as Restaurant[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Restaurants</h1>
          <p className="text-slate-400 text-sm mt-1">{restaurants.length} tenants registered</p>
        </div>
        <Link href="/superadmin/restaurants/new"
          className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25')}>
          + New Restaurant
        </Link>
      </div>

      <div className="grid gap-4">
        {restaurants.map((r) => {
          const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
          const expireDate = r.subscription_expires_at ? new Date(r.subscription_expires_at).toLocaleDateString() : 'No expiry'
          return (
            <Card key={r.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-white">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.contact_email || '—'} · {r.address || '—'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Subscription: <span className={isExpired ? 'text-red-400' : 'text-slate-300'}>{expireDate}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isExpired ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>
                    ) : (
                      <Badge className={r.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400'}>
                        {r.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    )}
                    <Link href={`/superadmin/restaurants/${r.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800')}>
                      Manage →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {!restaurants.length && (
          <Card className="bg-slate-900/50 border-slate-800 border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-slate-500 mb-4">No restaurants yet</p>
              <Link href="/superadmin/restaurants/new"
                className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 border-0')}>
                Create your first restaurant
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
