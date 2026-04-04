'use client'

import { useActionState } from 'react'
import { deleteUserAccount } from '@/app/actions/memberships'
import { Button } from '@/components/ui/button'

export function DeleteUserButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(deleteUserAccount, null)

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <Button 
        type="submit" 
        variant="ghost" 
        size="sm" 
        disabled={pending}
        className="text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/5 h-8"
      >
        {pending ? '...' : 'Delete'}
      </Button>
      {state?.error && <p className="sr-only">{state.error}</p>}
    </form>
  )
}
