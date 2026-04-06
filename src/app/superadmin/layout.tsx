import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperadminNav } from '@/components/layout/superadmin-nav'
import type { Tables } from '@/lib/types/database'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Pick<Tables<'account_memberships'>, 'role'> | null
  if (membership?.role !== 'superadmin') redirect('/dashboard')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Pick<Tables<'profiles'>, 'full_name' | 'avatar_url'> | null
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Superadmin'

  return (
    <div className="h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <SuperadminNav 
        userName={displayName} 
        userEmail={user.email} 
        avatarUrl={profile?.avatar_url}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
