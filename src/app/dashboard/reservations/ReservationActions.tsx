'use client'

import { useActionState } from 'react'
import { cancelReservation, updateReservationStatus } from '@/app/actions/reservations'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [, action, pending] = useActionState(cancelReservation, null)
  return (
    <form action={action}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}
        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-7">
        {pending ? '...' : 'Cancel'}
      </Button>
    </form>
  )
}

export function UpdateStatusButton({ reservationId, currentStatus }: { reservationId: string; currentStatus: string }) {
  const [, action, pending] = useActionState(updateReservationStatus, null)
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="reservationId" value={reservationId} />
      <select name="status" defaultValue={currentStatus}
        className="h-7 rounded-md bg-slate-800/50 border border-slate-700 text-white px-2 text-xs focus:border-violet-500 focus:outline-none">
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="no_show">No Show</option>
      </select>
      <Button type="submit" size="sm" disabled={pending}
        className="bg-slate-700 hover:bg-slate-600 text-white text-xs h-7 px-2">
        {pending ? '...' : 'Set'}
      </Button>
    </form>
  )
}
