'use client'

import React from 'react'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'
import { RestaurantBookingForm } from './RestaurantBookingForm'
import { HotelReservationForm } from '../hotel/HotelReservationForm'

interface Props {
  tables: Tables<'physical_tables'>[]
  zones: { id: string, name: string, sort_order: number }[]
  restaurantId: string
  initialData?: Omit<Tables<'reservations'>, 'start_time' | 'end_time'> & { start_time: Date; end_time?: Date }
  preSelectedTableId?: string
  businessType?: BusinessType
}

/**
 * ReservationForm (Factory)
 * 
 * Dynamically switches between Restaurant and Hotel specialized UIs
 * to ensure a clean, focused experience for each business type.
 */
export function ReservationForm(props: Props) {
  const { businessType = 'restaurant' } = props
  
  if (businessType === 'hotel' || businessType === 'guesthouse') {
    return <HotelReservationForm {...props} businessType={businessType} />
  }

  return (
    <RestaurantBookingForm {...props} businessType={businessType} />
  )
}
