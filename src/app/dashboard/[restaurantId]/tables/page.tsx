import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BusinessType } from '@/lib/business-type'
import { TablesClient } from './TablesClient'

export const metadata = { title: 'Live Tables — TableBook' }

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as any
  const role = membership?.role
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isStaff = role === 'staff'
  const canManage = isAdmin || isStaff
  const businessType = (membership?.restaurants?.business_type ?? 'restaurant') as BusinessType

  if (!canManage) redirect('/dashboard')

  // Initial Fetch for Tables
  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id!)
    .order('table_name')

  const today = new Date()
  const todayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')

  // Initial Fetch for Busy Status: Anyone whose range covers TODAY
  const { data: busyRows } = await supabase
    .from('reservations')
    .select('table_id, guest_name, status, party_size, reservation_date, checkout_date, end_time')
    .eq('restaurant_id', membership.restaurant_id!)
    .in('status', ['pending', 'confirmed', 'arrived', 'confirmed'])
    .lte('reservation_date', todayDate)
    .gte('checkout_date', todayDate)

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <TablesClient 
        initialTables={tables || []}
        initialBusyRows={busyRows || []}
        restaurantId={membership.restaurant_id!}
        businessType={businessType}
        isAdmin={isAdmin}
      />
    </div>
  )
}
