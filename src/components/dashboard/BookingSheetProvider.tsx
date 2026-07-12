'use client'

import { useCallback, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ReservationForm } from '@/components/restaurant/reservation-form'
import {
  BookingSheetContext,
  type BookingSheetTableRow,
  type BookingSheetZoneRow,
  type OpenBookingOptions,
} from './booking-sheet-context'
import type { BusinessType } from '@/lib/business-type'

export { useBookingSheet } from './booking-sheet-context'

interface Props {
  children: React.ReactNode
  initialTables: BookingSheetTableRow[]
  initialZones: BookingSheetZoneRow[]
  restaurantId: string
  businessType: BusinessType
}

export function BookingSheetProvider({ children, initialTables, initialZones, restaurantId, businessType }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [preSelected, setPreSelected] = useState<OpenBookingOptions>({})
  // Preloaded once by the layout (which persists across dashboard
  // navigation) — not re-fetched here. Live per-slot occupancy is still
  // fetched fresh by the form itself for whatever date/time is selected.
  const [tables] = useState(initialTables)
  const [zones] = useState(initialZones)

  const openBooking = useCallback((options: OpenBookingOptions = {}) => {
    setPreSelected(options)
    setIsOpen(true)
  }, [])

  const closeBooking = useCallback(() => setIsOpen(false), [])

  return (
    <BookingSheetContext.Provider value={{ tables, zones, openBooking, closeBooking }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="data-[side=bottom]:h-[100dvh] data-[side=bottom]:max-h-none data-[side=bottom]:rounded-none overflow-y-auto p-4 sm:p-6"
        >
          {isOpen && (
            <ReservationForm
              key={preSelected.tableId ?? 'new'}
              tables={tables}
              zones={zones}
              restaurantId={restaurantId}
              preSelectedTableId={preSelected.tableId}
              presetDate={preSelected.date}
              businessType={businessType}
            />
          )}
        </SheetContent>
      </Sheet>
    </BookingSheetContext.Provider>
  )
}
