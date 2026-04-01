import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ShieldAlert, Users, User } from 'lucide-react'
import { CreateUserDialog } from './CreateUserDialog'
import { DeleteUserButton } from './DeleteUserButton'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'User Management — Superadmin' }

const ROLE_CONFIG = {
  superadmin: { label: 'Superadmin', icon: ShieldAlert, gradient: 'from-indigo-500 to-blue-600',  bg: 'bg-indigo-600/15', text: 'text-indigo-400' },
  admin:       { label: 'Admins',    icon: Users,       gradient: 'from-amber-500 to-orange-600',  bg: 'bg-amber-600/15',  text: 'text-amber-400' },
  staff:       { label: 'Staff',     icon: User,        gradient: 'from-slate-600 to-slate-700',   bg: 'bg-slate-700/30',  text: 'text-slate-400' },
} as const

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: membersRaw, error } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name)')
    .order('role', { ascending: true })

  const { data: restaurantsRaw } = await supabase
    .from('restaurants')
    .select('*')
    .order('name')

  const members = (membersRaw ?? []) as any[]
  const restaurants = (restaurantsRaw ?? []) as Tables<'restaurants'>[]

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{members.length} total platform users</p>
        </div>
        <CreateUserDialog restaurants={restaurants} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-400">Database error: {error.message}</p>
        </div>
      )}

      {/* Role sections */}
      {(['superadmin', 'admin', 'staff'] as const).map((role) => {
        const roleMembers = members.filter(m => m.role === role)
        if (roleMembers.length === 0 && role !== 'admin') return null

        const config = ROLE_CONFIG[role]
        const Icon = config.icon

        return (
          <section key={role}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', config.bg)}>
                  <Icon className={cn('w-4 h-4', config.text)} />
                </div>
                <h2 className="text-base font-black text-white capitalize">{config.label}</h2>
                <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  {roleMembers.length}
                </Badge>
              </div>
            </div>

            {/* Member cards */}
            {roleMembers.length > 0 ? (
              <div className="space-y-2">
                {roleMembers.map((m) => {
                  const name = m.profiles?.full_name || 'Unknown User'
                  const joinedDate = new Date(m.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })

                  return (
                    <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-4">
                      {/* Avatar */}
                      <div className={cn(
                        'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-base font-black text-white flex-shrink-0',
                        config.gradient
                      )}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {m.restaurants && (
                            <span className="text-xs text-slate-500 truncate">{m.restaurants.name}</span>
                          )}
                          <span className="text-xs text-slate-600">· {joinedDate}</span>
                        </div>
                      </div>

                      {/* Status + delete */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={cn(
                          'text-[10px] font-bold border px-2 py-0.5 rounded-xl hidden sm:inline-flex',
                          m.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        )}>
                          {m.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                        {m.role !== 'superadmin' && (
                          <DeleteUserButton userId={m.user_id} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl py-8 text-center">
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No {config.label.toLowerCase()} yet</p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
