'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Suspense } from 'react'
import Image from 'next/image'

function LoginErrorBanner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const messages: Record<string, string> = {
    account_disabled: 'Your account is disabled. Please contact your manager.',
    restaurant_suspended: 'This restaurant account is stopped. Please contact support.',
    subscription_expired: 'Your subscription has ended. Please contact support.',
  }
  if (!error || !messages[error]) return null
  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
      {messages[error]}
    </div>
  )
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-12">
      {/* App Icon + Name */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="relative w-24 h-24 rounded-[32px] overflow-hidden shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] border border-white/10">
          <Image src="/logo.png" alt="TableBook Logo" fill className="object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">TableBook</h1>
          <p className="text-slate-400 text-sm mt-1">Restaurant Booking System</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>

        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>

        <form action={action} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-slate-300 text-sm font-semibold">
              Username or Email
            </Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="your@email.com"
              required
              autoComplete="username"
              className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-violet-500 h-14 rounded-2xl text-base px-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 text-sm font-semibold">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-violet-500 h-14 rounded-2xl text-base px-4"
            />
          </div>

          {state?.error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-violet-500/30 border-0 rounded-2xl mt-2"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Staff only · Ask your manager if you need help
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
