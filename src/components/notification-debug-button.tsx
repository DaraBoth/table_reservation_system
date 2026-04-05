'use client'

import { useTransition } from 'react'
import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { sendTestNotification } from '@/app/actions/notifications'
import { cn } from '@/lib/utils'

export function NotificationDebugButton({ restaurantId }: { restaurantId?: string }) {
  const [isPending, startTransition] = useTransition()

  if (!restaurantId) {
    return null
  }

  const handleSendTest = () => {
    startTransition(async () => {
      console.debug('[push:test] Starting test notification send', { restaurantId })

      const result = await sendTestNotification(restaurantId)

      if (!result.ok) {
        console.error('[push:test] Test notification failed', result)
        toast.error(result.error || 'Test notification failed.')
        return
      }

      console.debug('[push:test] Test notification completed', result)
      toast.success(
        `Test sent. Targets: ${result.attemptedCount ?? 0}, delivered: ${result.sentCount ?? 0}, failed: ${result.failedCount ?? 0}. Debug: ${result.debugId}`
      )
    })
  }

  return (
    <button
      type="button"
      onClick={handleSendTest}
      disabled={isPending}
      className={cn(
        'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90',
        'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
      )}
      title={isPending ? 'Sending test notification...' : 'Send test notification'}
    >
      <FlaskConical className="w-4 h-4" />
    </button>
  )
}