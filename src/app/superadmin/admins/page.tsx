import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ShieldCheck, KeyRound, Star, Zap, Settings2, MoreHorizontal } from 'lucide-react'
import { AdminPasswordResetCard } from './AdminPasswordResetClient'
import Link from 'next/link'
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
import { CreateUserDialog as CreateAdminDialog } from '../users/CreateUserDialog'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Admin Accounts', 'Review admin access and manage elevated account settings.')

export default async function AdminsPage() {
  const { t } = await getServerT()
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name), is_special_admin, special_features')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  const { data: restaurantsRaw } = await supabase
    .from('restaurants')
    .select('*')
    .order('name')

  const restaurants = (restaurantsRaw ?? []) as any[]
  const list = (members ?? []) as any[]
  const activeCount = list.filter(m => m.is_active).length

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{t('superadmin.admins', { defaultValue: 'Admins' })}</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t('superadmin.adminsSummary', {
              defaultValue: '{{total}} administrators · {{active}} active',
              total: list.length,
              active: activeCount,
            })}
          </p>
        </div>
        <CreateAdminDialog restaurants={restaurants} />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5 border-b border-border">
            <TableRow className="hover:bg-transparent border-none h-12">
              <TableHead className="pl-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest w-[240px]">{t('superadmin.administrator', { defaultValue: 'Administrator' })}</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.property', { defaultValue: 'Property' })}</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.status', { defaultValue: 'Status' })}</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.modules', { defaultValue: 'Modules' })}</TableHead>
              <TableHead className="pr-6 text-right text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('superadmin.actions', { defaultValue: 'Actions' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((m) => {
              const name = m.profiles?.full_name || t('superadmin.systemAdmin', { defaultValue: 'System Admin' })
              const initial = name[0]?.toUpperCase() || '?'
              const joinedDate = new Date(m.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              })

              return (
                <TableRow key={m.id} className="hover:bg-white/[0.02] border-border transition-colors h-16 group">
                  {/* Admin Info */}
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-xl border border-border group-hover:border-violet-500/50 transition-colors shadow-lg">
                        <AvatarImage src={m.profiles?.avatar_url} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-black text-[10px] uppercase">{initial}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-foreground group-hover:text-violet-400 transition-colors leading-tight truncate">{name}</span>
                        <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tight truncate opacity-60">{t('superadmin.idPrefix', { defaultValue: 'ID' })}: {m.user_id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Property */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-tight italic truncate max-w-[120px]">{m.restaurants?.name || t('superadmin.unassigned', { defaultValue: 'Unassigned' })}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        'text-[8px] font-black border px-2 py-0.5 rounded-lg uppercase tracking-widest',
                        m.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {m.is_active
                          ? t('superadmin.active', { defaultValue: 'Active' })
                          : t('dashboard.disabled', { defaultValue: 'Disabled' })}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground/60 font-bold uppercase hidden xl:inline">· {joinedDate}</span>
                    </div>
                  </TableCell>

                  {/* Entitlements */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {m.is_special_admin ? (
                         <div className="flex items-center gap-1.5">
                           <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[8px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-widest">
                            <Star className="w-2 h-2 fill-violet-400" /> {t('superadmin.special', { defaultValue: 'SPECIAL' })}
                          </Badge>
                          <div className="flex -space-x-1">
                            {Object.keys(m.special_features || {}).slice(0, 3).map((f: string) => (
                              <div key={f} title={f} className="w-5 h-5 rounded-md bg-muted border border-border flex items-center justify-center">
                                <Zap className="w-2 h-2 text-violet-400" />
                              </div>
                            ))}
                          </div>
                         </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{t('superadmin.standard', { defaultValue: 'Standard' })}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/superadmin/admins/${m.id}/features`} 
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          "h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group/btn gap-1.5 font-black uppercase tracking-widest text-[9px]"
                        )}
                      >
                        <Settings2 className="w-3 h-3 transition-transform group-hover/btn:rotate-45" />
                        {t('superadmin.set', { defaultValue: 'Set' })}
                      </Link>
                      <AdminPasswordResetCard userId={m.user_id} name={name} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {list.length === 0 && (
          <div className="text-center py-20 bg-card border-t border-border">
            <div className="text-5xl mb-4">🛡️</div>
            <p className="text-foreground/70 font-black uppercase tracking-widest text-xs mb-1">{t('superadmin.noPrivilegeAccountsYet', { defaultValue: 'No privilege accounts yet' })}</p>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{t('superadmin.assignAdminPrompt', { defaultValue: 'Assign an admin to a property to get started' })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
