/**
 * Returns terminology labels based on business type.
 * All dashboard pages use these so the UI auto-adapts per tenant.
 */
export type BusinessType = 'restaurant' | 'hotel' | 'guesthouse'

export interface BusinessTerms {
  type: BusinessType
  // Units
  unit: string        // "Table" | "Room"
  units: string       // "Tables" | "Rooms"
  unitLower: string   // "table" | "room"
  unitsLower: string  // "tables" | "rooms"
  // Booking
  booking: string     // "Booking" | "Reservation"
  bookings: string    // "Bookings" | "Reservations"
  bookingLower: string
  bookingsLower: string
  // Action
  book: string        // "Book" | "Reserve"
  bookVerb: string    // "Booking" | "Reserving"
  // Time labels
  startLabel: string  // "Booking time" | "Check-in"
  endLabel: string    // (hidden for restaurant) | "Check-out"
  hasCheckout: boolean // true for hotel/guesthouse
  // Customer
  guest: string       // "Guest" | "Guest"
  guests: string      // "Guests" | "Guests"
  // Emoji
  emoji: string
  // Status for completion
  doneLabel: string   // "Done" | "Checked Out"
}

export function getTerms(type: string | null | undefined): BusinessTerms {
  const isHotel = type === 'hotel' || type === 'guesthouse'
  if (isHotel) {
    return {
      type: (type as BusinessType),
      unit: 'Room',       units: 'Rooms',
      unitLower: 'room',  unitsLower: 'rooms',
      booking: 'Reservation', bookings: 'Reservations',
      bookingLower: 'reservation', bookingsLower: 'reservations',
      book: 'Reserve',    bookVerb: 'Reserving',
      startLabel: 'Check-in',
      endLabel: 'Check-out',
      hasCheckout: true,
      guest: 'Guest',     guests: 'Guests',
      emoji: type === 'guesthouse' ? '🏡' : '🏨',
      doneLabel: 'Checked Out',
    }
  }
  return {
    type: 'restaurant',
    unit: 'Table',      units: 'Tables',
    unitLower: 'table', unitsLower: 'tables',
    booking: 'Booking', bookings: 'Bookings',
    bookingLower: 'booking', bookingsLower: 'bookings',
    book: 'Book',       bookVerb: 'Booking',
    startLabel: 'Booking time',
    endLabel: '',
    hasCheckout: false,
    guest: 'Guest',     guests: 'Guests',
    emoji: '🍽️',
    doneLabel: 'Done',
  }
}
