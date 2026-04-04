'use client'

import { useActionState } from 'react'
import { deleteCommonCustomer } from '@/app/actions/customers'
import { Trash2 } from 'lucide-react'

type ActionState = { error: string } | { success: true } | null

export function DeleteCustomerButton({ id, name, restaurantId }: { id: string; name: string; restaurantId: string }) {
  const [, action, pending] = useActionState<ActionState, FormData>(deleteCommonCustomer as any, null)

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!confirm(`Remove "${name}" from the saved list?`)) e.preventDefault()
        }}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
        title="Remove from saved list"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  )
}
