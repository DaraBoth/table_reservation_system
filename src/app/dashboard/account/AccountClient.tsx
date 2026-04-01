'use client'

import { useActionState } from 'react'
import { changeOwnPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import { Lock, LogOut, ShieldCheck, ChevronRight, Store, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountClientProps {
  user: any
  membership: any
  profile: any
}

export function AccountClient({ user, membership, profile }: AccountClientProps) {
  const [state, action, pending] = useActionState(changeOwnPassword, null)
  const isAdmin = ['admin', 'superadmin'].includes(membership?.role || '')

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">

      {/* Profile Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center gap-3 pt-8 pb-7 shadow-xl">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <span className="text-3xl font-black text-white">👤</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-white italic tracking-tight uppercase tracking-tighter">
            {profile?.full_name || 'My Account'}
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {membership?.role === 'admin' ? 'Business Administrator' : membership?.role === 'superadmin' ? 'Super Admin' : 'Staff Member'} · {membership?.restaurants?.name || 'TableBook'}
          </p>
        </div>
      </div>

      {/* Business Section (Admin Only) */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 px-1 mb-3">
            <Store className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Management</h2>
          </div>

          <Link
            href="/dashboard/account/restaurant"
            className="w-full flex items-center gap-4 p-5 bg-slate-900 border border-slate-800 rounded-[2rem] text-left active:scale-[0.98] transition-all hover:border-violet-500/40 group shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600/20 transition-all">
              <Store className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white italic uppercase tracking-tight">Business Profile</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Edit restaurant details & contact</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition-all transform group-hover:translate-x-1" />
          </Link>
        </section>
      )}

      {/* Security Section */}
      <section>
        <div className="flex items-center gap-2 px-1 mb-3">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Security</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-md">
          {/* Section header row */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-800/50">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/15 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white italic uppercase tracking-tight">Change Password</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Set a new password for security</p>
            </div>
          </div>

          {/* Form */}
          <form action={action} className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                New Password
              </label>
              <Input
                name="newPassword"
                type="password"
                required
                placeholder="At least 6 characters"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-700 focus:border-violet-500 h-12 rounded-xl text-sm font-bold px-4 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                Confirm Password
              </label>
              <Input
                name="confirmPassword"
                type="password"
                required
                placeholder="Type it again"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-700 focus:border-violet-500 h-12 rounded-xl text-sm font-bold px-4 shadow-sm"
              />
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                <p className="text-sm text-red-400 font-bold">⚠️ {state.error}</p>
              </div>
            )}
            {state?.success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3">
                <p className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                  <span>✓</span> {state.success}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-2xl font-black text-base shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
            >
              {pending ? 'Saving Password...' : 'Update Password'}
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
            className="w-full flex items-center gap-4 p-4 bg-slate-900 border border-red-500/20 rounded-[2rem] text-left active:scale-[0.98] transition-all hover:border-red-500/40 group shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-all">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-red-400 italic uppercase tracking-tight">Sign Out</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Log out from this device</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-red-400 transition-all transform group-hover:translate-x-1" />
          </button>
        </form>
      </section>

      {/* App info footer */}
      <p className="text-center text-[10px] text-slate-700 pt-4 font-black uppercase tracking-[0.2em] opacity-40">
        TableBook · Premium POS Solution
      </p>
    </div>
  )
}
