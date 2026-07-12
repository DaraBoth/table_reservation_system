'use client'

import React from 'react'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'
import { RestaurantBookingForm } from './RestaurantBookingForm'
import { HotelReservationForm } from '../hotel/HotelReservationForm'

interface Props {
  tables: Tables<'physical_tables'>[]
  zones: { id: string, name: string, sort_order: number }[]
  // True only while the New Booking flow's client-side tables/zones fetch is
  // still in flight (see CreateReservationForm) — the Edit flow always
  // fetches tables/zones server-side before rendering, so it never sets this.
  tablesLoading?: boolean
  restaurantId: string
  // Raw reservation row — see the timezone-safety comment on this same prop
  // in RestaurantBookingForm/HotelReservationForm. Never pre-parse
  // start_time/end_time into a Date before this reaches a client component.
  initialData?: Tables<'reservations'>
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
