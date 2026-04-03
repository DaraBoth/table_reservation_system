import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CreateStaffDialog } from './CreateStaffDialog'
import { StaffPasswordResetButton } from './StaffPasswordReset'
import { StaffActions } from './StaffActions'
import type { Tables } from '@/lib/types/database'
import { UserCheck, UserX, Plus, Users } from 'lucide-react'

export const metadata = { title: 'Staff — TableBook' }

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Tables<'account_memberships'> | null
  if (membership?.role !== 'admin') redirect('/dashboard')

  const { data: raw } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url)')
    .eq('restaurant_id', membership.restaurant_id!)
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  const staff = (raw ?? []) as unknown as Array<
    Tables<'account_memberships'> & { profiles: Pick<Tables<'profiles'>, 'full_name' | 'avatar_url'> | null }
  >

  const activeCount   = staff.filter(s => s.is_active).length
  const inactiveCount = staff.filter(s => !s.is_active).length

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-slate-400 text-sm">{staff.length} staff members</p>
        <CreateStaffDialog />
      </div>

      {/* Summary strip */}
      <div className="flex gap-3">
        <div className="flex-1 bg-slate-900 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{activeCount}</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center">
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{inactiveCount}</p>
            <p className="text-xs text-slate-400">Disabled</p>
          </div>
        </div>
      </div>

      {/* Staff Cards */}
      {staff.length > 0 ? (
        <div className="space-y-3">
          {staff.map((s) => {
            const name = s.profiles?.full_name || 'Staff Member'
            const initials = name.slice(0, 2).toUpperCase()
            const joinedDate = new Date(s.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })

            return (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all duration-300"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-lg font-black text-white shadow-lg">
                    {initials}
                  </div>
                  {/* Online dot */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${s.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <p className="text-sm sm:text-base font-black text-white truncate max-w-[80px] sm:max-w-none">{name}</p>
                    <Badge className={`text-[10px] font-black border px-2 py-0.5 rounded-xl flex-shrink-0 ${
                      s.is_active
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        : 'bg-slate-700/50 text-slate-400 border-slate-600'
                    }`}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    Staff · Joined {joinedDate}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StaffActions 
                    userId={s.user_id} 
                    membershipId={s.id} 
                    isActive={s.is_active} 
                    name={name} 
                  />
                  <div className="w-px h-6 bg-slate-800" />
                  <StaffPasswordResetButton userId={s.user_id} name={name} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800">
          <div className="mb-4 flex justify-center">
            <Users className="w-12 h-12 text-slate-600" />
          </div>
          <p className="text-slate-300 font-bold text-base">No staff members yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">Add your first staff member to get started</p>
          <CreateStaffDialog />
        </div>
      )}
    </div>
  )
}
