'use client'

import { useActionState, useState } from 'react'
import { createStaffAccount } from '@/app/actions/memberships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Eye, EyeOff } from 'lucide-react'

export function CreateStaffDialog() {
  const [state, action, pending] = useActionState(createStaffAccount, null)
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25 text-white font-black h-12">
            + Add Staff
          </Button>
        }
      />
      <SheetContent side="bottom" className="bg-slate-950 border-slate-800 text-white p-6 rounded-t-3xl">
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-white text-lg font-black italic tracking-tight">Expand Your Crew</SheetTitle>
          <p className="text-xs text-slate-500 font-bold">Create a secure login for a new team member</p>
        </SheetHeader>
        <form action={action} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm font-bold uppercase tracking-widest px-1">Full Name *</Label>
            <Input name="fullName" required placeholder="Jane Doe"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm font-bold uppercase tracking-widest px-1">Username *</Label>
            <Input name="username" required placeholder="jane or jane@email.com"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm font-bold uppercase tracking-widest px-1">Password *</Label>
            <div className="relative group">
              <Input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="min 6 characters"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium pr-12" 
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
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-white font-black rounded-2xl text-base shadow-lg shadow-violet-500/20">
            {pending ? 'Creating...' : 'Create Staff Account'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
