import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { TopBar } from '@/components/layout/top-bar'
import { redirect } from 'next/navigation'
import type { BusinessType } from '@/lib/business-type'
import { RealtimeListener } from '@/components/realtime-listener'
import { NotificationManager } from '@/components/notification-manager'
import { getActiveRestaurant } from '@/lib/restaurant-context'

export default async function DashboardLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode
  params: Promise<{ restaurantId: string }>
}) {
  const { restaurantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await getActiveRestaurant(restaurantId)
  if (!res) redirect('/login')

  // URL-to-State Parity Check: If the URL ID (e.g., 'setup') is invalid, redirect to the real ID
  if (restaurantId !== res.activeId) {
    // Preserve the sub-path if possible (optional, but safer to just hit root)
    redirect(`/dashboard/${res.activeId}`)
  }

  const { membership: membershipRaw, allMemberships: allMembershipsRaw } = res as any
  const membership = membershipRaw
  const allMemberships = allMembershipsRaw
  if (membership.role === 'superadmin') redirect('/superadmin')

  const { data: profileRaw } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const profile = profileRaw as { full_name: string | null } | null

  const isAdmin = membership.role === 'admin'
  const isSpecialAdmin = (membership as any).is_special_admin === true
  const specialFeatures = (membership as any).special_features || []
  const isNewRestaurant = membership.restaurants?.is_new === true
  const restaurantName = membership.restaurants?.name ?? 'Dashboard'
  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <RealtimeListener restaurantId={membership.restaurant_id ?? undefined} />
        <NotificationManager restaurantId={membership.restaurant_id ?? undefined} />
        <TopBar 
          brandName={restaurantName} 
          userName={displayName} 
          userEmail={user.email} 
          restaurantId={membership.restaurant_id ?? undefined} 
          memberships={allMemberships}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {children}
        </main>
        {!isNewRestaurant && (
          <BottomNav 
            isAdmin={isAdmin} 
            businessType={businessType} 
            isSpecialAdmin={isSpecialAdmin}
            specialFeatures={specialFeatures}
            restaurantId={restaurantId}
            memberships={allMemberships}
          />
        )}
      </div>
    </div>
  )
}
