import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ShieldAlert, Users, User as UserIcon, CalendarDays, Mail, Trash2, ShieldCheck, Fingerprint } from 'lucide-react'
import { CreateUserDialog } from './CreateUserDialog'
import { DeleteUserButton } from './DeleteUserButton'
import type { Tables } from '@/lib/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const metadata = { title: 'User Management — Superadmin' }

const ROLE_THEMES = {
  superadmin: { label: 'System', icon: ShieldAlert, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  admin:       { label: 'Admin',  icon: Users,       color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  staff:       { label: 'Staff',  icon: UserIcon,    color: 'bg-muted/40 text-muted-foreground border-border/20' },
} as const

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: membersRaw, error } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name)')
    .order('created_at', { ascending: false })

  const { data: restaurantsRaw } = await supabase
    .from('restaurants')
    .select('*')
    .order('name')

  const members = (membersRaw ?? []) as any[]
  const restaurants = (restaurantsRaw ?? []) as Tables<'restaurants'>[]

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm font-medium">{members.length} Identifiers registered</p>
        </div>
        <CreateUserDialog restaurants={restaurants} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <p className="text-sm font-bold text-red-400">Security synchronization error: {error.message}</p>
        </div>
      )}

      <div className="bg-card/40 border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5 border-b border-border">
            <TableRow className="hover:bg-transparent border-none h-12">
              <TableHead className="pl-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest w-[240px]">Identity</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Property</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Privilege</TableHead>
              <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="pr-6 text-right text-[9px] font-black text-muted-foreground uppercase tracking-widest w-20">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const profile = m.profiles as any
              const name = profile?.full_name || 'System Identity'
              const initial = name[0]?.toUpperCase() || '?'
              const joinedDate = new Date(m.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              })
              const roleTheme = ROLE_THEMES[m.role as keyof typeof ROLE_THEMES] || ROLE_THEMES.staff
              const RoleIcon = roleTheme.icon

              return (
                <TableRow key={m.id} className="hover:bg-white/[0.02] border-border transition-colors h-16 group">
                  {/* User Info */}
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-xl border border-border group-hover:border-blue-500/50 transition-colors shadow-lg">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-black text-[10px] uppercase">{initial}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-foreground group-hover:text-blue-400 transition-colors leading-tight truncate">{name}</span>
                        <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tight truncate opacity-60">U: {m.user_id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Property */}
                  <TableCell>
                    {m.restaurants ? (
                       <span className="text-[11px] font-black text-muted-foreground uppercase tracking-tight italic truncate max-w-[120px]">{m.restaurants.name}</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest italic opacity-40">Global</span>
                    )}
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black border px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 w-fit",
                      roleTheme.color
                    )}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleTheme.label}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <Badge className={cn(
                        'text-[8px] font-black border px-2 py-0.5 rounded-lg uppercase tracking-widest',
                        m.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {m.is_active ? 'Online' : 'Locked'}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-tight opacity-40">{joinedDate}</span>
                    </div>
                  </TableCell>

                  {/* Controls */}
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end">
                      {m.role !== 'superadmin' && (
                        <DeleteUserButton userId={m.user_id} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {members.length === 0 && (
          <div className="text-center py-20 bg-card border-t border-border">
             <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-foreground/70 font-black uppercase tracking-widest text-xs mb-1">No identifiers established</p>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Wait for user registration or manually sync identities</p>
          </div>
        )}
      </div>
    </div>
  )
}
