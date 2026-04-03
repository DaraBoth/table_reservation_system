'use server'

import { setActiveRestaurantId } from '@/lib/restaurant-context'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function switchRestaurant(restaurantId: string) {
  await setActiveRestaurantId(restaurantId)
  revalidatePath('/dashboard')
}
