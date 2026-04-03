import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { TopBar } from '@/components/layout/top-bar'
import { redirect } from 'next/navigation'
import type { BusinessType } from '@/lib/business-type'
import { RealtimeListener } from '@/components/realtime-listener'
import { NotificationManager } from '@/components/notification-manager'
import { getActiveRestaurant } from '@/lib/restaurant-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await getActiveRestaurant()
  if (!res) redirect('/login')

  const { membership, allMemberships } = res
  if (membership.role === 'superadmin') redirect('/superadmin')

  const { data: profileRaw } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const profile = profileRaw as { full_name: string | null } | null

  const isAdmin = membership.role === 'admin'
  const isNewRestaurant = membership.restaurants?.is_new === true
  const restaurantName = membership.restaurants?.name ?? 'Dashboard'
  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <RealtimeListener restaurantId={membership.restaurant_id ?? undefined} />
      <NotificationManager restaurantId={membership.restaurant_id ?? undefined} />
      <TopBar 
        brandName={restaurantName} 
        userName={displayName} 
        userEmail={user.email} 
        restaurantId={membership.restaurant_id ?? undefined} 
        memberships={allMemberships}
      />
      <main className="flex-1 px-2.5 pt-4 pb-32 overflow-y-auto">
        {children}
      </main>
      {!isNewRestaurant && <BottomNav isAdmin={isAdmin} businessType={businessType} />}
    </div>
  )
}
