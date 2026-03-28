'use client'

import { useActionState } from 'react'
import { resetUserPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function StaffPasswordResetButton({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState(resetUserPassword, null)
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-7">
            Reset Password
          </Button>
        }
      />
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password — {name}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="userId" value={userId} />
          <Input name="newPassword" type="password" required placeholder="New password (min 6 chars)"
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0">
            {pending ? 'Resetting...' : 'Set New Password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
