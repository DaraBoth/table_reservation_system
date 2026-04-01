'use client'

import { useActionState } from 'react'
import { resetUserPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { KeyRound } from 'lucide-react'

export function StaffPasswordResetButton({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState(resetUserPassword, null)

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-500/50 transition-all active:scale-95">
            <KeyRound className="w-4 h-4" />
          </button>
        }
      />
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-sm rounded-3xl mx-4">
        <DialogHeader className="pb-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-violet-400" />
          </div>
          <DialogTitle className="text-lg font-black text-white">Reset Password</DialogTitle>
          <p className="text-sm text-slate-400">Set a new password for <span className="text-white font-bold">{name}</span></p>
        </DialogHeader>

        <form action={action} className="space-y-4 mt-1">
          <input type="hidden" name="userId" value={userId} />

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
              New Password
            </label>
            <Input
              name="newPassword"
              type="password"
              required
              placeholder="At least 6 characters"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500 h-14 rounded-2xl text-base px-4"
            />
          </div>

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}
          {state?.success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3">
              <p className="text-sm text-emerald-400">✓ {state.success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-2xl font-bold text-base"
          >
            {pending ? 'Setting Password...' : 'Set New Password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
