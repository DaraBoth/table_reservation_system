const occupyingStatuses = new Set(['confirmed', 'arrived'])

/**
 * Calculate available units by subtracting occupied tables/rooms from total active units
 * Occupied status is determined by confirmed or arrived reservations with a table_id
 */
export function countAvailableUnits(
  totalActiveUnits: number,
  reservations: Array<{ status: string | null; table_id?: string | null }>
) {
  const occupiedUnitIds = new Set(
    reservations
      .filter((reservation) => reservation.table_id && reservation.status && occupyingStatuses.has(reservation.status))
      .map((reservation) => reservation.table_id as string)
  )

  return Math.max(totalActiveUnits - occupiedUnitIds.size, 0)
}
