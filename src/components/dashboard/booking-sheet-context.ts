import { createContext, useContext } from 'react'
import type { Tables } from '@/lib/types/database'

export type BookingSheetTableRow = Tables<'physical_tables'>
export type BookingSheetZoneRow = { id: string, name: string, sort_order: number }

export interface OpenBookingOptions {
  tableId?: string
  date?: string
}

export interface BookingSheetContextValue {
  tables: BookingSheetTableRow[]
  zones: BookingSheetZoneRow[]
  openBooking: (options?: OpenBookingOptions) => void
  closeBooking: () => void
}

export const BookingSheetContext = createContext<BookingSheetContextValue | null>(null)

/**
 * Opens/closes the global "New Booking" bottom sheet from anywhere in the
 * dashboard, using tables/zones already preloaded by the layout — no
 * navigation, no fetch, the sheet appears instantly. Also used by the
 * booking form itself to close the sheet on successful submission.
 */
export function useBookingSheet() {
  const ctx = useContext(BookingSheetContext)
  if (!ctx) throw new Error('useBookingSheet must be used within BookingSheetProvider')
  return ctx
}
