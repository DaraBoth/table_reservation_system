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
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Restaurants', 'Manage restaurant accounts, subscriptions, and activity status.')

export default async function RestaurantsPage() {
  const { t } = await getServerT()
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
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{t('superadmin.properties', { defaultValue: 'Properties' })}</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t('superadmin.propertiesSummary', {
              defaultValue: '{{total}} registered · {{active}} active',
              total: restaurants.length,
              active: activeCount,
            })}
          </p>
        </div>
        <Link
          href="/superadmin/restaurants/new"
          className="flex items-center gap-2 h-12 px-6 bg-violet-600 hover:bg-violet-500 text-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-500/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('superadmin.addProperty', { defaultValue: 'Add Property' })}
        </Link>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5 border-b border-border">
            <TableRow className="hover:bg-transparent border-none h-12">
              <TableHead className="pl-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest w-[240px]">{t('superadmin.property', { defaultValue: 'Property' })}</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.administrator', { defaultValue: 'Administrator' })}</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.type', { defaultValue: 'Type' })}</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">{t('superadmin.status', { defaultValue: 'Status' })}</TableHead>
              <TableHead className="pr-6 text-right text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.actions', { defaultValue: 'Actions' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.map((r) => {
              const isExpired = r.subscription_expires_at && new Date(r.subscription_expires_at) < new Date()
              const expireDate = r.subscription_expires_at
                ? new Date(r.subscription_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : t('superadmin.lifetime', { defaultValue: 'Lifetime' })
              const leadAdmin = r.account_memberships?.find((m: any) => m.role === 'admin')?.profiles?.full_name || t('superadmin.unassigned', { defaultValue: 'Unassigned' })
              
              const businessType = r.business_type || 'restaurant'
              const TypeIcon = businessType === 'hotel' ? Building2 : businessType === 'guesthouse' ? Home : UtensilsCrossed

              return (
                <TableRow key={r.id} className="hover:bg-white/[0.02] border-border transition-colors h-16 group">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-xl border border-border group-hover:border-violet-500/50 transition-colors shadow-lg">
                         <AvatarFallback className="bg-muted text-muted-foreground font-black text-[10px] uppercase">{r.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-foreground group-hover:text-violet-400 transition-colors leading-tight italic truncate">{r.name}</span>
                        <div className="flex items-center gap-1 mt-0.5 opacity-60">
                           <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight truncate">{r.slug}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-tight truncate max-w-[120px]">{leadAdmin}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center",
                        businessType === 'hotel' ? "bg-blue-500/10 text-blue-400" : businessType === 'guesthouse' ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                      )}>
                        <TypeIcon className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{businessType}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <Badge className={cn(
                        'text-[8px] font-black border px-2 py-0.5 rounded-lg uppercase tracking-widest',
                        isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                          : r.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      )}>
                        {isExpired
                          ? t('superadmin.expired', { defaultValue: 'Expired' })
                          : r.is_active
                            ? t('superadmin.active', { defaultValue: 'Active' })
                            : t('superadmin.suspended', { defaultValue: 'Suspended' })}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-tight opacity-40">{expireDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="pr-6 text-right">
                    <Link
                      href={`/superadmin/restaurants/${r.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        "h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group/btn gap-1.5 font-black uppercase tracking-widest text-[9px]"
                      )}
                    >
                      {t('common.settings', { defaultValue: 'Config' })}
                      <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {restaurants.length === 0 && (
          <div className="text-center py-20 bg-card border-t border-border">
             <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-foreground/70 font-black uppercase tracking-widest text-xs mb-1">{t('superadmin.noPropertiesEstablished', { defaultValue: 'No properties established' })}</p>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-6">{t('superadmin.startByEstablishingProperty', { defaultValue: 'Start by establishing your first restaurant or hotel brand' })}</p>
            <Link
              href="/superadmin/restaurants/new"
              className="inline-flex items-center gap-2 h-12 px-6 bg-violet-600 text-foreground rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              {t('superadmin.buildProperty', { defaultValue: 'Build Property' })}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
