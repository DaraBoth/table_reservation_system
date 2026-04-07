'use client'

import { ReservationForm } from '@/components/restaurant/reservation-form'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'

interface Props {
  tables: Tables<'physical_tables'>[]
  zones: { id: string, name: string, sort_order: number }[]
  restaurantId: string
  preSelectedTableId?: string
  businessType?: BusinessType
}

export function CreateReservationForm({ tables, zones, restaurantId, preSelectedTableId, businessType = 'restaurant' }: Props) {
  return (
    <ReservationForm
      tables={tables}
      zones={zones}
      restaurantId={restaurantId}
      preSelectedTableId={preSelectedTableId}
      businessType={businessType}
    />
  )
}
