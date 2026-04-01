import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, ArrowRight, ShieldCheck } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'Restaurants — Superadmin' }

export default async function RestaurantsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('restaurants')
    .select('*, account_memberships(role, profiles(full_name))')
    .order('created_at', { ascending: false })

  const restaurants = (raw ?? []) as any[]
  const activeCount = restaurants.filter(r => r.is_active).length

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Restaurants</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {restaurants.length} registered · <span className="text-emerald-400 font-bold">{activeCount} active</span>
          </p>
        </div>
        <Link
          href="/superadmin/restaurants/new"
          className="flex items-center gap-2 h-11 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Restaurant
        </Link>
      </div>

      {/* Cards */}
      {restaurants.length > 0 ? (
        <div className="space-y-3">
          {restaurants.map((r) => {
            const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
            const expireDate = r.subscription_expires_at
              ? new Date(r.subscription_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'No expiry'
            const leadAdmin = r.account_memberships?.find((m: any) => m.role === 'admin')?.profiles?.full_name || 'No admin'

            return (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                {/* Top row */}
                <div className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-base font-black text-white flex-shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-black text-white">{r.name}</p>
                      <Badge className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-lg border',
                        isExpired ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : r.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      )}>
                        {isExpired ? 'Expired' : r.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ShieldCheck className="w-3 h-3 text-violet-400 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate">Admin: {leadAdmin}</p>
                    </div>
                  </div>
                </div>

                {/* Detail row */}
                <div className="border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    {r.contact_email && <span>{r.contact_email}</span>}
                    {r.address && <span>{r.address}</span>}
                    <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-400'}>
                      Subscription: {expireDate}
                    </span>
                  </div>
                  <Link
                    href={`/superadmin/restaurants/${r.id}`}
                    className="flex items-center gap-1 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                  >
                    Manage <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-slate-300 font-bold mb-1">No restaurants yet</p>
          <p className="text-slate-500 text-sm mb-6">Create the first restaurant to get started</p>
          <Link
            href="/superadmin/restaurants/new"
            className="inline-flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Create First Restaurant
          </Link>
        </div>
      )}
    </div>
  )
}
