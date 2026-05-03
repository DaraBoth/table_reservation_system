'use client'

import { useActionState, useState } from 'react'
import { cancelReservation, updateReservationStatus } from '@/app/actions/reservations'
import { getOrCreateDeviceToken } from '@/lib/push-client'

import { cn } from '@/lib/utils'
import { Clock, CircleCheck, UserCheck, CheckCheck, UserX, Ban, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function CancelReservationButton({ reservationId, restaurantId }: { reservationId: string; restaurantId: string }) {
  const { t } = useTranslation()
  const [, action, pending] = useActionState(cancelReservation, null)
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="deviceToken" value={getOrCreateDeviceToken()} />

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all font-bold text-sm"
      >
        <Ban className="w-4 h-4" />
        {pending ? t('dashboard.cancelling', { defaultValue: 'Cancelling...' }) : t('dashboard.cancelThisBooking', { defaultValue: 'Cancel This Booking' })}
      </button>
    </form>
  )
}

export function UpdateStatusButton({
  reservationId,
  restaurantId,
  currentStatus,
}: {
  reservationId: string
  restaurantId: string
  currentStatus: string
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(currentStatus)
  const [state, action, pending] = useActionState(updateReservationStatus, null)

  const statusOptions: Array<{
    value: 'pending' | 'confirmed' | 'arrived' | 'completed' | 'no_show' | 'cancelled'
    label: string
    icon: LucideIcon
    color: string
  }> = [
    { value: 'pending', label: t('status.pending', { defaultValue: 'Waiting' }), icon: Clock, color: 'border-amber-500/40   bg-amber-500/10   text-amber-300' },
    { value: 'confirmed', label: t('status.confirmed', { defaultValue: 'Confirmed' }), icon: CircleCheck, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { value: 'arrived', label: t('status.arrived', { defaultValue: 'Arrived' }), icon: UserCheck, color: 'border-blue-500/40    bg-blue-500/10    text-blue-300' },
    { value: 'completed', label: t('status.completed', { defaultValue: 'Done' }), icon: CheckCheck, color: 'border-border/40   bg-muted/40   text-foreground/70' },
    { value: 'no_show', label: t('status.no_show', { defaultValue: 'No Show' }), icon: UserX, color: 'border-orange-500/40  bg-orange-500/10  text-orange-300' },
    { value: 'cancelled', label: t('status.cancelled', { defaultValue: 'Cancelled' }), icon: Ban, color: 'border-red-500/40     bg-red-500/10     text-red-300' },
  ]

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="status" value={selected} />
      <input type="hidden" name="deviceToken" value={getOrCreateDeviceToken()} />


      {/* Chip grid — 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {statusOptions.map(opt => {
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
              <opt.icon className="w-4 h-4 shrink-0" />
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
            ? 'bg-linear-to-r from-violet-600 to-indigo-600 text-foreground shadow-lg shadow-violet-500/20'
            : 'bg-muted text-muted-foreground/60 cursor-not-allowed'
        )}
      >
        {pending
          ? t('dashboard.updating', { defaultValue: 'Updating...' })
          : selected === currentStatus
            ? t('dashboard.selectNewStatusAbove', { defaultValue: 'Select a new status above' })
            : t('dashboard.setToStatus', { defaultValue: 'Set to "{{status}}"', status: statusOptions.find(o => o.value === selected)?.label || selected })}
      </button>

      {state?.error && <p className="text-xs text-red-400 text-center">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400 text-center flex items-center justify-center gap-1"><Check className="w-3 h-3" /> {t('dashboard.statusUpdated', { defaultValue: 'Status updated' })}</p>}
    </form>
  )
}
