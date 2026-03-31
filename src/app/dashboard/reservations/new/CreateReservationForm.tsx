'use client'

import { ReservationForm } from '@/components/restaurant/reservation-form'
import type { Tables } from '@/lib/types/database'

interface Props { 
  tables: Tables<'physical_tables'>[]
  restaurantId: string
}

export function CreateReservationForm({ tables, restaurantId }: Props) {
  return <ReservationForm tables={tables} restaurantId={restaurantId} />
}
