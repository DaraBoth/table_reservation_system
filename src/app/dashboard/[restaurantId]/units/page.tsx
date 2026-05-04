import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BusinessType } from '@/lib/business-type'
import { UnitsClient } from './UnitsClient'

import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export async function generateMetadata() {
  const { t } = await getServerT()
  return createPrivateMetadata(
    t('meta.liveStatusTitle', { defaultValue: 'Live Status' }),
    t('meta.liveStatusDescription', { defaultValue: 'Track table or room availability in real time.' })
  )
}

export default async function UnitsPage({ params, searchParams }: { params: Promise<{ restaurantId: string }>, searchParams: Promise<{ date?: string }> }) {
  await getServerT()
  const { restaurantId } = await params
  const { date: selectedDateParam } = await searchParams

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

  if (!canManage) redirect('/dashboard')

  // Initial Fetch for Tables
  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*, zones(*)')
    .eq('restaurant_id', membership.restaurant_id!)

  const today = new Date()
  const todayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  const initialDate = selectedDateParam || todayDate

  const currentTimeIso = today.toISOString()

  // Initial Fetch for Busy Status: Anyone whose range covers TODAY
  const { data: busyRows } = await supabase
    .from('reservations')
    .select('table_id, guest_name, guest_phone, status, party_size, reservation_date, checkout_date, start_time, end_time, profiles(full_name)')
    .eq('restaurant_id', membership.restaurant_id!)
    .in('status', ['pending', 'confirmed', 'arrived'])
    .lte('reservation_date', initialDate)
    .gte('checkout_date', initialDate)


  return (
    <div className="max-w-6xl mx-auto pb-10 md:pb-6">
      <UnitsClient 
        initialTables={tables || []}
        initialBusyRows={busyRows || []}
        restaurantId={membership.restaurant_id!}
        businessType={businessType}
        canManage={canManage}
        initialDate={initialDate}

        initialNowIso={currentTimeIso}
        mode="monitoring"
        currentSlug={activeSlug}
      />
    </div>
  )
}
