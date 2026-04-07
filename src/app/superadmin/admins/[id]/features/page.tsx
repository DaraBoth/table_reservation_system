import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AdminFeaturesForm from './AdminFeaturesForm'
import { createPrivateMetadata } from '@/lib/seo'

export const metadata = createPrivateMetadata('Admin Features', 'Configure special admin permissions and feature access.')

export default async function AdminFeaturesPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name)')
    .eq('id', params.id)
    .single()

  if (!membership) {
    notFound()
  }

  const profile = (membership as any).profiles
  const restaurant = (membership as any).restaurants
  const m = membership as any

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AdminFeaturesForm
        membershipId={m.id}
        name={profile?.full_name || 'Admin'}
        property={restaurant?.name || 'Property'}
        initialIsSpecial={m.is_special_admin || false}
        initialFeatures={m.special_features || []}
      />
    </div>
  )
}
