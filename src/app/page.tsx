import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Home Redirect', 'Redirects signed-in users to their active workspace.', '/')

export default async function Home() {
  await getServerT()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role === 'superadmin') redirect('/superadmin')
  redirect('/dashboard')
}
