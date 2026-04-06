'use server'

import { createClient } from '@/lib/supabase/server'
import { addHours, format } from 'date-fns'

/**
 * Fetches frequently booked guests for a specific restaurant.
 */
export async function getCommonCustomers(restaurantId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('common_customers')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name')
    .limit(20)

  if (error) throw error
  return data
}

/**
 * Identifies tables that are occupied at a given time.
 * Returns detailed occupancy info including guest names.
 */
export async function getOccupiedTableIds(restaurantId: string, startTime: Date) {
  const supabase = await createClient()
  
  const targetDate = format(startTime, 'yyyy-MM-dd')
  const targetStartTime = format(startTime, 'HH:mm:ss')
  const targetEndTime = format(addHours(startTime, 2), 'HH:mm:ss')

  const { data, error } = await supabase
    .from('reservations')
    .select('table_id, guest_name, start_time')
    .eq('restaurant_id', restaurantId)
    .in('status', ['confirmed', 'arrived'])
    .eq('reservation_date', targetDate)
    .lt('start_time', targetEndTime)
    .gt('end_time', targetStartTime)

  if (error) {
    console.error('Occupancy check failed:', error)
    return []
  }

  return data.map(r => ({
    table_id: r.table_id,
    guest_name: r.guest_name,
    start_time: r.start_time
  }))
}
