import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import type { AccountMembership, Profile } from '@/lib/types/database'
import { redirect } from 'next/navigation'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Pick<AccountMembership, 'role'> | null
  if (membership?.role !== 'superadmin') redirect('/dashboard')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Pick<Profile, 'full_name'> | null
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Superadmin'

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar 
        user={{
          email: user.email,
          name: displayName
        }}
        role="Superadmin"
        brandName="TableBook"
        type="superadmin"
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div className="p-10 lg:p-12 w-full min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
