'use client'

import { useActionState, useState } from 'react'
import { resetUserPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { KeyRound, Eye, EyeOff } from 'lucide-react'

export function StaffPasswordResetButton({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState(resetUserPassword, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all active:scale-95 shadow-inner">
            <KeyRound className="w-4 h-4" />
          </button>
        }
      />
      <SheetContent side="bottom" className="bg-slate-950 border-slate-800 text-white p-6 rounded-t-3xl">
        <SheetHeader className="p-0 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-1">
            <KeyRound className="w-6 h-6 text-violet-400" />
          </div>
          <SheetTitle className="text-lg font-black text-white italic tracking-tight">Access Recovery</SheetTitle>
          <p className="text-sm text-slate-400">Set a new password for <span className="text-white font-bold">{name}</span></p>
        </SheetHeader>

        <form action={action} className="space-y-4 mt-1">
          <input type="hidden" name="userId" value={userId} />

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">
              New Password
            </label>
            <div className="relative group">
              <Input
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 6 characters"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
      </SheetContent>
    </Sheet>
  )
}
