import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { TopBar } from '@/components/layout/top-bar'
import { Sidebar } from '@/components/layout/sidebar'
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

  // URL-to-State Parity Check: 
  // 1. If the route parameter is the actual UUID, but a slug exists, redirect to the user-friendly slug URL
  // 2. If the active ID (from context) doesn't match the routeId (slug or UUID), redirect to the active slug
  const { activeId, activeSlug } = res as any
  if (restaurantId === activeId && activeSlug && activeSlug !== activeId) {
    // Current URL is the long UUID, but a slug exists. Redirect to slug version.
    redirect(`/dashboard/${activeSlug}`)
  } else if (restaurantId !== activeId && restaurantId !== activeSlug) {
    // Current URL matches neither. Redirect to the source of truth's slug.
    redirect(`/dashboard/${activeSlug}`)
  }

  const { membership: membershipRaw, allMemberships: allMembershipsRaw } = res as any
  const membership = membershipRaw
  const allMemberships = allMembershipsRaw
  if (membership.role === 'superadmin') redirect('/superadmin')

  const { data: profileRaw } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
  const profile = profileRaw as { full_name: string | null, avatar_url: string | null } | null

  const isAdmin = membership.role === 'admin'
  const isSpecialAdmin = (membership as any).is_special_admin === true
  const specialFeatures = (membership as any).special_features || []
  const isNewRestaurant = membership.restaurants?.is_new === true
  const restaurantName = membership.restaurants?.name ?? 'Dashboard'
  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="flex bg-background h-screen overflow-hidden">
      {/* Desktop/Tablet Sidebar */}
      <Sidebar 
        user={{ email: user.email, name: displayName }}
        role={membership.role}
        brandName={restaurantName}
        type="dashboard"
        isAdmin={isAdmin}
        isStaff={membership.role === 'staff'}
        restaurantId={membership.restaurant_id}
        activeSlug={activeSlug}
        memberships={allMemberships}
        isSpecialAdmin={isSpecialAdmin}
        specialFeatures={specialFeatures}
      />

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <RealtimeListener restaurantId={membership.restaurant_id ?? undefined} />
        <NotificationManager restaurantId={membership.restaurant_id ?? undefined} />
        <TopBar 
          brandName={restaurantName} 
          userName={displayName} 
          userEmail={user.email} 
          avatarUrl={profile?.avatar_url}
          restaurantId={membership.restaurant_id ?? undefined} 
          activeSlug={activeSlug}
          memberships={allMemberships}
        />
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 md:pb-6 custom-scrollbar">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNav 
          isAdmin={isAdmin} 
          isStaff={membership.role === 'staff'}
          businessType={businessType} 
          isSpecialAdmin={isSpecialAdmin}
          specialFeatures={specialFeatures}
          restaurantId={membership.restaurant_id ?? undefined}
          activeSlug={activeSlug}
          memberships={allMemberships}
          avatarUrl={profile?.avatar_url}
        />
      </div>
    </div>
  )
}
