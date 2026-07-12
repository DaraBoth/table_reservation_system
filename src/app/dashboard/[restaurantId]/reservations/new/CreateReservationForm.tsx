'use client'

import { useEffect, useState } from 'react'
import { ReservationForm } from '@/components/restaurant/reservation-form'
import { getTablesAndZonesForBooking } from '@/app/actions/tables'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'

interface Props {
  restaurantId: string
  preSelectedTableId?: string
  businessType?: BusinessType
}

export function CreateReservationForm({ restaurantId, preSelectedTableId, businessType = 'restaurant' }: Props) {
  const [tables, setTables] = useState<Tables<'physical_tables'>[]>([])
  const [zones, setZones] = useState<{ id: string, name: string, sort_order: number }[]>([])
  const [tablesLoading, setTablesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setTablesLoading(true)
    getTablesAndZonesForBooking(restaurantId).then((result) => {
      if (cancelled) return
      setTables(result.tables)
      setZones(result.zones)
      setTablesLoading(false)
    })
    return () => { cancelled = true }
  }, [restaurantId])

  return (
    <ReservationForm
      tables={tables}
      zones={zones}
      tablesLoading={tablesLoading}
      restaurantId={restaurantId}
      preSelectedTableId={preSelectedTableId}
      businessType={businessType}
    />
  )
}
