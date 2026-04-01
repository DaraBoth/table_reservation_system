'use client'

import { useActionState } from 'react'
import { changeOwnPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logout } from '@/app/actions/auth'
import { Lock, LogOut, ShieldCheck, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AccountPage() {
  const [state, action, pending] = useActionState(changeOwnPassword, null)

  return (
    <div className="space-y-6 max-w-lg mx-auto">

      {/* Profile Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-3 pt-8 pb-7">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <span className="text-3xl font-black text-white">👤</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-white">My Account</h1>
          <p className="text-slate-400 text-sm mt-0.5">Staff Member</p>
        </div>
      </div>

      {/* Security Section */}
      <section>
        <div className="flex items-center gap-2 px-1 mb-3">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Security</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {/* Section header row */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/15 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Change Password</p>
              <p className="text-xs text-slate-500 mt-0.5">Set a new password for your account</p>
            </div>
          </div>

          {/* Form */}
          <form action={action} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                New Password
              </label>
              <Input
                name="newPassword"
                type="password"
                required
                placeholder="At least 6 characters"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500 h-14 rounded-2xl text-base px-4"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Confirm Password
              </label>
              <Input
                name="confirmPassword"
                type="password"
                required
                placeholder="Type it again"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500 h-14 rounded-2xl text-base px-4"
              />
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                <p className="text-sm text-red-400">{state.error}</p>
              </div>
            )}
            {state?.success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3">
                <p className="text-sm text-emerald-400 flex items-center gap-2">
                  <span>✓</span> {state.success}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-2xl font-bold text-base shadow-lg shadow-violet-500/20"
            >
              {pending ? 'Saving...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </section>

      {/* Sign Out Section */}
      <section>
        <div className="flex items-center gap-2 px-1 mb-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Session</h2>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-4 p-4 bg-slate-900 border border-red-500/20 rounded-2xl text-left active:scale-[0.98] transition-all hover:border-red-500/40 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-400">Sign Out</p>
              <p className="text-xs text-slate-500 mt-0.5">Log out from this device</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
          </button>
        </form>
      </section>

      {/* App info footer */}
      <p className="text-center text-xs text-slate-700 pb-2">
        TableBook · Restaurant Booking System
      </p>
    </div>
  )
}
