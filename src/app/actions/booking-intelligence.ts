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
export async function getOccupiedTableIds(restaurantId: string, reservationDate: string, startTimeStr: string) {
  const supabase = await createClient()
  
  // 1. Fetch restaurant business type to decide logic
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('business_type')
    .eq('id', restaurantId)
    .single()
  
  const businessType = restaurant?.business_type || 'restaurant'
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'

  // 2. Fetch all potential conflicts that span this date
  const { data, error } = await supabase
    .from('reservations')
    .select('table_id, guest_name, start_time, end_time, reservation_date, checkout_date, status')
    .eq('restaurant_id', restaurantId)
    .in('status', ['pending', 'confirmed', 'arrived'])
    .lte('reservation_date', reservationDate)
    .gte('checkout_date', reservationDate)

  if (error) {
    console.error('Occupancy check failed:', error)
    return []
  }

  // 3. Filter logic to determine if the table is TRULY busy
  const [targetH, targetM] = startTimeStr.split(':').map(Number)
  const targetDate = new Date(2000, 0, 1, targetH, targetM)

  return data.filter(r => {
    if (!r.table_id) return false

    // 🏨 HOTEL/STAY-OVER LOGIC: Precise time checks
    if (isHotel) {
      // If checking-out today, check if target time is AFTER their end_time
      if (r.checkout_date === reservationDate && r.end_time) {
        const [endH, endM] = r.end_time.split(':').map(Number)
        const endDate = new Date(2000, 0, 1, endH, endM)
        if (targetDate >= endDate) return false // They already left before our new guest arrives
      }

      // If checking-in today, check if target time is BEFORE their start_time
      if (r.reservation_date === reservationDate && r.start_time) {
         const [startH, startM] = r.start_time.split(':').map(Number)
         const startDate = new Date(2000, 0, 1, startH, startM)
         const [targetEndH, targetEndM] = [targetDate.getHours() + 2, targetDate.getMinutes()]
         const targetEndDate = new Date(2000, 0, 1, targetEndH, targetEndM)

         if (targetDate >= new Date(startDate.getTime() + 2 * 60 * 60 * 1000) || targetEndDate <= startDate) return false
      }
    } 
    // 🍽️ RESTAURANT LOGIC: Any booking on this day makes it busy for the whole day (matches Dashboard)
    else {
      return true 
    }

    return true
  }).map(r => ({
    table_id: r.table_id!,
    guest_name: r.guest_name,
    start_time: r.start_time
  }))
}


