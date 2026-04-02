import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './SetupForm'
import { Sparkles } from 'lucide-react'

export default async function SetupPage() {
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

  if (!membership.restaurants.is_new) redirect('/dashboard')

  return (
    <div className="min-h-[80vh] flex flex-col justify-start py-6 px-4">
      <div className="w-full max-w-md mx-auto space-y-5">

        {/* Compact inline header */}
        <div className="flex items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-[1.5rem] bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/30 shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome!</h1>
            <p className="text-slate-500 text-sm font-medium">Set up your business to get started.</p>
          </div>
        </div>

        <SetupForm restaurant={membership.restaurants} />

        <p className="text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest leading-relaxed px-4">
          Admin for {membership.restaurants.name} · Settings can be changed later
        </p>
      </div>
    </div>
  )
}
