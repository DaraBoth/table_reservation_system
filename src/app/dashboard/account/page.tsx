'use client'

import { useActionState } from 'react'
import { changeOwnPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AccountPage() {
  const [state, action, pending] = useActionState(changeOwnPassword, null)

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Change your password</p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Change Password</CardTitle>
          <CardDescription>Set a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">New Password</Label>
              <Input name="newPassword" type="password" required placeholder="min 6 characters"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Confirm Password</Label>
              <Input name="confirmPassword" type="password" required placeholder="Repeat password"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
            </div>
            {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
            {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
            <Button type="submit" disabled={pending}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0">
              {pending ? 'Saving...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
