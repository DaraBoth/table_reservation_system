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
  
  // Format the selected time range for Postgres tsrange
  // Format the selected time range for Postgres tsrange
  const startStr = format(startTime, "yyyy-MM-dd HH:mm:ssXXX") // Use ISO-like format
  const endStr = format(addHours(startTime, 2), "yyyy-MM-dd HH:mm:ssXXX")
  const rangeStr = `[${startStr}, ${endStr})`

  // Query overlapping reservations
  const { data, error } = await supabase
    .from('reservations')
    .select('table_id')
    .eq('restaurant_id', restaurantId)
    .neq('status', 'cancelled')
    .filter('reservation_time', 'ov', rangeStr) // Overlap operator

  if (error) {
    console.error('Occupancy check failed:', error)
    return []
  }

  return data.map(r => r.table_id)
}
