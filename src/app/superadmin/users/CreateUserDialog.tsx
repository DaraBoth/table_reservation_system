'use client'

import { useActionState, useState } from 'react'
import { superadminCreateUser } from '@/app/actions/memberships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tables } from '@/lib/types/database'

export function CreateUserDialog({ restaurants }: { restaurants: Tables<'restaurants'>[] }) {
  const [state, action, pending] = useActionState(superadminCreateUser, null)
  const [role, setRole] = useState<string>('staff')

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25">
            + Create New User
          </Button>
        }
      />
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle>Create System User</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-sm">Full Name *</Label>
              <Input name="fullName" required placeholder="John Doe"
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-sm">Username *</Label>
              <Input name="username" required placeholder="johndoe"
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">Password *</Label>
            <Input name="password" type="password" required placeholder="min 6 characters"
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-sm">Access Role *</Label>
              <Select name="role" value={role} onValueChange={(val) => setRole(val || 'staff')}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground focus:border-violet-500">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Restaurant Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(role === 'admin' || role === 'staff') && (
              <div className="space-y-1.5">
                <Label className="text-foreground/70 text-sm">Restaurant Assignment *</Label>
                <Select name="restaurantId" required>
                  <SelectTrigger className="bg-muted/50 border-border text-foreground focus:border-violet-500">
                    <SelectValue placeholder="Select restaurant" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {restaurants.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {state?.error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-2 rounded">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">{state.success}</p>}
          
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0 shadow-lg shadow-violet-500/25 mt-2">
            {pending ? 'Creating Account...' : 'Confirm and Create Account'}
          </Button>
          
          <p className="text-[10px] text-muted-foreground text-center">
            The account will be active immediately. You can disable it later from the user list.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
