'use client'

import { ReservationForm } from '@/components/restaurant/reservation-form'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'

interface Props {
  tables: Tables<'physical_tables'>[]
  restaurantId: string
  preSelectedTableId?: string
  businessType?: BusinessType
}

export function CreateReservationForm({ tables, restaurantId, preSelectedTableId, businessType = 'restaurant' }: Props) {
  return (
    <ReservationForm
      tables={tables}
      restaurantId={restaurantId}
      preSelectedTableId={preSelectedTableId}
      businessType={businessType}
    />
  )
}
