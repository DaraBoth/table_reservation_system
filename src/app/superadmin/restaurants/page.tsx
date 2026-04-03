import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, ArrowRight, ShieldCheck, Store, MapPin, Building2, Home, UtensilsCrossed, Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'

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
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Properties</h1>
          <p className="text-slate-500 text-sm font-medium">
            {restaurants.length} Registered · <span className="text-emerald-400 font-bold">{activeCount} active</span>
          </p>
        </div>
        <Link
          href="/superadmin/restaurants/new"
          className="flex items-center gap-2 h-12 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-500/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5 border-b border-slate-800">
            <TableRow className="hover:bg-transparent border-none h-12">
              <TableHead className="pl-6 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[240px]">Property</TableHead>
              <TableHead className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Administrator</TableHead>
              <TableHead className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</TableHead>
              <TableHead className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="pr-6 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.map((r) => {
              const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
              const expireDate = r.subscription_expires_at
                ? new Date(r.subscription_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Lifetime'
              const leadAdmin = r.account_memberships?.find((m: any) => m.role === 'admin')?.profiles?.full_name || 'Unassigned'
              
              const businessType = r.business_type || 'restaurant'
              const TypeIcon = businessType === 'hotel' ? Building2 : businessType === 'guesthouse' ? Home : UtensilsCrossed

              return (
                <TableRow key={r.id} className="hover:bg-white/[0.02] border-slate-800 transition-colors h-16 group">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-xl border border-slate-800 group-hover:border-violet-500/50 transition-colors shadow-lg">
                         <AvatarFallback className="bg-slate-800 text-slate-500 font-black text-[10px] uppercase">{r.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-white group-hover:text-violet-400 transition-colors leading-tight italic truncate">{r.name}</span>
                        <div className="flex items-center gap-1 mt-0.5 opacity-60">
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight truncate">{r.slug}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight truncate max-w-[120px]">{leadAdmin}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center",
                        businessType === 'hotel' ? "bg-blue-500/10 text-blue-400" : businessType === 'guesthouse' ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                      )}>
                        <TypeIcon className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{businessType}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <Badge className={cn(
                        'text-[8px] font-black border px-2 py-0.5 rounded-lg uppercase tracking-widest',
                        isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                          : r.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      )}>
                        {isExpired ? 'Expired' : r.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                      <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tight opacity-40">{expireDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="pr-6 text-right">
                    <Link
                      href={`/superadmin/restaurants/${r.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        "h-8 px-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group/btn gap-1.5 font-black uppercase tracking-widest text-[9px]"
                      )}
                    >
                      Config
                      <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {restaurants.length === 0 && (
          <div className="text-center py-20 bg-slate-900 border-t border-slate-800">
             <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-slate-700" />
            </div>
            <p className="text-slate-300 font-black uppercase tracking-widest text-xs mb-1">No properties established</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Start by establishing your first restaurant or hotel brand</p>
            <Link
              href="/superadmin/restaurants/new"
              className="inline-flex items-center gap-2 h-12 px-6 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Build Property
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
