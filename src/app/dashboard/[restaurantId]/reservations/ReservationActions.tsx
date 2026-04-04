'use client'

import { useActionState, useState } from 'react'
import { cancelReservation, updateReservationStatus } from '@/app/actions/reservations'
import { cn } from '@/lib/utils'
import { Clock, CircleCheck, UserCheck, CheckCheck, UserX, Ban, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [, action, pending] = useActionState(cancelReservation, null)
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="reservationId" value={reservationId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all font-bold text-sm"
      >
        <Ban className="w-4 h-4" />
        {pending ? 'Cancelling...' : 'Cancel This Booking'}
      </button>
    </form>
  )
}

const STATUS_OPTIONS: Array<{
  value: 'pending' | 'confirmed' | 'arrived' | 'completed' | 'no_show'
  label: string
  icon: LucideIcon
  color: string
}> = [
  { value: 'pending',   label: 'Waiting',   icon: Clock,       color: 'border-amber-500/40   bg-amber-500/10   text-amber-300'  },
  { value: 'confirmed', label: 'Confirmed', icon: CircleCheck, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'},
  { value: 'arrived',   label: 'Arrived',   icon: UserCheck,   color: 'border-blue-500/40    bg-blue-500/10    text-blue-300'   },
  { value: 'completed', label: 'Done',      icon: CheckCheck,  color: 'border-border/40   bg-muted/40   text-foreground/70'  },
  { value: 'no_show',   label: 'No Show',   icon: UserX,       color: 'border-orange-500/40  bg-orange-500/10  text-orange-300' },
]

export function UpdateStatusButton({
  reservationId,
  currentStatus,
}: {
  reservationId: string
  currentStatus: string
}) {
  const [selected, setSelected] = useState(currentStatus)
  const [state, action, pending] = useActionState(updateReservationStatus, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="status" value={selected} />

      {/* Chip grid — 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map(opt => {
          const isActive = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                'flex items-center gap-2 h-12 px-3 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95',
                isActive
                  ? `${opt.color} shadow-sm`
                  : 'border-border bg-background text-muted-foreground hover:border-border hover:text-foreground/70'
              )}
            >
              <opt.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{opt.label}</span>
              {isActive && (
                <Check className="ml-auto w-3 h-3 opacity-70" />
              )}
            </button>
          )
        })}
      </div>

      {/* Update button — only enabled when status changed */}
      <button
        type="submit"
        disabled={pending || selected === currentStatus}
        className={cn(
          'w-full h-12 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]',
          selected !== currentStatus
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-foreground shadow-lg shadow-violet-500/20'
            : 'bg-muted text-muted-foreground/60 cursor-not-allowed'
        )}
      >
        {pending ? 'Updating...' : selected === currentStatus ? 'Select a new status above' : `Set to "${STATUS_OPTIONS.find(o => o.value === selected)?.label}"`}
      </button>

      {state?.error && <p className="text-xs text-red-400 text-center">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400 text-center flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Status updated</p>}
    </form>
  )
}
