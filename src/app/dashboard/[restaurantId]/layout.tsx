import type { Metadata } from 'next'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { TopBar } from '@/components/layout/top-bar'
import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import type { BusinessType } from '@/lib/business-type'
import { RealtimeListener } from '@/components/realtime-listener'
import { NotificationManager } from '@/components/notification-manager'
import { getActiveRestaurant } from '@/lib/restaurant-context'
import { APP_NAME } from '@/lib/seo'
import { SidebarProvider } from '@/components/layout/sidebar-provider'
import { BookingSheetProvider } from '@/components/dashboard/BookingSheetProvider'
import type { Tables } from '@/lib/types/database'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: `%s | Dashboard | ${APP_NAME}`,
  },
  description: 'Private restaurant operations workspace for BookJM users.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode
  params: Promise<{ restaurantId: string }>
}) {
  const { restaurantId } = await params
  const user = await getCachedUser()
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

  const { membership: membershipRaw, allMemberships: allMembershipsRaw, profile: profileRaw } = res as any
  const membership = membershipRaw
  const allMemberships = allMembershipsRaw
  if (membership.role === 'superadmin') redirect('/superadmin')

  const profile = profileRaw as { full_name: string | null, avatar_url: string | null } | null

  const isAdmin = membership.role === 'admin'
  const isSpecialAdmin = (membership as any).is_special_admin === true
  const specialFeatures = (membership as any).special_features || []
  const isNewRestaurant = membership.restaurants?.is_new === true
  const restaurantName = membership.restaurants?.name ?? 'Dashboard'
  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const logoUrl = membership.restaurants?.logo_url || ''

  // Preloaded once here — this layout persists across every nested route
  // navigation within the dashboard (Bookings, Units, Customers, etc. all
  // share this one instance), so the booking sheet can open instantly from
  // anywhere without a fresh fetch. Live occupancy for a specific date/time
  // is still fetched fresh by the form itself (getOccupiedTableIds); this is
  // just the static list of tables/zones, which rarely changes.
  let tableData: Tables<'physical_tables'>[] = []
  let zoneData: { id: string, name: string, sort_order: number }[] = []
  if (membership.restaurant_id) {
    const supabase = await createClient()
    const [{ data: t }, { data: z }] = await Promise.all([
      supabase
        .from('physical_tables')
        .select('*')
        .eq('restaurant_id', membership.restaurant_id)
        .eq('is_active', true),
      supabase
        .from('zones')
        .select('*')
        .eq('restaurant_id', membership.restaurant_id)
        .order('sort_order', { ascending: true }),
    ])
    tableData = t || []
    zoneData = z || []
  }

  return (
    <SidebarProvider>
      <BookingSheetProvider
        initialTables={tableData}
        initialZones={zoneData}
        restaurantId={membership.restaurant_id ?? ''}
        businessType={businessType}
      >
        <div className="flex bg-background h-screen overflow-hidden">
          {/* Desktop/Tablet Sidebar */}
          <Sidebar
            user={{ email: user.email, name: displayName }}
            avatarUrl={profile?.avatar_url}
            role={membership.role}
            brandName={restaurantName}
            logoUrl={logoUrl}
            type="dashboard"
            isAdmin={isAdmin}
            isStaff={membership.role === 'staff'}
            restaurantId={membership.restaurant_id}
            activeSlug={activeSlug}
            businessType={businessType}
            memberships={allMemberships}
            isSpecialAdmin={isSpecialAdmin}
            specialFeatures={specialFeatures}
          />

          <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
            <RealtimeListener restaurantId={membership.restaurant_id ?? undefined} />
            <NotificationManager restaurantId={membership.restaurant_id ?? undefined} />
            <TopBar
              brandName={restaurantName}
              logoUrl={logoUrl}
              userName={displayName}
              userEmail={user.email}
              avatarUrl={profile?.avatar_url}
              restaurantId={membership.restaurant_id ?? undefined}
              activeSlug={activeSlug}
              memberships={allMemberships}
              isSpecialAdmin={isSpecialAdmin}
              specialFeatures={specialFeatures}
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
      </BookingSheetProvider>
    </SidebarProvider>
  )
}
