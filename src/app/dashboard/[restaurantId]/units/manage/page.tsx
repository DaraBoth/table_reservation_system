import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BusinessType } from '@/lib/business-type'
import { UnitsClient } from '../UnitsClient'
import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Manage Units', 'Edit tables, rooms, zones, and capacity settings.')

export default async function ManageUnitsPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  await getServerT()
  const { restaurantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const res = await getActiveRestaurant(restaurantId)
  if (!res) return null
  
  const { membership, activeSlug } = res as {
    membership: {
      role?: string | null
      restaurant_id?: string | null
      restaurants?: { business_type?: string | null } | null
    }
    activeSlug?: string
  }
  const role = membership?.role
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isStaff = role === 'staff'
  const canManage = isAdmin || isStaff
  const businessType = (membership?.restaurants?.business_type ?? 'restaurant') as BusinessType

  // Security: Only Admin and Staff can manage units
  if (!canManage) redirect('/dashboard')

  // Initial Fetch for all Units (including inactive ones for management)
  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*, zones(*)')
    .eq('restaurant_id', membership.restaurant_id!)

  const today = new Date()
  const todayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  const currentTimeIso = today.toISOString()

  // In management mode, we don't necessarily need busy rows, but we pass them for consistency if the component expects them
  // We'll fetch them just in case the UI shows "Current Status" even in management mode
  const { data: busyRows } = await supabase
    .from('reservations')
    .select('table_id, guest_name, guest_phone, status, party_size, reservation_date, checkout_date, start_time, end_time, profiles(full_name)')
    .eq('restaurant_id', membership.restaurant_id!)
    .in('status', ['pending', 'confirmed', 'arrived'])
    .lte('reservation_date', todayDate)
    .gte('checkout_date', todayDate)

  return (
    <div className="max-w-6xl mx-auto pb-10 md:pb-6">
      <UnitsClient 
        initialTables={tables || []}
        initialBusyRows={busyRows || []}
        restaurantId={membership.restaurant_id!}
        businessType={businessType}
        canManage={canManage}
        initialDate={todayDate}
        initialNowIso={currentTimeIso}
        mode="management"
        currentSlug={activeSlug}
      />
    </div>
  )
}
