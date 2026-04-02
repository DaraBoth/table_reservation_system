import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RestaurantSettingsForm } from './RestaurantSettingsForm'

export default async function RestaurantSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(*)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as any
  if (!membership?.restaurant_id || !membership.restaurants) redirect('/dashboard')

  // Only Admin/Superadmin can edit restaurant info
  if (!['admin', 'superadmin'].includes(membership.role)) {
    redirect('/dashboard/account')
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="pt-2">
        <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">
          Business Info
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
          Manage your restaurant public profile
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 shadow-xl backdrop-blur-md">
        <RestaurantSettingsForm restaurant={membership.restaurants} />
      </div>

      {/* Subscription Info (Read Only) */}
      <div className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Subscription Plan</p>
          <p className="text-sm font-black text-white italic">
            Valid until {membership.restaurants.subscription_expires_at ? new Date(membership.restaurants.subscription_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unending'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <span className="text-xl">💳</span>
        </div>
      </div>
    </div>
  )
}
