'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Suspense } from 'react'

function LoginErrorBanner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const messages: Record<string, string> = {
    account_disabled: 'Your account has been disabled. Contact your administrator.',
    restaurant_suspended: 'Your restaurant account is currently suspended.',
    subscription_expired: 'Your restaurant subscription has expired. Contact support.',
  }
  if (!error || !messages[error]) return null
  return (
    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
      {messages[error]}
    </div>
  )
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="w-full">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/25">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">TableBook</h1>
        <p className="text-slate-400 text-sm mt-1">Restaurant Management System</p>
      </div>

      {/* Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>

        <form action={action} className="space-y-5 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-slate-300 text-sm">Username or Email</Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="superadmin or user@email.com"
              required
              autoComplete="username"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 h-11"
            />
          </div>

          {state?.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium transition-all duration-200 shadow-lg shadow-violet-500/25 border-0"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Staff access only · Contact your administrator for access
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
