'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { tempRegisterSuperadmin } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ShieldAlert } from 'lucide-react'

export default function RegisterSuperadminPage() {
  const [state, action, pending] = useActionState(tempRegisterSuperadmin, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 rounded-[28px] overflow-hidden shadow-[0_0_40px_-5px_rgba(139,92,246,0.3)] border border-white/10 mb-5 animate-in fade-in zoom-in duration-700">
            <Image src="/logo.png" alt="TableBook Logo" fill className="object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Superadmin Setup</h1>
          <p className="text-slate-400 mt-2">Initialize your system access</p>
        </div>

        {/* Manual Alert Replacement */}
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-red-400 text-sm leading-none mb-1">Security Warning</h5>
            <p className="text-red-400/80 text-xs leading-relaxed">
              This is a temporary registration tool. <strong>Delete this page immediately</strong> after creating your account to prevent unauthorized access.
            </p>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to gain full platform control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="System Administrator"
                  required
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-violet-500 transition-colors h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="superadmin"
                  required
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-violet-500 transition-colors h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-violet-500 transition-colors h-11"
                />
              </div>

              {state?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                  {state.error}
                </div>
              )}

              {state?.success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1">
                  {state.success}
                </div>
              )}

              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold h-11 shadow-lg shadow-violet-500/20 border-0 transition-all active:scale-[0.98]"
              >
                {pending ? 'Initializing...' : 'Create Superadmin Account'}
              </Button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-sm text-slate-500 hover:text-violet-400 transition-colors">
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase tracking-widest font-bold">
          &copy; 2026 TableBook Platform &bull; Security Critical
        </p>
      </div>
    </div>
  )
}
