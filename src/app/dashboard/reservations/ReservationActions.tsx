'use client'

import { useActionState, useState } from 'react'
import { cancelReservation, updateReservationStatus } from '@/app/actions/reservations'
import { cn } from '@/lib/utils'

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
        <span className="text-base">🚫</span>
        {pending ? 'Cancelling...' : 'Cancel This Booking'}
      </button>
    </form>
  )
}

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Waiting',    emoji: '⏳', color: 'border-amber-500/40   bg-amber-500/10   text-amber-300'  },
  { value: 'confirmed', label: 'Confirmed',   emoji: '✅', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'},
  { value: 'completed', label: 'Done',        emoji: '🎉', color: 'border-slate-500/40   bg-slate-500/10   text-slate-300'  },
  { value: 'no_show',   label: 'No Show',     emoji: '👻', color: 'border-orange-500/40  bg-orange-500/10  text-orange-300' },
] as const

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
                  : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              )}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="truncate">{opt.label}</span>
              {isActive && (
                <span className="ml-auto text-[10px] font-black opacity-70">✓</span>
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
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
        )}
      >
        {pending ? 'Updating...' : selected === currentStatus ? 'Select a new status above' : `Set to "${STATUS_OPTIONS.find(o => o.value === selected)?.label}"`}
      </button>

      {state?.error && <p className="text-xs text-red-400 text-center">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400 text-center">✓ Status updated</p>}
    </form>
  )
}
