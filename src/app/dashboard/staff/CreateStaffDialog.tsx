'use client'

import { useActionState } from 'react'
import { createStaffAccount } from '@/app/actions/memberships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function CreateStaffDialog() {
  const [state, action, pending] = useActionState(createStaffAccount, null)
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25">
            + Add Staff
          </Button>
        }
      />
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Staff Account</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Full Name *</Label>
            <Input name="fullName" required placeholder="Jane Doe"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Username *</Label>
            <Input name="username" required placeholder="jane or jane@email.com"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Password *</Label>
            <Input name="password" type="password" required placeholder="min 6 characters"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
          </div>
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0">
            {pending ? 'Creating...' : 'Create Staff Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
