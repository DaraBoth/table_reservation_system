import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AdminPasswordResetCard } from './AdminPasswordResetClient'
import { ShieldCheck, KeyRound } from 'lucide-react'

export const metadata = { title: 'Admin Accounts — Superadmin' }

export default async function AdminsPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name)')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  const list = (members ?? []) as any[]
  const activeCount = list.filter(m => m.is_active).length

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Admin Accounts</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {list.length} admins across all restaurants ·{' '}
          <span className="text-emerald-400 font-bold">{activeCount} active</span>
        </p>
      </div>

      {/* Cards */}
      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((m) => {
            const name = m.profiles?.full_name || 'Admin'
            const restaurant = m.restaurants?.name || 'Unknown Restaurant'
            const joinedDate = new Date(m.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })

            return (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-amber-500/20">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900',
                    m.is_active ? 'bg-emerald-500' : 'bg-red-500'
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-black text-white">{name}</p>
                    <Badge className={cn(
                      'text-[10px] font-bold border px-2 py-0.5 rounded-xl',
                      m.is_active
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    )}>
                      {m.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <p className="text-xs text-slate-500 truncate">{restaurant}</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Joined {joinedDate}</p>
                </div>

                {/* Reset password */}
                <div className="flex-shrink-0">
                  <AdminPasswordResetCard userId={m.user_id} name={name} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="text-5xl mb-4">🛡️</div>
          <p className="text-slate-300 font-bold mb-1">No admin accounts yet</p>
          <p className="text-slate-500 text-sm">Create a restaurant and assign an admin to get started.</p>
        </div>
      )}
    </div>
  )
}
