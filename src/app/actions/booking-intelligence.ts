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
 * Uses a default 2-hour duration to check for overlaps.
 */
export async function getOccupiedTableIds(restaurantId: string, startTime: Date) {
  const supabase = await createClient()
  
  const targetDate = format(startTime, 'yyyy-MM-dd')
  const targetStartTime = format(startTime, 'HH:mm:ss')
  const targetEndTime = format(addHours(startTime, 2), 'HH:mm:ss')

  // To find if a table is currently occupied during the requested [targetStartTime, targetEndTime] window:
  // Existing start_time must be BEFORE requested end_time
  // Existing end_time must be AFTER requested start_time
  const { data, error } = await supabase
    .from('reservations')
    .select('table_id')
    .eq('restaurant_id', restaurantId)
    .neq('status', 'cancelled')
    .eq('reservation_date', targetDate)
    .lt('start_time', targetEndTime)
    .gt('end_time', targetStartTime)

  if (error) {
    console.error('Occupancy check failed:', error)
    return []
  }

  return data.map(r => r.table_id)
}
