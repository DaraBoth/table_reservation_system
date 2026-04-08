'use client'

import { useActionState, useState } from 'react'
import { createStaffAccount } from '@/app/actions/memberships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Eye, EyeOff, Plus } from 'lucide-react'

export function CreateStaffDialog({ restaurantId }: { restaurantId: string }) {
  const [state, action, pending] = useActionState(createStaffAccount, null)
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="h-11 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 text-foreground font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center gap-2 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm">Add Staff</span>
          </Button>
        }
      />
      <SheetContent side="bottom" className="bg-background border-border text-foreground p-6 rounded-t-3xl">
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-foreground text-lg font-black italic tracking-tight">Expand Your Crew</SheetTitle>
          <p className="text-xs text-muted-foreground font-bold">Create a secure login for a new team member</p>
        </SheetHeader>
        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm font-bold uppercase tracking-widest px-1">Full Name *</Label>
            <Input name="fullName" required placeholder="Jane Doe"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm font-bold uppercase tracking-widest px-1">Username *</Label>
            <Input name="username" required placeholder="jane or jane@email.com"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm font-bold uppercase tracking-widest px-1">Password *</Label>
            <div className="relative group">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="min 6 characters"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 h-14 rounded-2xl text-base px-4 font-medium pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-foreground font-black rounded-2xl text-base shadow-lg shadow-violet-500/20">
            {pending ? 'Creating...' : 'Create Staff Account'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
