import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './SetupForm'
import { getTerms } from '@/lib/business-type'

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

  // If already finished, don't show setup
  if (!membership.restaurants.is_new) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-violet-500/40 mb-4 animate-bounce-slow">
            <span className="text-4xl text-white">✨</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight italic">Welcome!</h1>
          <p className="text-slate-400 text-lg font-medium">Let&apos;s get your business ready.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-8 shadow-2xl backdrop-blur-xl">
          <SetupForm restaurant={membership.restaurants} />
        </div>

        <p className="text-center text-xs text-slate-600 font-bold uppercase tracking-widest leading-relaxed px-8 opacity-40">
          You are setting up as an Administrator for {membership.restaurants.name}. 
          You can change these details later in settings.
        </p>
      </div>
    </div>
  )
}

// Simple bounce slow animation
const style = `
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}
`
